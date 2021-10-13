import { types } from 'vortex-api';

import ComMetadataManager from './ComMetadataManager';

// Surely "LoadBeforeThis" would mean we need a regular DependedModule entry
//  and "LoadAfterThis" means we add nothing at all ?
export type OrderType = 'LoadAfterThis' | 'LoadBeforeThis';

export interface IDependency {
  // The id of the module the mod depends on.
  id: string;

  // How we order it.
  order: OrderType;

  // Heard of the DependentVersion attribute ?
  version: string;

  // We need to load our mod Before/After this module (but not really)
  optional: boolean;

  // Signifies that this "dependency" is incompatible
  //  with the installed mod.
  incompatible: boolean;
}

export interface ISubModule {
  // The id of this module
  id: string;

  // The dependency array
  dependencies: IDependency[];
}

export interface IProps {
  state: types.IState;
  profile: types.IProfile;
  discovery: types.IDiscoveryResult;
  enabledMods: { [modId: string]: types.IMod };
}

export interface ISortProps {
  subModIds: string[];
  allowLocked: boolean;
  metaManager: ComMetadataManager;
  loadOrder?: any;
}
