import Bluebird from 'bluebird';
import path from 'path'
import { Element, parseXmlString } from 'libxmljs';

import { GAME_ID, SCRIPT_MERGER_ID, MERGE_INV_MANIFEST } from './common';

import { fs, types, util } from 'vortex-api';

export function getElementValues(context: types.IExtensionContext, pattern: string): Bluebird<string[]> {
  // Provided with a pattern, attempts to retrieve element values
  //  from any element keys that match the pattern inside the merge inventory file.
  const state = context.api.store.getState();
  const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
  const scriptMerger = util.getSafe(discovery, ['tools', SCRIPT_MERGER_ID], undefined);
  if ((scriptMerger === undefined) || (scriptMerger.path === undefined)) {
    return Bluebird.resolve([]);
  }

  const modsPath = path.join(discovery.path, 'Mods');
  return fs.readFileAsync(path.join(path.dirname(scriptMerger.path), MERGE_INV_MANIFEST))
    .then(xmlData => {
      try {
        const mergeData = parseXmlString(xmlData);
        const elements = mergeData.find<Element>(pattern)
          .map(modEntry => {
            try {
              return modEntry.text();
            } catch (err) {
              return undefined;
            }
          })
          .filter(entry => !!entry);
        const unique = new Set(elements);

        return Bluebird.reduce(Array.from(unique), (accum: string[], mod: string) =>
          fs.statAsync(path.join(modsPath, mod))
          .then(() => {
            accum.push(mod);
            return accum;
          }).catch(err => accum), []);
      } catch (err) {
        return Promise.reject(err);
      }
    })
    .catch(err => (err.code === 'ENOENT') // No merge file? - no problem.
      ? Promise.resolve([])
      : Promise.reject(new util.DataInvalid(`Failed to parse ${MERGE_INV_MANIFEST}: ${err}`)));
}

export function getMergedModNames(context: types.IExtensionContext) {
  // This retrieves the name of the resulting merged mod itself.
  //  AKA "mod0000_MergedFiles"
  return getElementValues(context, '//MergedModName')
    .catch(err => {
      // We failed to parse the merge inventory for whatever reason.
      //  Rather than blocking the user from modding his game we're
      //  we simply return an empty array; but before we do that,
      //  we need to tell him we were unable to parse the merged inventory.
      context.api.showErrorNotification('Invalid MergeInventory.xml file', err,
        { allowReport: false });
      return Promise.resolve([]);
    });
}

export function getNamesOfMergedMods(context: types.IExtensionContext): Bluebird<string[]> {
  // This retrieves a unique list of mod names included in the merged mod
  return getElementValues(context, '//IncludedMod');
}