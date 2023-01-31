import { createAction } from 'redux-act';

export const setRecommendations = createAction('SET_SDV_RECOMMENDATIONS', (enabled: boolean) => enabled);
