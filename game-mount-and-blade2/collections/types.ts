import { IRevision } from '@nexusmods/nexus-api';
import { types } from 'vortex-api';

import { ILoadOrder } from '../types';

export interface ICollectionsData {
  loadOrder: ILoadOrder;
}

export interface IExtendedInterfaceProps {
  t: types.TFunction;
  gameId: string;
  collection: types.IMod;
  revisionInfo: IRevision;
}

export interface IExtensionFeature {
  id: string;
  generate: (gameId: string, includedMods: string[]) => Promise<any>;
  parse: (gameId: string, collection: ICollectionsData) => Promise<void>;
  title: (t: types.TFunction) => string;
  condition?: (state: types.IState, gameId: string) => boolean;
  editComponent?: React.ComponentType<IExtendedInterfaceProps>;
}
