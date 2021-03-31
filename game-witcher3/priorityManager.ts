import { selectors, types, util } from 'vortex-api';

import { GAME_ID } from './common';

export type PriorityType = 'position-based' | 'prefix-based';
export interface ILoadOrderEntry {
  pos: number;
  enabled: boolean;
  prefix?: string;
  locked?: boolean;
  external?: boolean;
}

export interface ILoadOrder {
  [modId: string]: ILoadOrderEntry;
}

export interface IOffsetMap {
  [offset: number]: number;
}

interface IProps {
  state: types.IState;
  profile: types.IProfile;
  loadOrder: { [modId: string]: ILoadOrderEntry };
  minPriority: number;
}

export class PriorityManager {
  private mApi: types.IExtensionApi;
  private mPriorityType: PriorityType;
  private mMaxPriority: number;

  constructor(api: types.IExtensionApi, priorityType: PriorityType) {
    this.mApi = api;
    this.mPriorityType = priorityType;
    this.resetMaxPriority();
  }

  set priorityType(type: PriorityType) {
    this.mPriorityType = type;
  }

  get priorityType() {
    return this.mPriorityType;
  }

  public resetMaxPriority = () => {
    const props: IProps = this.genProps();
    if (props === undefined) {
      this.mMaxPriority = 0;
      return;
    }
    this.mMaxPriority = this.getMaxPriority(props);
  }

  public getPriority = (item: types.ILoadOrderDisplayItem) => {
    const { loadOrder, minPriority } = this.genProps();
    const itemKey = Object.keys(loadOrder).find(x => x === item.id);
    if (itemKey !== undefined) {
      if (this.mPriorityType === 'position-based') {
        const position = loadOrder[itemKey].pos + 1;
        return (position > minPriority)
          ? position : this.mMaxPriority++;
      } else {
        const prefixVal = (loadOrder[itemKey]?.prefix !== undefined)
        ? parseInt(loadOrder[itemKey].prefix, 10) : loadOrder[itemKey].pos;
        const posVal = loadOrder[itemKey].pos;
        if (posVal !== prefixVal && prefixVal > minPriority) {
          return prefixVal;
        } else {
          return (posVal > minPriority)
            ? posVal : this.mMaxPriority++;
        }
      }
    }

    return this.mMaxPriority++;
  }

  private genProps = (): IProps => {
    const state: types.IState = this.mApi.getState();
    const lastProfId = selectors.lastActiveProfileForGame(state, GAME_ID);
    if (lastProfId === undefined) {
      return undefined;
    }
    const profile = selectors.profileById(state, lastProfId);
    if (profile === undefined) {
      return undefined;
    }

    const loadOrder: { [modId: string]: ILoadOrderEntry } = util.getSafe(state,
      ['persistent', 'loadOrder', lastProfId], {});

    const lockedEntries = Object.keys(loadOrder).filter(key => loadOrder[key]?.locked);
    const minPriority = lockedEntries.length;
    return { state, profile, loadOrder, minPriority };
  }

  private getMaxPriority = (props: IProps) => {
    const { loadOrder, minPriority } = props;
    return Object.keys(loadOrder).reduce((prev, key) => {
      const prefixVal = (loadOrder[key]?.prefix !== undefined)
        ? parseInt(loadOrder[key].prefix, 10)
        : loadOrder[key].pos;
      const posVal = loadOrder[key].pos;
      if (posVal !== prefixVal) {
        prev = (prefixVal > prev)
          ? prefixVal : prev;
      } else {
        prev = (posVal > prev)
          ? posVal : prev;
      }
      return prev;
    }, minPriority);
  }
}
