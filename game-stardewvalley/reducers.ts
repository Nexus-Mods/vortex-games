import * as actions from './actions';

import { types, util } from 'vortex-api';

export interface IStateSDV {
  useRecommendations: boolean;
}

const sdvReducers: types.IReducerSpec<IStateSDV> = {
  reducers: {
    [actions.setRecommendations as any]: (state, payload) => {
      return util.setSafe(state, ['useRecommendations'], payload);
    },
  },
  defaults: {
    useRecommendations: undefined,
  },
}

export default sdvReducers;
