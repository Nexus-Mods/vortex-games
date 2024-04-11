/*
  FBLO does not currently support individual context actions
   leaving this here for now as we may decide to enhance FBLO in
   the future.
*/
// const onSetPriority = (itemKey, wantedPriority) => {
//   return this.writeToModSettings()
//     .then(() => {
//       wantedPriority = +wantedPriority;
//       const state = context.api.store.getState();
//       const activeProfile = selectors.activeProfile(state);
//       const modId = _INI_STRUCT[itemKey].VK;
//       const loEntry = loadOrder[modId];
//       if (priorityManager.priorityType === 'position-based') {
//         context.api.store.dispatch(actions.setLoadOrderEntry(
//           activeProfile.id, modId, {
//             ...loEntry,
//             pos: (loEntry.pos < wantedPriority) ? wantedPriority : wantedPriority - 2,
//         }));
//         loadOrder = util.getSafe(state, ['persistent', 'loadOrder', activeProfile.id], {});
//       } else {
//         context.api.store.dispatch(actions.setLoadOrderEntry(
//           activeProfile.id, modId, {
//             ...loEntry,
//             prefix: parseInt(_INI_STRUCT[itemKey].Priority, 10),
//         }));
//       }
//       if (refreshFunc !== undefined) {
//         refreshFunc();
//       }
//     })
//     .catch(err => modSettingsErrorHandler(context, err,
//       'Failed to modify load order file'));
// };