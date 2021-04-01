import path from 'path';
import { actions, selectors, types, util } from 'vortex-api';

import { setPriorityType } from './actions';
import { GAME_ID, getPriorityTypeBranch, I18N_NAMESPACE, LOCKED_PREFIX, UNIAPP } from './common';
import { PriorityManager, PriorityType } from './priorityManager';

import PriorityTypeButton from './priorityTypeButton';

interface IProps {
  context: types.IExtensionContext;
  refreshFunc: () => void;
  getPriorityManager: () => PriorityManager;
}

function resetPriorities(props: IProps) {
  const { context, refreshFunc } = props;
  const state = context.api.getState();
  const profile = selectors.activeProfile(state);
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], {});
  const newLO = Object.keys(loadOrder).reduce((accum, key) => {
    const loEntry = loadOrder[key];
    accum[key] = {
      ...loEntry,
      prefix: loEntry.pos + 1,
    };
    return accum;
  }, {});
  context.api.store.dispatch(actions.setLoadOrder(profile.id, newLO as any));
  if (refreshFunc !== undefined) {
    refreshFunc();
  }
  return newLO;
}

export const registerActions = (props: IProps) => {
  const { context, refreshFunc, getPriorityManager } = props;
  const openTW3DocPath = () => {
    const docPath = path.join(UNIAPP.getPath('documents'), 'The Witcher 3');
    util.opn(docPath).catch(() => null);
  };

  const isTW3 = (gameId = undefined) => {
    if (gameId !== undefined) {
      return (gameId === GAME_ID);
    }
    const state = context.api.getState();
    const gameMode = selectors.activeGameId(state);
    return (gameMode === GAME_ID);
  };

  context.registerAction('generic-load-order-icons', 300, PriorityTypeButton, {},
    undefined, undefined, isTW3);

  context.registerAction('mod-icons', 300, 'open-ext', {},
                         'Open TW3 Documents Folder', openTW3DocPath, isTW3);

  context.registerAction('generic-load-order-icons', 300, 'open-ext', {},
                         'Open TW3 Documents Folder', openTW3DocPath, isTW3);

  context.registerAction('generic-load-order-icons', 100, 'loot-sort', {}, 'Reset Priorities',
    () => {
      context.api.showDialog('info', 'Reset Priorities', {
        bbcode: context.api.translate('This action will revert all manually set priorities and will re-instate priorities in an incremental '
          + 'manner starting from 1. Are you sure you want to do this ?', { ns: I18N_NAMESPACE }),
      }, [
        { label: 'Cancel', action: () => {
          return;
        }},
        { label: 'Reset Priorities', action: () => resetPriorities(props) },
      ]);
    }, () => {
      const state = context.api.store.getState();
      const gameMode = selectors.activeGameId(state);
      return gameMode === GAME_ID;
    });

  context.registerAction('generic-load-order-icons', 100, 'loot-sort', {}, 'Sort by Deploy Order',
    () => {
      context.api.showDialog('info', 'Sort by Deployment Order', {
        bbcode: context.api.translate('This action will set priorities using the deployment rules '
          + 'defined in the mods page. Are you sure you wish to proceed ?[br][/br][br][/br]'
          + 'Please be aware that any externally added mods (added manually or by other tools) will be pushed '
          + 'to the bottom of the list, while all mods that have been installed through Vortex will shift '
          + 'in position to match the deploy order!', { ns: I18N_NAMESPACE }),
      }, [
        { label: 'Cancel', action: () => {
          return;
        }},
        { label: 'Sort by Deploy Order', action: () => {
          const state = context.api.getState();
          const gameMods = state.persistent.mods[GAME_ID] || {};
          const profile = selectors.activeProfile(state);
          const mods = Object.keys(gameMods)
            .filter(key => util.getSafe(profile, ['modState', key, 'enabled'], false))
            .map(key => gameMods[key]);
          return util.sortMods(GAME_ID, mods, context.api)
            .then(sorted => {
              const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], {});
              const filtered = Object.keys(loadOrder).filter(key =>
                sorted.find(mod => mod.id === key) !== undefined);
              const manuallyAdded = Object.keys(loadOrder).filter(key => !filtered.includes(key));
              const minimumIdx = manuallyAdded
                .filter(key => key.includes(LOCKED_PREFIX))
                .reduce((min, key) => {
                  if (min <= loadOrder[key].pos) {
                    min = loadOrder[key].pos + 1;
                  }
                  return min;
                }, 0);
              const manualLO = manuallyAdded.reduce((accum, key, idx) => {
                if (key.includes(LOCKED_PREFIX)) {
                  accum[key] = loadOrder[key];
                  return accum;
                }

                const minimumPosition = (filtered.length + minimumIdx + 1);
                if (loadOrder[key].pos < minimumPosition) {
                  accum[key] = {
                    ...loadOrder[key],
                    pos: loadOrder[key].pos + (minimumPosition + idx),
                    prefix: loadOrder[key].pos + (minimumPosition + idx + 1),
                  };
                  return accum;
                } else {
                  accum[key] = loadOrder[key];
                  return accum;
                }
              }, {});
              const newLO = filtered.reduce((accum, key) => {
                const loEntry = loadOrder[key];
                const idx = sorted.findIndex(mod => mod.id === key);
                const assignedIdx = minimumIdx + idx;
                accum[key] = {
                  ...loEntry,
                  pos: assignedIdx,
                  prefix: assignedIdx + 1,
                };
                return accum;
              }, manualLO);

              context.api.store.dispatch(actions.setLoadOrder(profile.id, newLO as any));
              if (refreshFunc !== undefined) {
                refreshFunc();
              }
            })
            .catch(err => {
              const allowReport = !(err instanceof util.CycleError);
              context.api.showErrorNotification('Failed to sort by deployment order', err,
                { allowReport });
            });
        }},
      ]);
    }, () => {
      const state = context.api.store.getState();
      const gameMode = selectors.activeGameId(state);
      return gameMode === GAME_ID;
    });
};
