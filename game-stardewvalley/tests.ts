import { log, types, selectors } from 'vortex-api';

import { GAME_ID } from './common';
import DependencyManager from './DependencyManager';
import { ISDVDependency } from './types';

import { coerce, gte } from 'semver';

import { downloadSMAPI, findSMAPIMod } from './SMAPI';

export async function testMissingDependencies(api: types.IExtensionApi,
                                              depManager: DependencyManager)
                                              : Promise<types.ITestResult> {
  const t = api.translate;
  const state = api.getState();
  const gameMode = selectors.activeGameId(state);
  if (gameMode !== GAME_ID) {
    return undefined;
  }

  await depManager.scanManifests(true);
  let missingDependencies: ISDVDependency[] = [];
  try {
    missingDependencies = depManager.findMissingDependencies();
    if (missingDependencies.length === 0) {
      return Promise.resolve(undefined);
    }
  } catch (err) {
    log('error', 'Error while checking for missing dependencies', err);
    return Promise.resolve(undefined);
  }

  return Promise.resolve({
    description: {
      short: 'Some Stardew Valley mods are missing dependencies',
      long: t('Some of your Stardew Valley mods have unfulfilled dependencies - this '
            + 'may cause odd in-game behaviour, or may cause the game to fail to start.\n\n'
            + 'You are missing the following dependencies:[br][/br][br][/br]{{deps}}', {
        replace: {
          deps: missingDependencies.map(dep => dep.UniqueID).join('[br][/br]'),
        },
      }),
    },
    severity: 'warning' as types.ProblemSeverity,
  });
}

export async function testSMAPIOutdated(api: types.IExtensionApi,
                                           depManager: DependencyManager)
                                           : Promise<types.ITestResult> {
  let currentSMAPIVersion = findSMAPIMod(api)?.attributes?.version;
  if (currentSMAPIVersion === undefined) {
    // SMAPI isn't installed or enabled.
    return Promise.resolve(undefined);
  }

  const isSmapiOutdated = async () => {
    currentSMAPIVersion = findSMAPIMod(api)?.attributes?.version;
    const enabledManifests = await depManager.getManifests();
    const incompatibleModIds: string[] = [];
    for (const [id, manifests] of Object.entries(enabledManifests)) {
      const incompatible = manifests.filter((iter) => {
        if (iter.MinimumApiVersion !== undefined) {
          return !gte(currentSMAPIVersion, coerce(iter.MinimumApiVersion ?? '0.0.0'));
        }
        return false;
      });
      if (incompatible.length > 0) {
        incompatibleModIds.push(id);
      }
    }
    return Promise.resolve((incompatibleModIds.length > 0));
  }


  let outdated = await isSmapiOutdated();
  const t = api.translate;
  return outdated
    ? Promise.resolve({
      description: {
        short: t('SMAPI update required'),
        long: t('Some Stardew Valley mods require a newer version of SMAPI to function correctly, '
              + 'you should check for SMAPI updates in the mods page.'),
      },
      automaticFix: () => downloadSMAPI(api, true),
      onRecheck: () => isSmapiOutdated(),
      severity: 'warning' as types.ProblemSeverity,
    })
    : Promise.resolve(undefined);
}