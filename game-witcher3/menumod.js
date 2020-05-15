const path = require('path');
const Promise = require('bluebird');
const { actions, fs, log, selectors, util } = require('vortex-api');
const IniParser = require('vortex-parse-ini');

// most of these are invalid on windows only but it's not worth the effort allowing them elsewhere
const INVALID_CHARS = /[:/\\*?"<>|]/g;
const INPUT_SETTINGS_FILENAME = 'input.settings';
const USER_SETTINGS_FILENAME = 'user.settings';
const BACKUP_TAG = '.vortex_backup';

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

async function cleanModDir(modDir) {
  return fs.readdirAsync(modDir)
    .then(entries => Promise.each(entries, file =>
      fs.removeAsync(path.join(modDir, file))));
}

async function writeModFiles(api, modName, docFiles, profile) {
  const state = api.store.getState();
  const installPath = selectors.installPathForGame(state, profile.gameId);
  const destinationFolder = path.join(installPath, modName)
  const game = util.getGame(profile.gameId);
  const discovery = selectors.discoveryByGame(state, profile.gameId);
  const modPaths = game.getModPaths(discovery.path);
  const docModPath = modPaths['witcher3menumoddocuments'];
  await cleanModDir(destinationFolder);

  const reduced = docFiles.reduce((accum, file) => {
    if (file.indexOf(INPUT_SETTINGS_FILENAME) !== -1) {
      accum[INPUT_SETTINGS_FILENAME] = [].concat(accum[INPUT_SETTINGS_FILENAME] || [], [file]);
    } else if (file.indexOf(USER_SETTINGS_FILENAME) !== -1) {
      accum[USER_SETTINGS_FILENAME] = [].concat(accum[USER_SETTINGS_FILENAME] || [], [file]);
    }

    return accum;
  }, {});

  const keys = Object.keys(reduced);
  if (keys.length === 0) {
    return Promise.resolve();
  }

  const getInitialDoc = (filePath) => {
    return fs.statAsync(filePath + BACKUP_TAG)
      .then(() => Promise.resolve(filePath + BACKUP_TAG))
      .catch(err => fs.statAsync(filePath)
        .then(() => Promise.resolve(filePath)));
  }
  
  return Promise.each(keys, key => getInitialDoc(path.join(docModPath, key))
    .then(source => fs.copyAsync(source, path.join(destinationFolder, key)))
    .then(() => {
      const parser = new IniParser.default(new IniParser.WinapiFormat());
      return parser.read(path.join(destinationFolder, key))
        .then(initialData => {
          const parser2 = new IniParser.default(new IniParser.WinapiFormat());
          return Promise.each(reduced[key], mergeFile => parser2.read(mergeFile)
            .then(modData => {
              const modKeys = Object.keys(modData.data);
              return Promise.each(modKeys, modKey => {
                if (initialData.data[modKey] === undefined) {
                  initialData.data[modKey] = modData.data[modKey];
                } else {
                  const modEntries = Object.entries(modData.data[modKey]);
                  modEntries.forEach(kvp => {
                    initialData.data[modKey][kvp[0]] = kvp[1];
                  })
                }
              })
            })).then(() => parser.write(path.join(destinationFolder, key), initialData))
        })
    }))
}

async function removeMenuMod(api, profile) {
  const state = api.store.getState();
  const modName = menuMod(profile.name);
  const mod = util.getSafe(state, ['persistent', 'mods', profile.gameId, modName], undefined);
  return new Promise((resolve, reject) => {
    api.events.emit('remove-mod', profile.gameId, mod.id, async (error) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve();
    });
  });
}

async function ensureMenuMod(api, profile, docFiles) {
  const state = api.store.getState();
  const modName = menuMod(profile.name);
  const mod = util.getSafe(state, ['persistent', 'mods', profile.gameId, modName], undefined);
  if (docFiles.length === 0 && !!mod) {
    return undefined;
  }

  if (mod === undefined) {
    await createMenuMod(api, modName, profile);
    await writeModFiles(api, modName, docFiles, profile);
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
    await writeModFiles(api, modName, docFiles, profile);
  }
  return modName;
}

module.exports = {
  default: ensureMenuMod,
  removeMod: removeMenuMod,
};
