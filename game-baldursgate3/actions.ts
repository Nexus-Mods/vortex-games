import { createAction } from 'redux-act';

// actions
export const setAutoExportLoadOrder = createAction('BG3_SETTINGS_AUTO_EXPORT', (enabled: boolean) => enabled);
export const setPlayerProfile = createAction('BG3_SET_PLAYERPROFILE', name => name);
export const settingsWritten = createAction('BG3_SETTINGS_WRITTEN',  (profile: string, time: number, count: number) => ({ profile, time, count }));

