/* eslint-disable */
import React from 'react';
import { selectors, types } from 'vortex-api';

import { GAME_ID, LOCKED_PREFIX, getLoadOrderFilePath } from './common';
import InfoComponent from './views/InfoComponent';
import IniStructure from './iniParser';
import { PriorityManager } from './priorityManager';

export interface IBaseProps {
  api: types.IExtensionApi;
  priorityManager: PriorityManager;
  onToggleModsState: (enable: boolean) => void;
};

class TW3LoadOrder implements types.ILoadOrderGameInfo {
  public gameId: string;
  public toggleableEntries?: boolean | undefined;
  public clearStateOnPurge?: boolean | undefined;
  public usageInstructions?: React.ComponentType<{}>;
  public noCollectionGeneration?: boolean | undefined;

  private mApi: types.IExtensionApi;
  private mPriorityManager: PriorityManager;

  constructor(props: IBaseProps) {
    this.gameId = GAME_ID;
    this.clearStateOnPurge = true;
    this.toggleableEntries = true;
    this.noCollectionGeneration = true;
    this.usageInstructions = () => (<InfoComponent onToggleModsState={props.onToggleModsState}/>);
    this.mApi = props.api;
    this.mPriorityManager = props.priorityManager;
    this.deserializeLoadOrder = this.deserializeLoadOrder.bind(this);
    this.serializeLoadOrder = this.serializeLoadOrder.bind(this);
    this.validate = this.validate.bind(this);
  }

  public async serializeLoadOrder(loadOrder: types.LoadOrder): Promise<void> {
    await IniStructure.getInstance(this.mApi, this.mPriorityManager).setINIStruct(loadOrder, this.mPriorityManager);
    return IniStructure.getInstance(this.mApi, this.mPriorityManager).writeToModSettings();
  }

  public async deserializeLoadOrder(): Promise<types.LoadOrder> {
    const state = this.mApi.getState();
    const activeProfile = selectors.activeProfile(state);
    if (activeProfile?.id === undefined) {
      return Promise.resolve([]);
    }
    try {
      const ini = await IniStructure.getInstance(this.mApi, this.mPriorityManager).readStructure();
      const entries = Object.keys(ini.data)
        .map((iter, idx): types.ILoadOrderEntry => {
          const entry = ini.data[iter];
          return {
            id: iter,
            name: entry.Name,
            enabled: entry.Enabled === 1,
            modId: entry?.VK ?? iter,
            locked: iter.startsWith(LOCKED_PREFIX),
            data: {
              prefix: ini.data[idx].Priority,
            }
          }
        });
      return Promise.resolve(entries.sort((a,b) => a.data.prefix - b.data.prefix));
    } catch (err) {
      return 
    }

    // const readableNames = {
    //   [UNI_PATCH]: 'Unification/Community Patch',
    // };
    // const allMods = await getAllMods(this.mApi);
    // const lockedMods = [].concat(allMods.manual.filter(isLockedEntry),
    //                              allMods.managed.filter(entry => isLockedEntry(entry.name))
    //                               .map(entry => entry.name));
    // const lockedEntries = [].concat(allMods.merged, lockedMods)
    //   .reduce((accum, modName, idx) => {
    //     const obj = {
    //       id: modName,
    //       name: !!readableNames[modName] ? readableNames[modName] : modName,
    //       locked: true,
    //       data: {
    //         prefix: idx + 1,
    //       }
    //     };
    //     if (!accum.find(acc => obj.id === acc.id)) {
    //       accum.push(obj);
    //     }
    //     return accum;
    //   }, []);
    
    // const manualEntries = allMods.manual.filter(key =>
    //        (lockedEntries.find(entry => entry.id === key) === undefined)
    //     && (allMods.managed.find(entry => entry.id === key) === undefined))
    //   .map(key => {
    //     const item: types.ILoadOrderEntry = {
    //       id: key,
    //       name: key,
    //       modId: key,
    //       enabled: true,
    //     };
    //     return {
    //       ...item,
    //       data: {
    //         prefix: getPriority(item),
    //       }
    //     };
    // });
  
    // const loadOrder = getPersistentLoadOrder(this.mApi);
    // const knownManuallyAdded = manualEntries.filter(entry => loadOrder.findIndex(e => e.id === entry.id) !== -1) || [];
    // const unknownManuallyAdded = manualEntries.filter(entry => loadOrder.findIndex(e => e.id === entry.id) === -1) || [];
    // const lo = [allMods.merged, locked, allMods.managed, manualEntries];

  
    // let items = loadOrder.filter(item => !allMods.merged.includes(item.id)
    //                           && !allMods.manual.includes(item.id)
    //                           && !allMods.managed.find(mod =>
    //                                 (mod.name === UNI_PATCH) && (mod.id === item.id)))
    //              .map((item, idx) => {
    //   if (idx === 0) {
    //     resetMaxPriority(lockedEntries.length);
    //   }
    //   return {
    //     ...item,
    //     data: {
    //       prefix: getPriority(item),
    //     },
    //   };
    // });

    // const filteredOrder = loadOrder
    //   .filter(key => lockedEntries.find(item => item.id === key) === undefined)
    //   .reduce((accum, key, idx) => {
    //     accum.push(loadOrder[idx]);
    //     return accum;
    //   }, []);
    // knownManuallyAdded.forEach(known => {
    //   const diff = loadOrder.length - filteredOrder.length;
  
    //   const pos = filteredOrder[known.id].pos - diff;
    //   items = [].concat(items.slice(0, pos) || [], known, items.slice(pos) || []);
    // });
  
    // let preSorted = [].concat(
    //   ...lockedEntries,
    //   items.filter(item => {
    //     if (typeof(item?.name) !== 'string') {
    //       return false;
    //     }
    //     const isLocked = lockedEntries.find(locked => locked.name === item.name) !== undefined;
    //     const doNotDisplay = DO_NOT_DISPLAY.includes(item.name.toLowerCase());
    //     return !isLocked && !doNotDisplay;
    //   }),
    //   ...unknownManuallyAdded);
  
    // const isExternal = (entry) => allMods.managed.find(man => man.id === entry.id) === undefined;
    // preSorted = preSorted.reduce((accum, entry, idx) => {
    //   if (lockedEntries.indexOf(entry) !== -1 || idx === 0) {
    //     accum.push(entry);
    //   } else {
    //     const prevPrefix = parseInt(accum[idx - 1]?.data?.prefix, 10);
    //     if (prevPrefix >= entry?.prefix) {
    //       accum.push({
    //         ...entry,
    //         data: {
    //           prefix: prevPrefix + 1,
    //         }
    //       });
    //     } else {
    //       accum.push({ ...entry });
    //     }
    //   }
    //   return accum;
    // }, []);
    // return Promise.resolve(preSorted);
  }

  public async validate(prev: types.LoadOrder, current: types.LoadOrder): Promise<types.IValidationResult> {
    return Promise.resolve(undefined);
  }
}

export default TW3LoadOrder;