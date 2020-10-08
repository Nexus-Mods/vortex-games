const Promise = require('bluebird');
const path = require('path');
const { actions, fs, FlexLayout, log, selectors, util } = require('vortex-api');
const rjson = require('relaxed-json');
const semver = require('semver');
const shortId = require('shortid');

const React = require('react');
const BS = require('react-bootstrap');

// Nexus Mods id for the game.
const BLADEANDSORCERY_ID = 'bladeandsorcery';
const I18N_NAMESPACE = 'game-bladeandsorcery';
const RESOURCES_FILE = 'resources.assets';
const UMA_PRESETS_FOLDER = 'UMAPresets';

// MulleDK19 B&S mods are expected to have this json file at its root directory.
const MULLE_MOD_INFO = 'mod.json';

// Official mod manifest file.
const OFFICIAL_MOD_MANIFEST = 'manifest.json';

// The global file holds current gameversion information
//  we're going to use this to compare against a mod's expected
//  gameversion and inform users of possible incompatibility.
//  (The global file is located in the game's StreamedAssets/Default path)
//  *** U6 BACKWARDS COMPATIBILITY ***
const GLOBAL_FILE = 'global.json';

// The global file has been renamed to Game.json in update 7.
//  going to temporarily keep Global.json for backwards compatibility.
const GAME_FILE = 'game.json';

async function getJSONElement(filePath, element) {
  return fs.readFileAsync(filePath, { encoding: 'utf-8' })
    .then(data => {
      try {
        const modData = rjson.parse(util.deBOM(data));
        const elementData = util.getSafe(modData, [element], undefined);
        return elementData !== undefined
          ? Promise.resolve(elementData)
          : Promise.reject(new util.DataInvalid(`"${element}" JSON element is missing`));
      } catch (err) {
        return ((err.message.indexOf('Unexpected end of JSON input') !== -1)
             || (err.name.indexOf('SyntaxError') !== -1))
          ? Promise.reject(new util.DataInvalid('Invalid manifest.json file'))
          : Promise.reject(err);
      }
    });
}

async function getModName(destination, modFile, element, ext) {
  const modFilePath = path.join(destination, modFile);
  let modName;
  try {
    modName = await getJSONElement(modFilePath, element);
  } catch (err) {
    return Promise.reject(err);
  }

  if (modName === undefined) {
    return Promise.reject(new util.DataInvalid(`"${element}" JSON element is missing`));
  }

  // remove all characters except for characters and numbers.
  modName = modName.replace(/[^a-zA-Z0-9]+/g, '');

  return ext !== undefined
    ? Promise.resolve(path.basename(modName, ext))
    : Promise.resolve(modName);
}

//GAME IS ALSO FOUND IN THE OCULUS STORE!!
function findGame() {
  return util.steam.findByAppId('629730')
      .then(game => game.gamePath);
}

function prepareForModding(discovery, api) {
  const state = api.store.getState();
  const profile = selectors.activeProfile(state);
  //api.store.dispatch(actions.setLoadOrder(profile.id, []));
  return fs.ensureDirWritableAsync(path.join(discovery.path, streamingAssetsPath()),
    () => Promise.resolve());
}

function testModInstaller(files, gameId, fileName) {
  // Make sure we're able to support this mod.
  const supported = (gameId === BLADEANDSORCERY_ID) &&
    (files.find(file => path.basename(file).toLowerCase() === fileName) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function streamingAssetsPath() {
  return path.join('BladeAndSorcery_Data', 'StreamingAssets');
}

async function checkModGameVersion(destination, minModVersion, modFile) {
  const coercedMin = semver.coerce(minModVersion.version);
  const minVersion = minModVersion.majorOnly
    ? coercedMin.major + '.x'
    : `>=${coercedMin.version}`;
  try {
    let modVersion = await getJSONElement(path.join(destination, modFile), 'GameVersion');
    modVersion = modVersion.toString().replace(',', '.');
    const coercedMod = semver.coerce(modVersion.toString());
    if (coercedMod === null) {
      return Promise.reject(new util.DataInvalid('Mod manifest has an invalid GameVersion element'));
    }

    return Promise.resolve({
      match: semver.satisfies(coercedMod.version, minVersion),
      modVersion: coercedMod.version,
      globalVersion: coercedMin.version,
    });
  } catch (err) {
    return Promise.reject(err);
  }
}

function findGameConfig(discoveryPath) {
  const expectedLocation = path.join(discoveryPath, streamingAssetsPath(), 'Default');
  return fs.readdirAsync(expectedLocation)
    .then(entries => {
      const configFile = entries.find(file => (file.toLowerCase() === GAME_FILE)
        || (file.toLowerCase() === GLOBAL_FILE));
      return (configFile !== undefined)
        ? Promise.resolve(path.join(expectedLocation, configFile))
        : Promise.reject(new Error('Missing config file.'));
    });
}

async function getMinModVersion(discoveryPath) {
  return findGameConfig(discoveryPath).then(configFile => {
    return getJSONElement(configFile, 'minModVersion')
    .then(version => { return { version, majorOnly: false } })
    .catch(err => (err.message.indexOf('JSON element is missing') !== -1)
      ? getJSONElement(configFile, 'gameVersion')
          .then(version => { return { version, majorOnly: true } })
      : Promise.reject(err));
  });
}

async function installOfficialMod(files,
                        destinationPath,
                        gameId,
                        progressDelegate,
                        api) {
  const t = api.translate;
  const versionMismatchDialog = (gameVersion, modGameVersion) => new Promise((resolve, reject) => {
    api.store.dispatch(
      actions.showDialog(
        'warning',
        'Game Version Mismatch',
        { text: t('The mod you\'re attempting to install has been created for game version: "{{modVer}}"; '
                + 'the currently installed game version is: "{{gameVer}}", version mismatches may '
                + 'cause unexpected results inside the game, please keep this in mind if you choose to continue.',
        { replace: { modVer: modGameVersion, gameVer: gameVersion } }) },
        [
          { label: 'Cancel', action: () => reject(new util.UserCanceled()) },
          {
            label: 'Continue installation', action: () => resolve()
          }
        ]
      )
    );
  });

  let minModVersion;
  const discoveryPath = getDiscoveryPath(api);
  try {
    minModVersion = await getMinModVersion(discoveryPath);
    minModVersion.version = minModVersion.version.toString().replace(',', '.');
  }
  catch (err) {
    if (err.message.indexOf('Missing config file.') !== -1) {
      api.showErrorNotification('Missing config file', 'Please run the game at least once to ensure it '
        + 'generates all required game files; alternatively re-install the game.', { allowReport: false });
      return Promise.reject(new util.ProcessCanceled('Missing config file.'))
    }

    return Promise.reject(err);
  }

  if (minModVersion === undefined) {
    return Promise.reject(new util.DataInvalid('Failed to identify game version'));
  }

  const usedModNames = [];

  const manifestFiles = files.filter(file =>
    path.basename(file).toLowerCase() === OFFICIAL_MOD_MANIFEST);

  const createInstructions = (manifestFile) =>
    getModName(destinationPath, manifestFile, 'Name', undefined)
      .then(manifestModName => {
        const isUsedModName = usedModNames.find(modName => modName === manifestModName) !== undefined;
        const modName = (isUsedModName)
          ? manifestModName + '_' + shortId.generate()
          : manifestModName;

        usedModNames.push(modName);

        const idx = manifestFile.indexOf(path.basename(manifestFile));
        const rootPath = path.dirname(manifestFile);

        // Remove directories and anything that isn't in the rootPath.
        const filtered = files.filter(file =>
          ((file.indexOf(rootPath) !== -1)
          && (!file.endsWith(path.sep))));

        const instructions = filtered.map(file => {
          return {
            type: 'copy',
            source: file,
            destination: (manifestFiles.length === 1)
              ? file.substr(idx)
              : path.join(modName, file.substr(idx)),
          };
        });

        instructions.push({
          type: 'attribute',
          key: 'hasMultipleMods',
          value: (manifestFiles.length > 1),
        })

        return Promise.resolve(instructions);
      });

  return Promise.map(manifestFiles, manFile =>
    checkModGameVersion(destinationPath, minModVersion, manFile)
    .then(res => (!res.match)
      ? versionMismatchDialog(res.globalVersion, res.modVersion)
          .then(() => createInstructions(manFile))
      : createInstructions(manFile))
  ).then(manifestMods => {
    const instructions = manifestMods.reduce((prev, instructions) => {
      prev = prev.concat(instructions);
      return prev;
    }, []);

    return Promise.resolve({ instructions });
  });
}

async function installMulleMod(files,
                        destinationPath,
                        gameId,
                        progressDelegate,
                        api) {
  // MulleDK19's mod loader is no longer being updated and will not function
  //  with B&S version 6.0 and higher. We're going to keep this modType installer
  //  for the sake of stopping users from installing out of date mods.
  api.sendNotification({
    type: 'info',
    message: 'Incompatible Mod',
    actions: [
      { title: 'More', action: (dismiss) =>
        api.showDialog('info', 'Incompatible Mod', {
          text: api.translate('The mod you\'re attempting to install is not compatible with '
                            + 'Blade and Sorcery 6.0+ and cannot be installed by Vortex. '
                            + 'Please check the mod page for an updated version.')
        }, [ { label: 'Close', action: () => dismiss() } ])
      },
    ],
  });
  return Promise.reject(new util.ProcessCanceled());
}

function installUMAPresetReplacer(files,
                         destinationPath,
                         gameId,
                         progressDelegate) {
  const resourcesFile = files.find(file => path.basename(file) === RESOURCES_FILE);
  const UMAPresetDir = files.find(file => path.basename(file) === UMA_PRESETS_FOLDER);
  let idx = (path.basename(path.dirname(UMAPresetDir)) !== '.')
    ? (path.basename(path.dirname(UMAPresetDir)).length)
    : 0;

  // Remove directories and anything that isn't in the rootPath.
  const filtered = files.filter(file => 
    (!file.endsWith(path.sep)) && (path.basename(file) !== RESOURCES_FILE));

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: path.join('StreamingAssets', 'Default', file.substr(idx)),
    };
  });

  instructions.push({
    type: 'copy',
    source: resourcesFile,
    destination: resourcesFile,
  })

  return Promise.resolve({ instructions });
}

function instructionsHaveFile(instructions, fileName) {
  const copies = instructions.filter(instruction => instruction.type === 'copy');
  return new Promise((resolve, reject) => {
    const fileExists = copies.find(inst => path.basename(inst.destination).toLowerCase() === fileName) !== undefined;
    return resolve(fileExists);
  })
}

function testUMAContent(instructions) {
  const copies = instructions.filter(instruction => instruction.type === 'copy');
  return new Promise((resolve, reject) => {
    const isUMAMod = (copies.find(file => path.basename(file.destination) === RESOURCES_FILE) !== undefined)
                  && (copies.find(file => path.dirname(file.destination).indexOf(UMA_PRESETS_FOLDER) !== -1) !== undefined);
    return resolve(isUMAMod);
  })
}

function testUMAPresetReplacer(files, gameId) {
  // This is a very unconventional installer as it expects a resources.assets
  //  file containing the textures of the preset + the UMA presets in JSON format.
  //  mod authors seem to be packing these alongside each other... fun...
  //  Most importantly: https://www.nexusmods.com/bladeandsorcery/mods/31?tab=files
  const supported = ((gameId === BLADEANDSORCERY_ID)
                  && (files.find(file => path.basename(file) === RESOURCES_FILE) !== undefined)
                  && (files.find(file => path.basename(file) === UMA_PRESETS_FOLDER) !== undefined))
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

const getDiscoveryPath = (api) => {
  const store = api.store;
  const state = store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', BLADEANDSORCERY_ID], undefined);
  if ((discovery === undefined) || (discovery.path === undefined)) {
    // should never happen and if it does it will cause errors elsewhere as well
    log('error', 'bladeandsorcery was not discovered');
    return '.';
  }

  return discovery.path;
}

function migrate010(api, oldVersion) {
  if (semver.gte(oldVersion, '0.1.0')) {
    return Promise.resolve();
  }
  const state = api.store.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', BLADEANDSORCERY_ID], {});
  const modKeys = Object.keys(mods);
  if (modKeys.length === 0) {
    return Promise.resolve();
  }

  const activatorId = util.getSafe(state, ['settings', 'mods', 'activator', BLADEANDSORCERY_ID], undefined);
  const gameDiscovery =
    util.getSafe(state, ['settings', 'gameMode', 'discovered', BLADEANDSORCERY_ID], undefined);

  if ((gameDiscovery?.path === undefined)
      || (activatorId === undefined)) {
    // if this game is not discovered or deployed there is no need to migrate
    log('debug', 'skipping blade and sorcery migration because no deployment set up for it');
    return Promise.resolve();
  }

  // Holds mod ids of mods we failed to migrate.
  let failedToMigrate = [];

  const deployTarget = path.join(gameDiscovery.path, streamingAssetsPath());
  const stagingFolder = selectors.installPathForGame(state, BLADEANDSORCERY_ID);
  const officialMods = modKeys.filter(key => mods[key].type === 'bas-official-modtype')
    .map(key => mods[key]);
  return api.awaitUI()
    .then(() => api.emitAndAwait('purge-mods-in-path', BLADEANDSORCERY_ID, 'bas-official-modtype', deployTarget))
    .then(() => Promise.each(officialMods, mod => {
      const modPath = path.join(stagingFolder, mod.installationPath);
      let allEntries = [];
      return util.walk(modPath, entries => {
        allEntries = allEntries.concat(entries);
      }).then(() => {
        const manifestFiles = allEntries.filter(entry =>
          path.basename(entry).toLowerCase() === OFFICIAL_MOD_MANIFEST);
        let directories = allEntries.filter(entry => path.extname(path.basename(entry)) === '');
        const files = allEntries.filter(entry => path.extname(path.basename(entry)) !== '');
        api.store.dispatch(actions.setModAttribute(BLADEANDSORCERY_ID, mod.id, 'hasMultipleMods', manifestFiles.length > 1));
        if (manifestFiles.length === 1) {
          let newFiles = [];
          let newDirs = [];
          if (path.dirname(manifestFiles[0]) === modPath) {
            // Already formatted correctly.
            return Promise.resolve();
          }
          const modNameIdx = manifestFiles[0].toLowerCase()
                                            .split(path.sep)
                                            .indexOf(OFFICIAL_MOD_MANIFEST) - 1;
          // We can migrate this mod
          return Promise.each(files, (entry) => {
            const segments = entry.split(path.sep);
            segments.splice(modNameIdx, 1);
            const destination = segments.join(path.sep);
            const newDir = path.dirname(destination);
            return fs.ensureDirWritableAsync(newDir)
              .tap(() => {
                if (newDir !== modPath) {
                  newDirs.push(newDir);
                }
              })
              .catch(err => err.code === 'EEXIST' ? Promise.resolve() : Promise.reject(err))
              .then(() => fs.linkAsync(entry, destination)
                .tap(() => newFiles.push(destination))
                .catch(err => err.code === 'EEXIST' ? Promise.resolve() : Promise.reject(err)));
          })
          // Linking failed for some reason, remove the new links.
          .tapCatch(err => {
            failedToMigrate.push(mod.id);
            return Promise.each(newFiles, newFile => fs.unlinkAsync(newFile))
              .then(() => Promise.each(newDirs.reverse(), newDir => fs.removeAsync(newDir)))
          })
          .then(() => Promise.each(files, entry => fs.removeAsync(entry)))
          .then(() => Promise.each(directories.reverse(), dir => fs.removeAsync(dir)))
          .catch(err => (err instanceof util.UserCanceled)
            // No need to report the error if the user canceled the operation.
            ? Promise.resolve()
            : Promise.reject(err));
        }
      })
    }))
    .finally(() => {
      if (failedToMigrate.length > 0) {
        api.sendNotification({
          type: 'warning',
          message: 'Failed to migrate mods',
          actions: [
            { title: 'More', action: (dismiss) =>
              api.showDialog('info', 'Mods failed migration', {
                text: api.translate('As part of implementing the Load Order system for '
                                  + 'Blade and Sorcery, we were forced to change the way '
                                  + 'we install BaS mods. Vortex has just attempted to migrate '
                                  + 'your existing mods to the new file structure but failed. '
                                  + 'These will have to be re-installed manually in order to '
                                  + 'function properly. The mods that require re-installation are:\n\n'
                                  + '{{modIds}}',
                                  { replace: { modIds: failedToMigrate.join('\n') } })
              }, [ { label: 'Close', action: () => dismiss() } ])
            },
          ],
        });
      } else {
        api.store.dispatch(actions.setDeploymentNecessary(BLADEANDSORCERY_ID, true));
      }
    });
}

function loadOrderPrefix(api, mod) {
  const state = api.store.getState();

  const gameProfile = selectors.lastActiveProfileForGame(state, BLADEANDSORCERY_ID);
  if (gameProfile === undefined) {
    return 'ZZZZ-';
  }
  const profile = selectors.profileById(state, gameProfile);
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile?.id], []);

  const posToPrefix = (modId) => {
    const pos = loadOrder[modId]?.pos;
    if (pos === undefined) {
      return 'ZZZZ-';
    }

    return makePrefix(pos) + '-';
  };

  if (loadOrder[mod.id] === undefined) {
    // This mod isn't inside the LO yet - we try to find
    //  the last prefix and return its increment
    const lastEntry = Object.keys(loadOrder).reduce((prev, key) => {
      if (loadOrder[key].pos > prev.pos) {
        prev = loadOrder[key];
      }
      return prev;
    }, {});

    return (lastEntry?.prefix !== undefined)
      ? makePrefix(reversePrefix(lastEntry.prefix) + 1) + '-'
      : makePrefix(lastEntry.pos + 1) + '-';
  }

  if (loadOrder[mod.id]?.prefix !== undefined) {
    return loadOrder[mod.id].prefix + '-';
  }

  return posToPrefix(mod.id);
}

function reversePrefix(prefix) {
  prefix = prefix.split('');
  if (prefix.length !== 3) {
    return -1;
  }

  const pos = prefix.reduce((prev, iter) => {
    prev = prev + iter.charCodeAt(0);
    return prev;
  }, -195);

  return pos;
}

function makePrefix(input) {
  let res = '';
  let rest = input;
  while (rest > 0) {
    res = String.fromCharCode(65 + (rest % 25)) + res;
    rest = Math.floor(rest / 25);
  }
  return util.pad(res, 'A', 3);
}

async function getManuallyAdded(context, loadOrder) {
  const state = context.api.store.getState();
  const loKeys = Object.keys(loadOrder).map(key => key.toLowerCase());
  const mods = util.getSafe(state, ['persistent', 'mods', BLADEANDSORCERY_ID], {});
  const managedModNames = Object.keys(mods)
    .filter(key => mods[key]?.type === 'bas-official-modtype')
    .map(key => mods[key].id.replace(/[^a-zA-Z]+/g, '').toLowerCase());

  const invalidNames = [].concat(['default'], managedModNames);
  const modsPath = selectors.modPathsForGame(state, BLADEANDSORCERY_ID)['bas-official-modtype'];
  const modNames = {
    known: [],
    unknown: [],
  };
  const regex = new RegExp(/[A-Z][A-Z][A-Z]-/);
  await util.walk(modsPath, async (iter, stats) => {
    const modName = path.basename(iter);
    if (stats.isDirectory()
      && (!invalidNames.includes(modName.substr(4).toLowerCase()))
      && modName.match(regex)) {
        const hasManifest = await fs.statAsync(path.join(iter, OFFICIAL_MOD_MANIFEST))
          .then(() => Promise.resolve(true))
          .catch(err => Promise.resolve(false));
        if (hasManifest) {
          if (loKeys.includes(modName.substr(4).toLowerCase())) {
            modNames.known.push(modName);
          } else {
            modNames.unknown.push(modName);
          }
        }
      }
  })

  return Promise.resolve(modNames);
}

async function preSort(context, items, direction) {
  const state = context.api.store.getState();
  const activeProfile = selectors.activeProfile(state);
  const toLOPage = (itemList) => {
    return (direction === 'descending')
      ? Promise.resolve(itemList.reverse())
      : Promise.resolve(itemList);
  }

  if (activeProfile === undefined) {
    return toLOPage(items);
  }

  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
  const manuallyAdded = await getManuallyAdded(context, loadOrder);
  const allExternal = [].concat(manuallyAdded.known, manuallyAdded.unknown);
  const prepareDisplayItems = (displayItems, condition) => {
    // This func expects the display items to be provided
    //  in the order we expect the LO page to display the items;
    //  it will look at each display item and re-assign the prefixes so
    //  that they match the order, and assign any provided condition functor
    //  to managed mod entries.
    let lastPrefix = makePrefix(0);
    return displayItems.map((item, idx) => {
      if (allExternal.includes(item.prefix + '-' + item.id)) {
        lastPrefix = item.prefix;
        return item;
      }

      if (idx > 0) {
        const newPrefix = makePrefix(reversePrefix(lastPrefix) + 1);
        lastPrefix = newPrefix;
        return { ...item, prefix: newPrefix, condition }
      } else {
        return { ...item, prefix: makePrefix(idx), condition }
      }
    })
  }

  let presorted = items;
  const what = items.filter(item => allExternal.includes(item.prefix + '-' + item.id));
  if (what.length > 0) {
    presorted = prepareDisplayItems(items, undefined);
  }
  const externalDisplayItems = allExternal.map(modName => {
    const trimmed = modName.substr(4);
    const prefix = modName.substr(0, 3);
    return {
      id: trimmed,
      name: trimmed,
      imgUrl: path.join(__dirname, 'gameart.jpg'),
      external: true,
      prefix,
      condition: (lhs, rhs, predictedResult) => {
        // There's an attempt to move this external item;
        //  this may be the result of a potentially valid move
        //  between two managed mods but can potentially impact
        //  the external item - which we need to control.
        const item = predictedResult.find(item => item.id === trimmed);
        if (item === undefined) {
          // this shouldn't happen.
          return { success: false };
        }

        const maxIdx = reversePrefix(prefix);
        const predictedIdx = predictedResult.indexOf(item);
        const predictedPrefix = makePrefix(predictedIdx);
        const hasValidPosition = (predictedPrefix === prefix) || (maxIdx - predictedIdx >= 0);
        return  { success: hasValidPosition, errMessage: `Invalid change - ${modName}'s position would be invalid` };
      }
    };
  }).sort((a, b) => {
    return reversePrefix(a.prefix) - reversePrefix(b.prefix);
  });
  externalDisplayItems.forEach(item => {
    if (presorted.find(prs => prs.id === item.id) === undefined) {
      presorted.splice(reversePrefix(item.prefix), 0, item);
    }
  });

  presorted = prepareDisplayItems(presorted, (lhs, rhs, predictedResult) => {
    // Make sure that all externally added display items, are happy with
    //  their new position in the load order.
    const dndResult = externalDisplayItems.reduce((prev, item) => {
      if (prev?.success === true) {
        prev = item.condition(lhs, rhs, predictedResult);
      }
      return prev;
    }, { success: true });
    return { success: dndResult.success, errMessage: dndResult.errMessage };
  });

  return toLOPage(presorted);
}

let prevLoadOrder;
function infoComponent(context, props) {
  const t = context.api.translate;
  return React.createElement(BS.Panel, { id: 'loadorderinfo' },
    React.createElement('h2', {}, t('Managing your load order', { ns: I18N_NAMESPACE })),
    React.createElement(FlexLayout.Fixed, { style: { height: '30%' } },
    React.createElement('div', {},
    React.createElement('p', {}, t('You can adjust the load order for Blade and Sorcery by dragging and dropping '
    + 'mods up or down on this page. As the game loads its mods alphabetically - the AAA-ZZZ prefix will be added '
    + 'to the mod\'s folder name on every deployment event to guarantee that the game loads the mods in the order set inside Vortex. '
    + 'The higher prefix will win any conflicts (ZZZ > AAA)', { ns: I18N_NAMESPACE })))),
    React.createElement('div', { style: { height: '70%' } },
      React.createElement('p', {}, t('Please note:', { ns: I18N_NAMESPACE })),
      React.createElement('ul', {},
        React.createElement('li', {}, t('For the load order to be reflected correctly within the game\'s '
          + 'mods directory, the mods must be re-deployed once you\'ve finished changing the load order.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('If you cannot see your manually added mod in this load order, you '
          + 'may need to manually set the wanted prefix by renaming the mod\'s folder in the mods folder directly. '
          + 'as an example, lets say you have installed "FakeMod" and want to add it below your AAA-UnlimitedPotions mod, '
          + 'simply rename "FakeMod" to "AAB-FakeMod" and click the refresh button.', { ns: I18N_NAMESPACE })),
        React.createElement('li', {}, t('Manually added mods are restricted to the prefix you set and '
          + 'Vortex has functionality to ensure this is respected, e.g. AAB-MyMod, Vortex will pick up on that prefix and sort it '
          + 'correctly in the load order (e.g. after AAA-SomeMod but before AAC-AnotherMod).', { ns: I18N_NAMESPACE })))));
}

function main(context) {
  const getUMADestination = () => {
    return path.join(getDiscoveryPath(context.api), 'BladeAndSorcery_Data');
  }

  const getOfficialDestination = () => {
    return path.join(getDiscoveryPath(context.api), streamingAssetsPath());
  }

  context.registerGame({
    id: BLADEANDSORCERY_ID,
    name: 'Blade & Sorcery',
    mergeMods: true,
    queryPath: findGame,
    //supportedTools: tools,
    // FOMOD installer will act as a replacer by default.
    queryModPath: () => path.join(streamingAssetsPath(), 'Default'),
    logo: 'gameart.jpg',
    executable: () => 'BladeAndSorcery.exe',
    requiredFiles: ['BladeAndSorcery.exe'],
    requiresCleanup: true,
    setup: (discovery) => prepareForModding(discovery, context.api),
    environment: {
      SteamAPPId: '629730',
    },
    details: {
      // The default queryModPath result is used for replacement mods,
      //  this works in combination with the fomod stop patterns functionality
      //  to correctly identify the folder structure which works quite well and
      //  therefore should not be modified as that would require us to write duplicate code
      //  for the same functionality which could possibly be less reliable than the battle
      //  tested stop patterns.
      //
      // The BaS developers have requested that we do not open the StreamingAssets/Default
      //  folder when users click the "Open Game Mods Folder" button on the mods page.
      //  Instead of changing the path directly and write a migration function for such
      //  a minor use case - we're going to provide a custom "Open Mods Path" value to be
      //  used by the open-directory extension.
      customOpenModsPath: streamingAssetsPath(),
      steamAppId: 629730,
    },
  });

  context.registerMigration(old => migrate010(context.api, old));

  context.registerInstaller('bas-uma-mod', 25, testUMAPresetReplacer, installUMAPresetReplacer);
  context.registerModType('bas-uma-modtype', 15, (gameId) => (gameId === BLADEANDSORCERY_ID),
    getUMADestination, testUMAContent);

  context.registerInstaller('bas-mulledk19-mod', 25,
    (files, gameId) => testModInstaller(files, gameId, MULLE_MOD_INFO),
    (files, destinationPath, gameId, progressDelegate) => installMulleMod(files, destinationPath, gameId, progressDelegate, context.api));

  context.registerInstaller('bas-official-mod', 25,
    (files, gameId) =>
      testModInstaller(files, gameId, OFFICIAL_MOD_MANIFEST),
    (files, destinationPath, gameId, progressDelegate) =>
      installOfficialMod(files, destinationPath, gameId, progressDelegate, context.api));

  context.registerModType('bas-official-modtype', 15, (gameId) => (gameId === BLADEANDSORCERY_ID),
    getOfficialDestination, (instructions) => instructionsHaveFile(instructions, OFFICIAL_MOD_MANIFEST),
      { mergeMods: mod => loadOrderPrefix(context.api, mod) + mod.id.replace(/[^a-zA-Z]+/g, '') });

  context.registerLoadOrderPage({
    gameId: BLADEANDSORCERY_ID,
    createInfoPanel: (props) => infoComponent(context, props),
    filter: (mods) => mods.filter(mod => (mod.type === 'bas-official-modtype') && (mod?.attributes?.hasMultipleMods === false)),
    gameArtURL: `${__dirname}/gameart.jpg`,
    preSort: (items, direction) => preSort(context, items, direction),
    displayCheckboxes: false,
    callback: (loadOrder) => {
      if (prevLoadOrder === undefined) {
        prevLoadOrder = loadOrder;
      }

      if (JSON.stringify(prevLoadOrder) !== JSON.stringify(loadOrder)) {
        prevLoadOrder = loadOrder;
        context.api.store.dispatch(actions.setDeploymentNecessary(BLADEANDSORCERY_ID, true))
      }
    },
  });

  return true;
}

module.exports = {
  default: main,
};
