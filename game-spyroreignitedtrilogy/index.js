const Promise = require('bluebird');
const React = require('react');
const BS = require('react-bootstrap');
const { connect } = require('react-redux');
const path = require('path');
const { actions, fs, DraggableList, FlexLayout, MainPage, selectors, util } = require('vortex-api');

// Nexus Mods id for the game.
const SPYRO_ID = 'spyroreignitedtrilogy';

const I18N_NAMESPACE = `game-${SPYRO_ID}`;

// All Spyro mods will be .pak files
const MOD_FILE_EXT = ".pak";

function findGame() {
  return util.steam.findByAppId('996580')
      .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'falcon', 'content', 'paks', '~mods'),
    () => Promise.resolve());
}

function installContent(files) {
  // The .pak file is expected to always be positioned in the mods directory we're going to disregard anything placed outside the root.
  const modFile = files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT);
  const idx = modFile.indexOf(path.basename(modFile));
  const rootPath = path.dirname(modFile);
  
  // Remove directories and anything that isn't in the rootPath.
  const filtered = files.filter(file => 
    ((file.indexOf(rootPath) !== -1) 
    && (!file.endsWith(path.sep))));

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: path.join(file.substr(idx)),
    };
  });

  return Promise.resolve({ instructions });
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  let supported = (gameId === SPYRO_ID) &&
    (files.find(file => path.extname(file).toLowerCase() === MOD_FILE_EXT) !== undefined);

  if (supported && files.find(file =>
      (path.basename(file).toLowerCase() === 'moduleconfig.xml')
      && (path.basename(path.dirname(file)).toLowerCase() === 'fomod'))) {
    supported = false;
  }

  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

let _API = undefined;
function main(context) {
  _API = context.api;
  context.registerGame({
    id: SPYRO_ID,
    name: 'Spyro Reignited Trilogy',
    mergeMods: mod => loadOrderPrefix(context.api, mod) + mod.id,
    queryPath: findGame,
    requiresCleanup: true,
    supportedTools: [],
    queryModPath: () => path.join('falcon', 'content', 'paks', '~mods'),
    logo: 'gameart.jpg',
    executable: () => 'Spyro.exe',
    requiredFiles: [
      'Spyro.exe'
    ],
    setup: prepareForModding,
    environment: {
      SteamAPPId: '996580',
    },
    details: {
      steamAppId: 996580,
    },
  });

  context.registerInstaller('spyroreignitedtrilogy-mod', 25, testSupportedContent, installContent);

  context.registerMainPage('sort-none', 'Load Order', LoadOrder, {
    id: 'spyro-load-order',
    hotkey: 'E',
    group: 'per-game',
    visible: () => selectors.activeGameId(context.api.store.getState()) === SPYRO_ID,
    props: () => ({
      t: context.api.translate,
    }),
  });

  return true;
}

function makePrefix(input) {
  let res = '';
  let rest = input;
  while (rest > 0) {
    res = String.fromCharCode(65 + (rest % 25)) + res;
    rest = Math.floor(rest / 25);
  }
  return util.pad(res, 'A', 3);
}

function loadOrderPrefix(api, mod) {
  const state = api.store.getState();
  const gameProfile = selectors.lastActiveProfileForGame(state, SPYRO_ID);
  if (gameProfile === undefined) {
    return 'ZZZZ-';
  }
  const profile = selectors.profileById(state, gameProfile);
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile?.id], []);

  const pos = loadOrder.indexOf(mod.id);
  if (pos === -1) {
    return 'ZZZZ-';
  }

  return makePrefix(pos) + '-';
}

function modIsEnabled(props, mod) {
  return (!!props.modState[mod])
    ? props.modState[mod].enabled
    : false;
}

function LoadOrderBase(props) {
  const loValue = (input) => {
    const idx = props.order.indexOf(input);
    return idx !== -1 ? idx : props.order.length;
  }
  
  const filtered = Object.keys(props.mods).filter(mod => modIsEnabled(props, mod));
  const sorted = filtered.sort((lhs, rhs) => loValue(lhs) - loValue(rhs));

  class ItemRenderer extends React.Component {
    render() {
      const item = this.props.item;
      const index = (props.order.indexOf(item) === -1)
        ? loadOrderPrefix(_API, item)
        : props.order.indexOf(item);

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
      React.createElement(BS.Panel, { id: 'spyro-loadorder-panel' },
        React.createElement(BS.Panel.Body, {},
          React.createElement(FlexLayout, { type: 'row' }, 
            React.createElement(FlexLayout.Flex, {}, 
              React.createElement(DraggableList, {
                id: 'spyro-loadorder',
                itemTypeId: 'spyro-loadorder-item',
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
                  props.onSedDeploymentNecessary(props.profile.gameId, true);
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
                  props.t('Drag and drop the mods on the left to reorder them. Spyro Reignited Trilogy loads mods in alphanumerical order so Vortex prefixes '
                      + 'the directory names with "AAA, AAB, AAC, ..." to ensure they load in the order you set here. '
                      + 'Mods placed at the bottom of the load order will have priority over those above them.', { ns: I18N_NAMESPACE })),
                  React.createElement('p', {}, 
                  props.t('Note: You can only manage mods installed with Vortex. Installing other mods manually may cause unexpected errors.', { ns: I18N_NAMESPACE })),
              ))
        )))));
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
    onSedDeploymentNecessary: (gameId, necessary) => dispatch(actions.setDeploymentNecessary(gameId, necessary)),
    onSetOrder: (profileId, ordered) => dispatch(actions.setLoadOrder(profileId, ordered)),
  };
}

const LoadOrder = connect(mapStateToProps, mapDispatchToProps)(LoadOrderBase);

module.exports = {
  default: main,
};
