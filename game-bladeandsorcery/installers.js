const path = require('path');
const semver = require('semver');
const Promise = require('bluebird');
const { util } = require('vortex-api');

const { app, remote } = require('electron');
const uniApp = app || remote.app;

const { GAME_ID, MOD_MANIFEST } = require('./common');
const { getModName, checkModGameVersion, getGameVersion,
  getMinModVersion, getDiscoveryPath } = require('./util');

function testModInstaller(files, gameId, fileName) {
  // Make sure we're able to support this mod.
  const supported = (gameId === GAME_ID) &&
    (files.find(file => path.basename(file).toLowerCase() === fileName) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: files.filter(f => path.basename(f).toLowerCase() === MOD_MANIFEST),
  });
}

async function installOfficialMod(files,
                                  destinationPath,
                                  gameId,
                                  progressDelegate,
                                  api) {
  const t = api.translate;
  let minModVersion;
  let gameVersion;
  const discoveryPath = getDiscoveryPath(api);
  if (discoveryPath === undefined) {
    return Promise.reject(new Error('Game is not discovered'));
  }
  try {
    gameVersion = await getGameVersion(discoveryPath);
    minModVersion = await getMinModVersion(discoveryPath);
    try {
      const relPath = files.find(f => path.basename(f).toLowerCase() === MOD_MANIFEST);
      // just validating if the name is valid
      await getModName(path.join(destinationPath, relPath), 'Name');
    } catch (err) {
      // invalid mod name, refuse installation
      return {
        instructions: [
          {
            type: 'error',
            value: 'fatal',
            source: 'This mod is not compatible with Blade&Sorcery version 8.4 and newer.',
          },
        ],
      };
    }
    minModVersion.version = minModVersion.version.toString().replace(',', '.');
  }
  catch (err) {
    if (err.message.indexOf('Missing config file.') !== -1) {
      api.showErrorNotification('Missing config file', 'Please run the game at least once to ensure it '
        + 'generates all required game files; alternatively re-install the game.', { allowReport: false });
      throw new util.ProcessCanceled('Missing config file.');
    }

    throw err;
  }

  if (minModVersion === undefined) {
    throw new util.DataInvalid('Failed to identify game version');
  }

  const usedModNames = [];

  const manifestFiles = files.filter(file =>
    path.basename(file).toLowerCase() === MOD_MANIFEST);

  const createInstructions = (manifestFile) =>
    getModName(path.join(destinationPath, manifestFile), 'Name', undefined)
      .then(async manifestModName => {
        const isUsedModName = usedModNames.find(modName => modName === manifestModName) !== undefined;
        const idx = manifestFile.indexOf(path.basename(manifestFile));
        const rootPath = path.dirname(manifestFile);
        const modName = (isUsedModName)
          ? path.basename(rootPath)
          : manifestModName;

        usedModNames.push(modName);


        // Remove directories and anything that isn't in the rootPath.
        const filtered = files.filter(file =>
          ((file.indexOf(rootPath) !== -1) && (!file.endsWith(path.sep))));

        const instructions = filtered.map(file => {
          return {
            type: 'copy',
            source: file,
            destination: path.join(modName, file.substr(idx)),
          };
        });

        instructions.push({
          type: 'attribute',
          key: 'hasMultipleMods',
          value: (manifestFiles.length > 1),
        })

        let modVersion;
        try {
          modVersion = await checkModGameVersion(destinationPath, minModVersion, manifestFile);
        } catch (err) {
          return Promise.reject(err);
        }

        if (semver.satisfies(uniApp.getVersion(), '>=1.4.0')) {
          instructions.push({
            type: 'attribute',
            key: 'maxGameVersion',
            value: semver.coerce(modVersion.modVersion).version,
          })
        }

        const modTypeInstr = {
          type: 'setmodtype',
          value: semver.gte(semver.coerce(gameVersion), semver.coerce('8.4'))
            ? 'bas-official-modtype'
            : 'bas-legacy-modtype'
        }

        instructions.push(modTypeInstr);
        return Promise.resolve(instructions);
      });

  return Promise.map(manifestFiles, manFile => createInstructions(manFile))
    .then(manifestMods => {
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

module.exports = {
  testModInstaller,
  installOfficialMod,
  installMulleMod,
}