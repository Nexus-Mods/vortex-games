const Promise = require('bluebird');
const React = require('react');
const BS = require('react-bootstrap');
const { connect } = require('react-redux');
const path = require('path');
const { actions, fs, DraggableList, FlexLayout, MainPage, selectors, util } = require('vortex-api');

const GAME_ID = 'kingdomcomedeliverance';
const I18N_NAMESPACE = `game-${GAME_ID}`;

let _PAK_MODS = [];

function findGame() {
  return util.steam.findByAppId('379430')
      .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return refreshPakMods().then(() => fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'),
    () => Promise.resolve()));
}

function transformId(input) {
  // the game doesn't like spaces in its mod names
  return input.replace(/[ -.]/g, '');
}

function modIsEnabled(props, mod) {
  return (!!props.modState[mod])
    ? props.modState[mod].enabled
    : false;
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
  .then(() => Promise.resolve(entries));
}

function refreshPakMods() {
  const state = _API.store.getState();
  const installationPath = selectors.installPathForGame(state, GAME_ID);
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], []);
  const keys = Object.keys(mods);
  return Promise.reduce(keys, (accum, mod) => {
    const modPath = path.join(installationPath, mods[mod].installationPath);
    return walkAsync(modPath)
      .then(entries => (entries.find(file => file.toLowerCase().endsWith('.pak')) !== undefined)
        ? accum.concat(mod)
        : accum);
  }, []).then(pakFiles => {
    _PAK_MODS = pakFiles;
    return Promise.resolve();
  });
}

function LoadOrderBase(props) {
  const loValue = (input) => {
    const idx = props.order.indexOf(input);
    return idx !== -1 ? idx : props.order.length;
  }

  const filtered = Object.keys(props.mods).filter(mod => (modIsEnabled(props, mod)) && (_PAK_MODS.indexOf(mod) !== -1));
  const sorted = filtered.sort((lhs, rhs) => loValue(lhs) - loValue(rhs));

  class ItemRenderer extends React.Component {
    render() {
      const item = this.props.item;
      return !modIsEnabled(props, item)
        ? null
        : React.createElement(BS.ListGroupItem, {
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
            src: props.mods[item].attributes.pictureUrl
                  ? props.mods[item].attributes.pictureUrl
                  : `${__dirname}/gameart.jpg`,
            className: 'mod-picture',
            width:'75px',
            height:'45px',
            style: {
              margin: '5px 10px 5px 5px',
              border: '1px solid var(--brand-secondary,#D78F46)',
            },
          }),
          util.renderModName(props.mods[item])));
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
                items: sorted,
                itemRenderer: ItemRenderer,
                style: {
                  height: '100%',
                  overflow: 'auto',
                  borderWidth: 'var(--border-width, 1px)',
                  borderStyle: 'solid',
                  borderColor: 'var(--border-color, white)',
                },
                apply: ordered => {
                  props.onSetDeploymentNecessary(props.profile.gameId, true);
                  return props.onSetOrder(props.profile.id, ordered)
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
                      + 'to define the order in which .PAK files are loaded, Vortex will write the folder names of the displayed '
                      + 'mods in the order you have set. '
                      + 'Mods placed at the bottom of the load order will have priority over those above them.', { ns: I18N_NAMESPACE })),
                  React.createElement('p', {},
                  props.t('Note: You can only manage mods installed with Vortex. Installing other mods manually may cause unexpected errors.', { ns: I18N_NAMESPACE })),
              ))
        )))));
}

let _API = undefined;
function main(context) {
  _API = context.api;
  context.registerGame({
    id: GAME_ID,
    name: 'Kingdom Come:\tDeliverance',
    mergeMods: mod => transformId(mod.id),
    queryPath: findGame,
    queryModPath: () => 'Mods',
    logo: 'gameart.jpg',
    executable: () => 'Bin/Win64/KingdomCome.exe',
    requiredFiles: [
      'Bin/Win64/KingdomCome.exe',
    ],
    setup: prepareForModding,
    details: {
      steamAppId: 379430,
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
      const profile = util.getSafe(state, ['persistent', 'profiles', profileId], undefined);
      if (!!profile && (profile.gameId === GAME_ID) && (_PAK_MODS.indexOf(modId) === -1)) {
        refreshPakMods();
      }
    });
    // the bake-settings event receives the list of enabled mods, sorted by priority. perfect.
    context.api.events.on('bake-settings', (gameId, mods) => {
      if (gameId === GAME_ID) {
        const store = context.api.store;
        const state = store.getState();
        const profile = selectors.activeProfile(state);
        const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], []);
        const discovery = util.getSafe(state, ['settings', 'gameMode', 'discovered', gameId], undefined);
        if ((discovery === undefined) || (discovery.path === undefined)) {
          // should never happen and if it does it will cause errors elsewhere as well
          log('error', 'kingdomcomedeliverance was not discovered');
          return;
        }

        const modOrderFile = path.join(discovery.path, 'Mods', 'mod_order.txt');
        const transformedMods = loadOrder.map(mod => transformId(mod));
        prepareForModding(discovery)
          .then(() => fs.writeFileAsync(modOrderFile, transformedMods.join('\n')))
      }
    })
  });

  return true;
}

function mapStateToProps(state) {
  const profile = selectors.activeProfile(state);
  return {
    profile,
    modState: util.getSafe(profile, ['modState'], {}),
    mods: util.getSafe(state, ['persistent', 'mods', profile.gameId], []),
    order: util.getSafe(state, ['persistent', 'loadOrder', profile.id], []),
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
