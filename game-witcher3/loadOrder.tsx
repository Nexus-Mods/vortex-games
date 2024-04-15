/* eslint-disable */
import React from 'react';
import { selectors, types } from 'vortex-api';

import { GAME_ID, LOCKED_PREFIX, UNI_PATCH } from './common';
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
    return IniStructure.getInstance(this.mApi, this.mPriorityManager)
                       .setINIStruct(loadOrder, this.mPriorityManager);
  }

  private readableNames = {[UNI_PATCH]: 'Unification/Community Patch'};
  public async deserializeLoadOrder(): Promise<types.LoadOrder> {
    const state = this.mApi.getState();
    const activeProfile = selectors.activeProfile(state);
    if (activeProfile?.id === undefined) {
      return Promise.resolve([]);
    }
    const findName = (val: string) => this.readableNames?.[val] || val;
    try {
      const ini = await IniStructure.getInstance(this.mApi, this.mPriorityManager).readStructure();
      const entries = Object.keys(ini.data).reduce((accum, iter, idx) => {
          const entry = ini.data[iter];
          accum[iter.startsWith(LOCKED_PREFIX) ? 'locked' : 'regular'].push({
            id: iter,
            name: findName(iter),
            enabled: entry.Enabled === '1',
            modId: entry?.VK ?? iter,
            locked: iter.startsWith(LOCKED_PREFIX),
            data: {
              prefix: iter.startsWith(LOCKED_PREFIX) ? accum.locked.length : entry?.Priority ?? idx + 1,
            }
          })
          return accum;
        }, { locked: [], regular: [] });
      const finalEntries = [].concat(entries.locked, entries.regular);
      return Promise.resolve(finalEntries);
    } catch (err) {
      return 
    }
  }

  public async validate(prev: types.LoadOrder, current: types.LoadOrder): Promise<types.IValidationResult> {
    return Promise.resolve(undefined);
  }
}

export default TW3LoadOrder;