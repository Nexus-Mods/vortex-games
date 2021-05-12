import path from 'path';
import { fs, log, selectors, types, util } from 'vortex-api';

import { GAME_ID, gameExecutable, MOD_INFO, modsRelPath } from './common';
import { deserialize, serialize, validate } from './loadOrder';
import { migrate020, migrate100 } from './migrations';
import { ILoadOrderEntry, IProps } from './types';
import { genProps, getModName, toBlue } from './util';

const STEAM_ID = '251570';
const STEAM_DLL = 'steamclient64.dll';

async function findGame() {
  return util.GameStoreHelper.findByAppId([STEAM_ID])
    .then(game => game.gamePath);
}

async function prepareForModding(context: types.IExtensionContext,
                                 discovery: types.IDiscoveryResult) {
  const state = context.api.getState();
  const modsPath = path.join(discovery.path, modsRelPath());
  try {
    await fs.ensureDirWritableAsync(modsPath);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function installContent(files: string[],
                              destinationPath: string,
                              gameId: string): Promise<types.IInstallResult> {
  // The modinfo.xml file is expected to always be positioned in the root directory
  //  of the mod itself; we're going to disregard anything placed outside the root.
  const modFile = files.find(file => path.basename(file).toLowerCase() === MOD_INFO);
  const rootPath = path.dirname(modFile);
  return getModName(path.join(destinationPath, modFile))
    .then(modName => {
      modName = modName.replace(/[^a-zA-Z0-9]/g, '');

      // Remove directories and anything that isn't in the rootPath (also directories).
      const filtered = files.filter(filePath =>
        filePath.startsWith(rootPath) && !filePath.endsWith(path.sep));

      const instructions: types.IInstruction[] = filtered.map(filePath => {
        return {
          type: 'copy',
          source: filePath,
          destination: path.relative(rootPath, filePath),
        };
      });

      return Promise.resolve({ instructions });
    });
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = (gameId === GAME_ID) &&
    (files.find(file => path.basename(file).toLowerCase() === MOD_INFO) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function toLOPrefix(context: types.IExtensionContext, mod: types.IMod): string {
  const props: IProps = genProps(context);
  if (props === undefined) {
    return 'ZZZZ-' + mod.id;
  }

  // Retrieve the load order as stored in Vortex's application state.
  const loadOrder = util.getSafe(props.state, ['persistent', 'loadOrder', props.profile.id], []);

  // Find the mod entry in the load order state and insert the prefix in front
  //  of the mod's name/id/whatever
  const loEntry: ILoadOrderEntry = loadOrder.find(loEntry => loEntry.id === mod.id);
  return (loEntry?.data?.prefix !== undefined)
    ? loEntry.data.prefix + '-' + mod.id
    : 'ZZZZ-' + mod.id;
}

function requiresLauncher(gamePath) {
  return fs.readdirAsync(gamePath)
    .then(files => (files.find(file => file.endsWith(STEAM_DLL)) !== undefined)
      ? Promise.resolve({ launcher: 'steam' })
      : Promise.resolve(undefined))
    .catch(err => Promise.reject(err));
}

function main(context: types.IExtensionContext) {
  context.registerGame({
    id: GAME_ID,
    name: '7 Days to Die',
    mergeMods: (mod) => toLOPrefix(context, mod),
    queryPath: toBlue(findGame),
    requiresCleanup: true,
    supportedTools: [],
    queryModPath: () => modsRelPath(),
    logo: 'gameart.jpg',
    executable: gameExecutable,
    requiredFiles: [
      gameExecutable(),
    ],
    requiresLauncher,
    setup: toBlue((discovery) => prepareForModding(context, discovery)),
    environment: {
      SteamAPPId: STEAM_ID,
    },
    details: {
      steamAppId: +STEAM_ID,
    },
  });

  context.registerLoadOrder({
    deserializeLoadOrder: () => deserialize(context),
    serializeLoadOrder: (loadOrder) => serialize(context, loadOrder),
    validate,
    gameId: GAME_ID,
    toggleableEntries: false,
    usageInstructions: '7 Days to Die loads mods in alphabetic order so Vortex prefixes '
      + 'the directory names with "AAA, AAB, AAC, ..." to ensure they load in the order you set here.',
  });

  context.registerInstaller('7dtd-mod', 25,
    toBlue(testSupportedContent), toBlue(installContent));

  context.registerMigration(toBlue(old => migrate020(context.api, old)));
  context.registerMigration(toBlue(old => migrate100(context, old)));

  return true;
}

module.exports = {
  default: main,
};
