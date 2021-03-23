const Promise = require('bluebird');
const React = require('react');
const BS = require('react-bootstrap');
const { connect } = require('react-redux');
const path = require('path');
const { actions, fs, DraggableList, FlexLayout, log, MainPage, selectors, util } = require('vortex-api');

const GAME_ID = 'kingdomcomedeliverance';
const I18N_NAMESPACE = `game-${GAME_ID}`;

const MODS_ORDER_FILENAME = 'mod_order.txt';

const STEAM_APPID = 379430;

const _MODS_STATE = {
  enabled: [],
  disabled: [],
  display: [],
}

function findGame() {
  return util.steam.findByAppId(STEAM_APPID.toString())
    .catch(() => util.epicGamesLauncher.findByAppId('Eel'))
    .then(game => game.gamePath);
}

function prepareForModding(context, discovery) {
  const state = context.api.store.getState();
  const profile = selectors.activeProfile(state);
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'), () => Promise.resolve())
    .then(() => getCurrentOrder(path.join(discovery.path, modsPath(), MODS_ORDER_FILENAME)))
    .catch(err => err.code === 'ENOENT' ? Promise.resolve([]) : Promise.reject(err))
    .then(data => setNewOrder({ context, profile },
      Array.isArray(data) ? data : data.split('\n')));
}

function transformId(input) {
  // the game doesn't like spaces in its mod names
  return input.replace(/[ -.]/g, '');
}

function getCurrentOrder(modOrderFilepath) {
  return fs.readFileAsync(modOrderFilepath, { encoding: 'utf8' });
}

function walkAsync(dir) {
  let entries = [];
  return fs.readdirAsync(dir).then(files => {
    return Promise.each(files, file => {
      const fullPath = path.join(dir, file);
      return fs.statAsync(fullPath).then(stats => {
        if (stats.isDirectory()) {
          return walkAsync(fullPath)
            .then(nestedFiles => {
              entries = entries.concat(nestedFiles);
              return Promise.resolve();
            })
        } else {
          entries.push(fullPath);
          return Promise.resolve();
        }
      });
    });
  })
  .then(() => Promise.resolve(entries))
  .catch(err => {
    log('error', 'Unable to read mod directory', err);
    return Promise.resolve(entries);
  });
}


function readModsFolder(modsFolder, api) {
  const extL = input => path.extname(input).toLowerCase();
  const isValidMod = modFile => ['.pak', '.cfg', '.manifest'].indexOf(extL(modFile)) !== -1;

  // Reads the provided folderPath and attempts to identify all
  //  currently deployed mods.
  return fs.readdirAsync(modsFolder)
    .then(entries => Promise.reduce(entries, (accum, current) => {
      const currentPath = path.join(modsFolder, current);
      return fs.readdirAsync(currentPath)
        .then(modFiles => {
          if (modFiles.some(isValidMod) === true) {
            accum.push(current);
          }
          return Promise.resolve(accum);
        })
        .catch(err => Promise.resolve(accum))
    }, []))
    .catch(err => {
      const allowReport = ['ENOENT', 'EPERM', 'EACCESS'].indexOf(err.code) === -1;
      api.showErrorNotification('failed to read kingdom come mods directory',
        err.message, { allowReport });
      return Promise.resolve([]);
    });
}

function listHasMod(modId, list) {
  return (!!list)
    ? list.map(mod =>
        transformId(mod).toLowerCase()).includes(modId.toLowerCase())
    : false;
}

function getManuallyAddedMods(disabledMods, enabledMods, modOrderFilepath, api) {
  const modsPath = path.dirname(modOrderFilepath);

  return readModsFolder(modsPath, api).then(deployedMods =>
    getCurrentOrder(modOrderFilepath)
      .catch(err => (err.code === 'ENOENT') ? Promise.resolve('') : Promise.reject(err))
      .then(data => {
        // 1. Confirmed to exist (deployed) inside the mods directory.
        // 2. Is not part of any of the mod lists which Vortex manages.
        const manuallyAdded = data.split('\n').filter(entry =>
            !listHasMod(entry, enabledMods)
          && !listHasMod(entry, disabledMods)
          && listHasMod(entry, deployedMods));

        return Promise.resolve(manuallyAdded);
      }));
}

function refreshModList(context, discoveryPath) {
  const state = context.api.store.getState();
  const profile = selectors.activeProfile(state);
  const installationPath = selectors.installPathForGame(state, GAME_ID);
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], []);
  const modKeys = Object.keys(mods);
  const modState = util.getSafe(profile, ['modState'], {});
  const enabled = modKeys.filter(mod => !!modState[mod] && modState[mod].enabled);
  const disabled = modKeys.filter(dis => !enabled.includes(dis));

  const extL = input => path.extname(input).toLowerCase();
  return Promise.reduce(enabled, (accum, mod) => {
    if (mods[mod]?.installationPath === undefined) {
      return accum;
    }
    const modPath = path.join(installationPath, mods[mod].installationPath);
    return walkAsync(modPath)
      .then(entries => (entries.find(fileName => ['.pak', '.cfg', '.manifest'].includes(extL(fileName))) !== undefined)
        ? accum.concat(mod)
        : accum);
  }, []).then(managedMods => {
    return getManuallyAddedMods(disabled, enabled, path.join(discoveryPath, modsPath(),
      MODS_ORDER_FILENAME), context.api)
      .then(manuallyAdded => {
        _MODS_STATE.enabled = [].concat(managedMods
          .map(mod => transformId(mod)), manuallyAdded);
        _MODS_STATE.disabled = disabled;
        _MODS_STATE.display = _MODS_STATE.enabled;
        return Promise.resolve();
      })
  });
}

function LoadOrderBase(props) {
  const getMod = (item) => {
    const keys = Object.keys(props.mods);
    const found = keys.find(key => transformId(key) === item);
    return found !== undefined
      ? props.mods[found]
      : { attributes: { name: item } };
  };

  class ItemRenderer extends React.Component {
    render() {
      if (props.mods === undefined) {
        return null;
      }

      const item = this.props.item;
      const mod = getMod(item);

      return React.createElement(BS.ListGroupItem, {
            style: {
              backgroundColor: 'var(--brand-bg, black)',
              borderBottom: '2px solid var(--border-color, white)'
            },
          },
          React.createElement('div', {
            style: {
              fontSize: '1.1em',
            },
          },
          React.createElement('img', {
            src: !!mod.attributes.pictureUrl
                  ? mod.attributes.pictureUrl
                  : `${__dirname}/gameart.jpg`,
            className: 'mod-picture',
            width:'75px',
            height:'45px',
            style: {
              margin: '5px 10px 5px 5px',
              border: '1px solid var(--brand-secondary,#D78F46)',
            },
          }),
          util.renderModName(mod)))
    }
  }

  return React.createElement(MainPage, {},
    React.createElement(MainPage.Body, {},
      React.createElement(BS.Panel, { id: 'kcd-loadorder-panel' },
        React.createElement(BS.Panel.Body, {},
          React.createElement(FlexLayout, { type: 'row' },
            React.createElement(FlexLayout.Flex, {},
              React.createElement(DraggableList, {
                id: 'kcd-loadorder',
                itemTypeId: 'kcd-loadorder-item',
                items: _MODS_STATE.display,
                itemRenderer: ItemRenderer,
                style: {
                  height: '100%',
                  overflow: 'auto',
                  borderWidth: 'var(--border-width, 1px)',
                  borderStyle: 'solid',
                  borderColor: 'var(--border-color, white)',
                },
                apply: ordered => {
                  // We only write to the mod_order file when we deploy to avoid (unlikely) situations
                  //  where a file descriptor remains open, blocking file operations when the user
                  //  changes the load order very quickly. This is all theoretical at this point.
                  props.onSetDeploymentNecessary(GAME_ID, true);
                  return setNewOrder(props, ordered);
                },
              })
            ),
            React.createElement(FlexLayout.Flex, {},
              React.createElement('div', {
                style: {
                  padding: 'var(--half-gutter, 15px)',
                }
              },
                React.createElement('h2', {},
                  props.t('Changing your load order', { ns: I18N_NAMESPACE })),
                React.createElement('p', {},
                  props.t('Drag and drop the mods on the left to reorder them. Kingdom Come: Deliverance uses a mod_order.txt file '
                      + 'to define the order in which mods are loaded, Vortex will write the folder names of the displayed '
                      + 'mods in the order you have set. '
                      + 'Mods placed at the bottom of the load order will have priority over those above them.', { ns: I18N_NAMESPACE })),
                  React.createElement('p', {},
                  props.t('Note: Vortex will detect manually added mods as long as these have been added to the mod_order.txt file. '
                        + 'Manually added mods are not managed by Vortex - to remove these, you will have to '
                        + 'manually erase the entry from the mod_order.txt file.', { ns: I18N_NAMESPACE })),
              ))
        )))));
}

function modsPath() {
  return 'Mods';
}

function setNewOrder(props, ordered) {
  const { context, profile, onSetOrder } = props;
  if (profile?.id === undefined) {
    // Not sure how we got here without a valid profile.
    //  possibly the user changed profile during the setup/preparation
    //  stage ? https://github.com/Nexus-Mods/Vortex/issues/7053
    log('error', 'failed to set new load order', 'undefined profile');
    return;
  }

  // We filter the ordered list just in case there's an empty
  //  entry, which is possible if the users had manually added
  //  empty lines in the load order file.
  const filtered = ordered.filter(entry => !!entry);
  _MODS_STATE.display = filtered;

  return (!!onSetOrder)
    ? onSetOrder(profile.id, filtered)
    : context.api.store.dispatch(actions.setLoadOrder(profile.id, filtered));
}

function writeOrderFile(filePath, modList) {
  return fs.removeAsync(filePath)
    .catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err))
    .then(() => fs.ensureFileAsync(filePath))
    .then(() => fs.writeFileAsync(filePath, modList.join('\n'), { encoding: 'utf8' }));
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Kingdom Come:\tDeliverance',
    mergeMods: mod => transformId(mod.id),
    queryPath: findGame,
    queryModPath: modsPath,
    logo: 'gameart.jpg',
    executable: (discoveredPath) => {
      try {
        const epicPath = path.join('Bin', 'Win64MasterMasterEpicPGO', 'KingdomCome.exe')
        fs.statSync(path.join(discoveredPath, epicPath));
        return epicPath;
      } catch (err) {
        return path.join('Bin', 'Win64', 'KingdomCome.exe');
      }
    },
    requiredFiles: [
      'Data/Levels/rataje/level.pak',
    ],
    setup: (discovery) => prepareForModding(context, discovery),
    //requiresCleanup: true, // Theoretically not needed, as we look for several file extensions when
                             //  checking whether a mod is valid or not. This may change.
    requiresLauncher: () => util.epicGamesLauncher.isGameInstalled('Eel')
      .then(epic => epic
        ? { launcher: 'epic', addInfo: 'Eel' }
        : undefined),
    environment: {
      SteamAPPId: STEAM_APPID.toString(),
    },
    details: {
      steamAppId: STEAM_APPID,
    },
  });

  context.registerMainPage('sort-none', 'Load Order', LoadOrder, {
    id: 'kcd-load-order',
    hotkey: 'E',
    group: 'per-game',
    visible: () => selectors.activeGameId(context.api.store.getState()) === GAME_ID,
    props: () => ({
      t: context.api.translate,
    }),
  });

  context.once(() => {
    context.api.events.on('mod-enabled', (profileId, modId) => {
      const state = context.api.store.getState();
      const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);

      const profile = util.getSafe(state, ['persistent', 'profiles', profileId], undefined);
      if (!!profile && (profile.gameId === GAME_ID) && (_MODS_STATE.display.indexOf(modId) === -1)) {
        refreshModList(context, discovery.path);
      }
    });

    context.api.events.on('purge-mods', () => {
      const store = context.api.store;
      const state = store.getState();
      const profile = selectors.activeProfile(state);
      if (profile === undefined || profile.gameId !== GAME_ID){
        return;
      }

      const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
      if ((discovery === undefined) || (discovery.path === undefined)) {
        // should never happen and if it does it will cause errors elsewhere as well
        log('error', 'kingdomcomedeliverance was not discovered');
        return;
      }

      const modsOrderFilePath = path.join(discovery.path, modsPath(), MODS_ORDER_FILENAME);
      const managedMods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
      const modKeys = Object.keys(managedMods);
      const modState = util.getSafe(profile, ['modState'], {});
      const enabled = modKeys.filter(mod => !!modState[mod] && modState[mod].enabled);
      const disabled = modKeys.filter(dis => !enabled.includes(dis));
      getManuallyAddedMods(disabled, enabled, modsOrderFilePath, context.api)
        .then(manuallyAdded => {
          writeOrderFile(modsOrderFilePath, manuallyAdded)
            .then(() => setNewOrder({ context, profile }, manuallyAdded));
        })
        .catch(err => {
          const userCanceled = (err instanceof util.UserCanceled);
          context.api.showErrorNotification('Failed to re-instate manually added mods', err, { allowReport: !userCanceled })
        });
    });

    context.api.onAsync('did-deploy', (profileId, deployment) => {
      const state = context.api.store.getState();
      const profile = selectors.profileById(state, profileId);
      if (profile === undefined || profile.gameId !== GAME_ID) {

        if (profile === undefined) {
          log('error', 'profile does not exist', profileId);
        }

        return Promise.resolve();
      }

      const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profileId], []);
      const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', profile.gameId], undefined);

      if ((discovery === undefined) || (discovery.path === undefined)) {
        // should never happen and if it does it will cause errors elsewhere as well
        log('error', 'kingdomcomedeliverance was not discovered');
        return Promise.resolve();
      }

      const modsFolder = path.join(discovery.path, modsPath());
      const modOrderFile = path.join(modsFolder, MODS_ORDER_FILENAME);

      return refreshModList(context, discovery.path)
        .then(() => {
          let missing = loadOrder
            .filter(mod => !listHasMod(transformId(mod), _MODS_STATE.enabled)
                        && !listHasMod(transformId(mod), _MODS_STATE.disabled))
            .map(mod => transformId(mod)) || [];

          // This is theoretically unecessary - but it will ensure no duplicates
          //  are added.
          missing = [ ...new Set(missing) ];
          const transformed = [ ..._MODS_STATE.enabled, ...missing ];
          const loValue = (input) => {
            const idx = loadOrder.indexOf(input);
            return idx !== -1 ? idx : loadOrder.length;
          }

          // Sort
          let sorted = transformed.length > 1
            ? transformed.sort((lhs, rhs) => loValue(lhs) - loValue(rhs))
            : transformed;

          setNewOrder({ context, profile }, sorted);
          return writeOrderFile(modOrderFile, transformed)
            .catch(err => {
              const userCanceled = (err instanceof util.UserCanceled);
              context.api.showErrorNotification('Failed to write to load order file', err, { allowReport: !userCanceled });
            });
        })
    });
  });

  return true;
}

function mapStateToProps(state) {
  const profile = selectors.activeProfile(state) || {};
  const profileId = !!profile ? profile.id : '';
  const gameId = !!profile ? profile.gameId : '';
  return {
    profile,
    modState: util.getSafe(profile, ['modState'], {}),
    mods: util.getSafe(state, ['persistent', 'mods', gameId], []),
    order: util.getSafe(state, ['persistent', 'loadOrder', profileId], []),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onSetDeploymentNecessary: (gameId, necessary) => dispatch(actions.setDeploymentNecessary(gameId, necessary)),
    onSetOrder: (profileId, ordered) => dispatch(actions.setLoadOrder(profileId, ordered)),
  };
}

const LoadOrder = connect(mapStateToProps, mapDispatchToProps)(LoadOrderBase);

module.exports = {
  default: main,
};
