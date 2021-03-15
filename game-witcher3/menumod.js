const path = require('path');
const Promise = require('bluebird');
const { actions, fs, log, selectors, util } = require('vortex-api');
const IniParser = require('vortex-parse-ini');
const generate = require('shortid').generate;

const { GAME_ID, INPUT_XML_FILENAME, PART_SUFFIX } = require('./common');

// most of these are invalid on windows only but it's not worth the effort allowing them elsewhere
const INVALID_CHARS = /[:/\\*?"<>|]/g;
const INPUT_SETTINGS_FILENAME = 'input.settings';
const USER_SETTINGS_FILENAME = 'user.settings';
const BACKUP_TAG = '.vortex_backup';

// We're going to save per mod ini settings for each
//  file (where applicable) into this cache file so
//  we can keep track of changes that the user made
//  during his playthrough.
const CACHE_FILENAME = 'vortex_menumod.cache'
/* Cache format should be as follows:
  [
    {
      id: $modId
      filepath: '../input.settings',
      data: 'ini data in string format',
    },
    {
      id: $modId
      filename: '../user.settings',
      data: 'ini data in string format',
    },
  ]
*/
async function getExistingCache(state, activeProfile) {
  const stagingFolder = selectors.installPathForGame(state, GAME_ID);
  const modName = menuMod(activeProfile.name);
  const mod = util.getSafe(state, ['persistent', 'mods', GAME_ID, modName], undefined);
  if (mod === undefined) {
    return [];
  }

  try {
    const cacheData = await fs.readFileAsync(path.join(stagingFolder,
      mod.installationPath, CACHE_FILENAME), { encoding: 'utf8' });
    const currentCache = JSON.parse(cacheData);
    return currentCache;
  } catch (err) {
    // We were unable to read/parse the cache file - this is perfectly
    //  valid when the cache file hasn't been created yet, and even if/when
    //  the error is more serious - we shouldn't block the deployment.
    log('warn', 'W3: failed to read/parse cache file', err);
    return [];
  }
}

function toFileMapKey(filePath) {
  return path.basename(filePath)
             .toLowerCase()
             .replace(PART_SUFFIX, '');
};

function readModData(filePath) {
  return fs.readFileAsync(filePath, { encoding: 'utf8' })
    .catch(err => Promise.resolve(undefined));
}

function populateCache(api, activeProfile) {
  const state = api.store.getState();
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const modState = util.getSafe(activeProfile, ['modState'], {});

  let nextAvailableId = Object.keys(loadOrder).length;
  const getNextId = () => {
    return nextAvailableId++;
  }
  const invalidModTypes = ['witcher3menumoddocuments'];
  const enabledMods = Object.keys(mods)
    .filter(key => !!modState[key]?.enabled && !invalidModTypes.includes(mods[key].type))
    .sort((lhs, rhs) => (loadOrder[lhs]?.pos || getNextId()) - (loadOrder[rhs]?.pos || getNextId()))
    .map(key => mods[key]);

  const getRelevantModEntries = async (source) => {
    let allEntries = [];
    await require('turbowalk').default(source, entries => {
      const relevantEntries = entries.filter(entry =>
           (entry.filePath.endsWith(PART_SUFFIX))
        && (entry.filePath.indexOf(INPUT_XML_FILENAME) === -1))
              .map(entry => entry.filePath);

      allEntries = [].concat(allEntries, relevantEntries);
    }).catch(err => {
      if  (['ENOENT', 'ENOTFOUND'].indexOf(err.code) === -1) {
        log('error', 'Failed to lookup menu mod files',
          { path: path.join(stagingFolder, mod.installationPath), error: err.message });
      }
    })

    return allEntries;
  };

  const stagingFolder = selectors.installPathForGame(state, GAME_ID);
  return Promise.reduce(enabledMods, (accum, mod) => {
    return getRelevantModEntries(path.join(stagingFolder, mod.installationPath))
      .then(entries => {
        return Promise.each(entries, filepath => {
          return readModData(filepath)
            .then(data => {
              if (data !== undefined) {
                accum.push({ id: mod.id, filepath, data });
              }
            })
        })
        .then(() => Promise.resolve(accum))
      })
  }, [])
  .then(newCache => {
    const modName = menuMod(activeProfile.name);
    let mod = util.getSafe(state, ['persistent', 'mods', GAME_ID, modName], undefined);
    if (mod === undefined) {
      // We will create it on the next run.
      return Promise.resolve();
    }

    return fs.writeFileAsync(path.join(stagingFolder, mod.installationPath, CACHE_FILENAME), JSON.stringify(newCache));
  });
}

async function onWillDeploy(api, deployment, activeProfile) {
  const state = api.store.getState();
  if (activeProfile?.name === undefined) {
    return;
  }
  const installPath = selectors.installPathForGame(state, activeProfile.gameId);
  const modName = menuMod(activeProfile.name);
  const destinationFolder = path.join(installPath, modName);
  const game = util.getGame(activeProfile.gameId);
  const discovery = selectors.discoveryByGame(state, activeProfile.gameId);
  const modPaths = game.getModPaths(discovery.path);
  const docModPath = modPaths['witcher3menumoddocuments'];
  const currentCache = await getExistingCache(state, activeProfile);
  if (currentCache.length === 0) {
    // Nothing to compare, user does not have a cache.
    return;
  }

  const docFiles = deployment['witcher3menumodroot'].filter(file => (file.relPath.endsWith(PART_SUFFIX))
    && (file.relPath.indexOf(INPUT_XML_FILENAME) === -1));

  if (docFiles.length <= 0) {
    // No doc files, no problem.
    return;
  }

  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const modState = util.getSafe(activeProfile, ['modState'], {});
  const invalidModTypes = ['witcher3menumoddocuments'];
  const enabledMods = Object.keys(mods)
    .filter(key => !!modState[key]?.enabled && !invalidModTypes.includes(mods[key].type));

  const parser = new IniParser.default(new IniParser.WinapiFormat());

  const fileMap = await cacheToFileMap(state, activeProfile);
  if (fileMap === undefined) {
    return;
  }

  const keys = Object.keys(fileMap);
  const matcher = (entry) => keys.includes(toFileMapKey(entry.relPath));
  const newCache = await Promise.reduce(keys, async (accum, key) => {
    if (docFiles.find(matcher) !== undefined) {
      const mergedData = await parser.read(path.join(docModPath, key));
      await Promise.each(fileMap[key], async iter => {
        if (enabledMods.includes(iter.id)) {
          const tempPath = path.join(destinationFolder, key) + generate();
          const modData = await toIniFileObject(iter.data, tempPath);
          const modKeys = Object.keys(modData.data);
          let changed = false;
          return Promise.each(modKeys, modKey => {
            if ((mergedData.data[modKey] !== undefined)
              && (modData.data[modKey] !== undefined)
              && (mergedData.data[modKey] !== modData.data[modKey])) {
                modData.data[modKey] = mergedData.data[modKey];
                changed = true;
            }
          }).then(async () => {
            let newModData;
            if (changed) {
              await parser.write(iter.filepath, modData);
              newModData = await readModData(iter.filepath);
            } else {
              newModData = iter.data;
            }

            if (newModData !== undefined) {
              accum.push({ id: iter.id, filepath: iter.filepath, data: newModData });
            }
          });
        }
      });
    }
    return Promise.resolve(accum);
  }, []);

  return fs.writeFileAsync(path.join(destinationFolder, CACHE_FILENAME), JSON.stringify(newCache));
}

async function toIniFileObject(data, tempDest) {
  // Given that winapi requires a file to correctly read/parse
  //  an IniFile object, we're going to use this hacky disgusting
  //  function to quickly create a temp file, read it, destroy it
  //  and return the object back to the caller.
  try {
    await fs.writeFileAsync(tempDest, data, { encoding: 'utf8' });
    const parser = new IniParser.default(new IniParser.WinapiFormat());
    const iniData = await parser.read(tempDest);
    await fs.removeAsync(tempDest);
    return Promise.resolve(iniData);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function onDidDeploy(api, deployment, activeProfile) {
  const state = api.store.getState();
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
  const docFiles = deployment['witcher3menumodroot'].filter(file => (file.relPath.endsWith(PART_SUFFIX))
    && (file.relPath.indexOf(INPUT_XML_FILENAME) === -1));

  if (docFiles.length <= 0) {
    return;
  }

  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const modState = util.getSafe(activeProfile, ['modState'], {});
  let nextAvailableId = Object.keys(loadOrder).length;
  const getNextId = () => {
    return nextAvailableId++;
  }
  const invalidModTypes = ['witcher3menumoddocuments'];
  const enabledMods = Object.keys(mods)
    .filter(key => !!modState[key]?.enabled && !invalidModTypes.includes(mods[key].type))
    .sort((lhs, rhs) => (loadOrder[rhs]?.pos || getNextId()) - (loadOrder[lhs]?.pos || getNextId()))

  const currentCache = await getExistingCache(state, activeProfile);
  if ((currentCache.length === 0) && (enabledMods.length > 0)) {
    // Probably first time the cache is created.
    return ensureMenuMod(api, activeProfile)
      .then(() => populateCache(api, activeProfile))
      .then(() => writeCacheToFiles(api, activeProfile))
      .then(() => menuMod(activeProfile.name))
      .catch(err => (err instanceof util.UserCanceled)
        ? Promise.resolve()
        : Promise.reject(err))
  } else {
    return ensureMenuMod(api, activeProfile)
      .then(() => writeCacheToFiles(api, activeProfile))
      .then(() => menuMod(activeProfile.name))
      .catch(err => (err instanceof util.UserCanceled)
        ? Promise.resolve()
        : Promise.reject(err));
  }


}

function sanitizeProfileName(input) {
  return input.replace(INVALID_CHARS, '_');
}

function menuMod(profileName) {
  return `Witcher 3 Menu Mod Data (${sanitizeProfileName(profileName)})`;
}

async function createMenuMod(api, modName, profile) {
  const mod = {
    id: modName,
    state: 'installed',
    attributes: {
      name: 'Witcher 3 Menu Mod',
      description: 'This mod is a collective merge of setting files required by any/all '
                 + 'menu mods the user has installed - please do not disable/remove unless '
                 + 'all menu mods have been removed from your game first.',
      logicalFileName: 'Witcher 3 Menu Mod',
      modId: 42, // Meaning of life
      version: '1.0.0',
      variant: sanitizeProfileName(profile.name.replace(INVALID_CHARS, '_')),
      installTime: new Date(),
    },
    installationPath: modName,
    type: 'witcher3menumoddocuments',
  };

  return await new Promise((resolve, reject) => {
    api.events.emit('create-mod', profile.gameId, mod, async (error) => {
      if (error !== null) {
        return reject(error);
      }
      resolve();
    });
  });
}

async function removeMenuMod(api, profile) {
  const state = api.store.getState();
  const modName = menuMod(profile.name);
  const mod = util.getSafe(state, ['persistent', 'mods', profile.gameId, modName], undefined);
  if (mod === undefined) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    api.events.emit('remove-mod', profile.gameId, mod.id, async (error) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve();
    });
  });
}

async function cacheToFileMap(state, profile) {
  // Organizes cache entries into a fileMap which
  //  can be used to loop through each mod entry's
  //  data on a per file basis.
  const currentCache = await getExistingCache(state, profile);
  if (currentCache.length === 0) {
    // Nothing to do here.
    return undefined;
  }

  const fileMap = currentCache.reduce((accum, entry) => {
    accum[toFileMapKey(entry.filepath)] =
      [].concat(accum[toFileMapKey(entry.filepath)] || [],
      [{ id: entry.id, data: entry.data, filepath: entry.filepath }]);

    return accum;
  }, {});

  return fileMap;
}

async function writeCacheToFiles(api, profile) {
  const state = api.store.getState();
  const modName = menuMod(profile.name);
  const installPath = selectors.installPathForGame(state, profile.gameId);
  const destinationFolder = path.join(installPath, modName);
  const game = util.getGame(profile.gameId);
  const discovery = selectors.discoveryByGame(state, profile.gameId);
  const modPaths = game.getModPaths(discovery.path);
  const docModPath = modPaths['witcher3menumoddocuments'];
  const currentCache = await getExistingCache(state, profile)
  if (currentCache.length === 0) {
    return;
  }

  const getInitialDoc = (filePath) => {
    return fs.statAsync(filePath + BACKUP_TAG)
      .then(() => Promise.resolve(filePath + BACKUP_TAG))
      .catch(err => fs.statAsync(filePath)
        .then(() => Promise.resolve(filePath)))
      .catch(err => {
        // We couldn't find the original document. This
        //  can potentially happen when the .part.txt suffix
        //  gets added to files that are not supposed to be
        //  deployed to the documents folder, log and continue.
        log('warn', 'W3: cannot find original file', err.message);
        return Promise.resolve(undefined);
      });
  };

  const fileMap = await cacheToFileMap(state, profile);
  if (fileMap === undefined) {
    return;
  }

  const copyIniFile = (source, dest) => fs.copyAsync(source, dest)
    .then(() => Promise.resolve(dest)).catch(err => Promise.resolve(undefined))
  const keys = Object.keys(fileMap);
  const parser = new IniParser.default(new IniParser.WinapiFormat());
  return Promise.each(keys, async key => getInitialDoc(path.join(docModPath, key))
    .then(source => (source !== undefined)
      ? copyIniFile(source, path.join(destinationFolder, key))
      : Promise.resolve(undefined))
    .then(async (dest) => {
      if (dest === undefined) {
        // Copy failed - that's perfectly possible if the mod
        //  author added the .part.txt suffix to some file we
        //  don't cater for (some people use input.xml.part.txt
        //  which is wrong AFAIK as W3MM can't cater for those either)
        //  in this circumstance we just jump to the next key.
        return Promise.resolve();
      }
      const initialData = await parser.read(path.join(destinationFolder, key));
      return Promise.each(fileMap[key], async modEntry => {
        const tempFilePath = path.join(destinationFolder, key) + generate();
        const modData = await toIniFileObject(modEntry.data, tempFilePath);
        const modKeys = Object.keys(modData.data);
        // The cache must be in file format - copy all ini files diffs from inside
        // their mod directories into the menumod in staging and read/write to them
        // directly in there!
        return Promise.each(modKeys, modKey => {
          if (initialData.data[modKey] === undefined) {
            initialData.data[modKey] = modData.data[modKey];
          } else {
            const modEntries = Object.entries(modData.data[modKey]);
            modEntries.forEach(kvp => {
              initialData.data[modKey][kvp[0]] = kvp[1];
            });
          }
        })
      })
      .then(() => parser.write(path.join(destinationFolder, key), initialData));
    }))
    .catch(err => {
      if (err.code === 'ENOENT') {
        const paths = [path.join(docModPath, INPUT_SETTINGS_FILENAME),
                       path.join(docModPath, USER_SETTINGS_FILENAME)];

        if (paths.includes(err.path)) {
          const error = new util.DataInvalid('Required setting files are missing - please run the game at least once and try again.');
          api.showErrorNotification('Failed to install menu mod', error, { allowReport: false });
          return Promise.resolve();
        }

        return Promise.reject(err);
      }
      return Promise.reject(err);
    });
}

async function ensureMenuMod(api, profile) {
  const state = api.store.getState();
  const modName = menuMod(profile.name);
  const mod = util.getSafe(state, ['persistent', 'mods', profile.gameId, modName], undefined);
  if (mod === undefined) {
    try {
      await createMenuMod(api, modName, profile);
    } catch (err) {
      return Promise.reject(err);
    }
  } else {
    // give the user an indication when this was last updated
    api.store.dispatch(actions.setModAttribute(profile.gameId, modName, 'installTime', new Date()));
    // the rest here is only required to update mods from previous vortex versions
    api.store.dispatch(actions.setModAttribute(profile.gameId, modName,
                                               'name', 'Witcher 3 Menu Mod'));

    api.store.dispatch(actions.setModAttribute(profile.gameId, modName,
                                               'type', 'witcher3menumoddocuments'));

    api.store.dispatch(actions.setModAttribute(profile.gameId, modName,
                                               'logicalFileName', 'Witcher 3 Menu Mod'));
    api.store.dispatch(actions.setModAttribute(profile.gameId, modName, 'modId', 42));
    api.store.dispatch(actions.setModAttribute(profile.gameId, modName, 'version', '1.0.0'));
    api.store.dispatch(actions.setModAttribute(profile.gameId, modName, 'variant',
                                               sanitizeProfileName(profile.name)));
  }
  return Promise.resolve(modName);
}

module.exports = {
  default: ensureMenuMod,
  removeMod: removeMenuMod,
  getModId: menuMod,
  onDidDeploy: onDidDeploy,
  onWillDeploy: onWillDeploy,
};
