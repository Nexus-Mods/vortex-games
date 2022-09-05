import { log, types, selectors } from 'vortex-api';

import { GAME_ID } from './common';
import DependencyManager from './dependencyManager';
import { ISDVDependency } from './types';

export async function testMissingDependencies(
    api: types.IExtensionApi,
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