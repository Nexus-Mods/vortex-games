import path from 'path';
import { types } from 'vortex-api';
import { CONFIG_MATRIX_REL_PATH, GAME_ID } from './common';

export type PrefixType = 'dlc' | 'mod';

export function testSupportedMixed(files: string[], gameId: string): Promise<types.ISupportedResult> {
  if (gameId !== GAME_ID) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  const hasConfigMatrixFile = files.find(file => path.basename(file).toLowerCase === CONFIG_MATRIX_REL_PATH) !== undefined;
  if (hasConfigMatrixFile) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }

  const hasPrefix = (prefix: PrefixType, fileEntry: string) => {
    const segments = fileEntry.toLowerCase().split(path.sep);
    if (segments.indexOf('content') !== 1) {
      // We expect the content folder to be nested one level beneath
      //  the mod's folder e.g. 'archive.zip/dlcModName/content/' otherwise
      //  it's simply too unreliable to attempt to detect this packaging pattern.
      return false;
    }

    return (segments[0].length > 3) && (segments[0].startsWith(prefix));
  };

  const supported = ((files.find(file => hasPrefix('dlc', file)) !== undefined)
                  && (files.find(file => hasPrefix('mod', file)) !== undefined));
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

export function installMixed(files: string[]) {
  // We can only assume that files with the 'dlc' prefix go inside dlc and files
  //  with the 'mod' prefix go inside mods.
  const modNames: string[] = [];
  const instructions: types.IInstruction[] = files.reduce((accum, iter) => {
    const segments = iter.split(path.sep);
    if (!path.extname(segments[segments.length - 1])) {
      return accum;
    }
    const modName = segments[0].startsWith('mod')
      ? segments[0] : undefined;
    const destination = (segments[0].startsWith('dlc'))
      ? ['dlc'].concat(segments).join(path.sep)
      : (modName !== undefined)
        ? ['mods'].concat(segments).join(path.sep)
        : undefined;
    if (destination !== undefined) {
      if (modName !== undefined) {
        modNames.push(modName);
      }
      const instruction: types.IInstruction = {
        type: 'copy',
        source: iter,
        destination,
      };
      accum.push(instruction);
    }
    return accum;
  }, [])
  .concat({
    type: 'attribute',
    key: 'modComponents',
    value: modNames,
  });
  return Promise.resolve({ instructions });
}
