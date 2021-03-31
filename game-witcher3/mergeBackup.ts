import path from 'path';
import turbowalk from 'turbowalk';
import { actions, fs, log, selectors, types, util } from 'vortex-api';

import { GAME_ID, getLoadOrderFilePath,
         MERGE_INV_MANIFEST, SCRIPT_MERGER_ID } from './common';

import { getMergedModName } from './scriptmerger';

type OpType = 'import' | 'export';
interface IBaseProps {
  api: types.IExtensionApi;
  state: types.IState;
  profile: types.IProfile;
  scriptMergerTool: types.IDiscoveredTool;
  gamePath: string;
}

const sortInc = (lhs: string, rhs: string) => lhs.length - rhs.length;
const sortDec = (lhs: string, rhs: string) => rhs.length - lhs.length;

function genBaseProps(context: types.IExtensionContext, profileId: string): IBaseProps {
  if (!profileId) {
    return undefined;
  }
  const state = context.api.getState();
  const profile: types.IProfile = selectors.profileById(state, profileId);
  if (profile?.gameId !== GAME_ID) {
    return undefined;
  }

  const localMergedScripts: boolean = util.getSafe(state,
    ['persistent', 'profiles', profileId, 'features', 'local_merges'], false);
  if (!localMergedScripts) {
    return undefined;
  }

  const discovery: types.IDiscoveryResult = util.getSafe(state,
    ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  const scriptMergerTool: types.IDiscoveredTool = discovery?.tools?.[SCRIPT_MERGER_ID];
  if (!scriptMergerTool?.path) {
    // Regardless of the user's profile settings - there's no point in backing up
    //  the merges if we don't know where the script merger is!
    return undefined;
  }

  return { api: context.api, state, profile, scriptMergerTool, gamePath: discovery.path };
}

function getFileEntries(filePath: string): Promise<string[]> {
  let files: string[] = [];
  return turbowalk(filePath, entries => {
    const validEntries = entries.filter(entry => !entry.isDirectory)
                                .map(entry => entry.filePath);
    files = files.concat(validEntries);
  }, { recurse: true })
  .catch(err => ['ENOENT', 'ENOTFOUND'].includes(err.code)
    ? Promise.resolve()
    : Promise.reject(err))
  .then(() => Promise.resolve(files));
}

async function moveFile(from: string, to: string, fileName: string) {
  const src = path.join(from, fileName);
  const dest = path.join(to, fileName);
  try {
    await copyFile(src, dest);
  } catch (err) {
    // It's perfectly possible for the user not to have any merges yet.
    return (err.code !== 'ENOENT')
      ? Promise.reject(err)
      : Promise.resolve();
  }
}

async function removeFile(filePath: string) {
  if (path.extname(filePath) === '') {
    return;
  }
  try {
    await fs.removeAsync(filePath);
  } catch (err) {
    return (err.code === 'ENOENT')
      ? Promise.resolve()
      : Promise.reject(err);
  }
}

async function copyFile(src: string, dest: string) {
  try {
    await fs.ensureDirWritableAsync(path.dirname(dest));
    await removeFile(dest);
    await fs.copyAsync(src, dest);
  } catch (err) {
    return Promise.reject(err);
  }
}

async function moveFiles(src: string, dest: string, props: IBaseProps) {
  const t = props.api.translate;
  const removeDestFiles = async () => {
    try {
      const destFiles: string[] = await getFileEntries(dest);
      destFiles.sort(sortDec);
      for (const destFile of destFiles) {
        await fs.removeAsync(destFile);
      }
    } catch (err) {
      if (['EPERM'].includes(err.code)) {
        return props.api.showDialog('error', 'Failed to restore merged files', {
          bbcode: t('Vortex encountered a permissions related error while attempting '
            + 'to replace:{{bl}}"{{filePath}}"{{bl}}'
            + 'Please try to resolve any permissions related issues and return to this '
            + 'dialog when you think you managed to fix it. There are a couple of things '
            + 'you can try to fix this:[br][/br][list][*] Close/Disable any applications that may '
            + 'interfere with Vortex\'s operations such as the game itself, the witcher script merger, '
            + 'any external modding tools, any anti-virus software. '
            + '[*] Ensure that your Windows user account has full read/write permissions to the file specified '
            + '[/list]', { replace: { filePath: err.path, bl: '[br][/br][br][/br]' } }),
        },
        [
          { label: 'Cancel', action: () => Promise.reject(new util.UserCanceled()) },
          { label: 'Try Again', action: () => removeDestFiles() }
        ])
      } else {
        // We failed to clean up the destination folder - we can't
        //  continue.
        return Promise.reject(new util.ProcessCanceled(err.message));
      }
    }
  };

  await removeDestFiles();
  const copied: string[] = [];
  try {
    const srcFiles: string[] = await getFileEntries(src);
    srcFiles.sort(sortInc);
    for (const srcFile of srcFiles) {
      const relPath = path.relative(src, srcFile);
      const targetPath = path.join(dest, relPath);
      try {
        await copyFile(srcFile, targetPath);
        copied.push(targetPath);
      } catch (err) {
        log('error', 'failed to move file', err);
      }
    }

    // if (cleanUp) {
    //   // We managed to copy all the files, clean up the source
    //   srcFiles.sort(sortDec);
    //   for (const srcFile of srcFiles) {
    //     await fs.removeAsync(srcFile);
    //   }
    // }
  } catch (err) {
    if (!!err.path && !err.path.includes(dest)) {
      // We failed to clean up the source
      return;
    }

    // We failed to copy - clean up.
    copied.sort(sortDec);
    for (const link of copied) {
      await fs.removeAsync(link);
    }
  }
}

async function handleMergedScripts(props: IBaseProps, opType: OpType) {
  const { scriptMergerTool, profile, gamePath } = props;
  if (!scriptMergerTool?.path) {
    return Promise.reject(new util.NotFound('Script merging tool path'));
  }
  if (!profile?.id) {
    return Promise.reject(new util.ArgumentInvalid('invalid profile'));
  }

  const mergerToolDir = path.dirname(scriptMergerTool.path);
  const profilePath: string = path.join(mergerToolDir, profile.id);
  const loarOrderFilepath: string = getLoadOrderFilePath();
  const mergedModName = await getMergedModName(mergerToolDir);
  const mergedScriptsPath = path.join(gamePath, 'Mods', mergedModName);

  if (opType === 'export') {
    await moveFile(mergerToolDir, profilePath, MERGE_INV_MANIFEST);
    await moveFile(path.dirname(loarOrderFilepath), profilePath, path.basename(loarOrderFilepath));
    await moveFiles(mergedScriptsPath, path.join(profilePath, mergedModName), props);
  } else if (opType === 'import') {
    await moveFile(profilePath, mergerToolDir, MERGE_INV_MANIFEST);
    await moveFile(profilePath, path.dirname(loarOrderFilepath), path.basename(loarOrderFilepath));
    await moveFiles(path.join(profilePath, mergedModName), mergedScriptsPath, props);
  }
}

export async function storeToProfile(context: types.IExtensionContext, profileId: string) {
  const props: IBaseProps = genBaseProps(context, profileId);
  if (props === undefined) {
    return;
  }

  return handleMergedScripts(props, 'export');
}

export async function restoreFromProfile(context: types.IExtensionContext, profileId: string) {
  const props: IBaseProps = genBaseProps(context, profileId);
  if (props === undefined) {
    return;
  }

  return handleMergedScripts(props, 'import');
}
