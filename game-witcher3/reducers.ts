import { types, util } from 'vortex-api';
import { setPriorityType } from './actions';

// reducer
export const W3Reducer: types.IReducerSpec = {
  reducers: {
    [setPriorityType as any]: (state, payload) => {
      return util.setSafe(state, ['prioritytype'], payload);
    },
  },
  defaults: {
    prioritytype: 'prefix-based',
  },
};
