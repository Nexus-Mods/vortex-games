const Promise = require('bluebird');
const React = require('react');
const BS = require('react-bootstrap');
const { connect } = require('react-redux');
const winapi = require('winapi-bindings');
const path = require('path');
const semver = require('semver');
const { actions, fs, DraggableList, FlexLayout, MainPage, Panel, selectors, util } = require('vortex-api');
const { parseXmlString } = require('libxmljs');

const STEAM_DLL = 'steamclient64.dll';
const GAME_ID = '7daystodie';
const MOD_INFO = 'modinfo.xml';
const I18N_NAMESPACE = `game-${GAME_ID}`;

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 251570',
      'InstallLocation');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return util.steam.findByName('7 Days to Die')
      .catch(() => util.steam.findByAppId('251570'))
      .then(game => game.gamePath);
  }
}

function gameExecutable() {
  return '7DaysToDie.exe';
}

function getModName(modInfoPath) {
  let modInfo;
  return fs.readFileAsync(modInfoPath)
    .then(xmlData => {
      try {
        modInfo = parseXmlString(xmlData);
        const modName = modInfo.get('//Name');
        return ((modName !== undefined) && (modName.attr('value').value() !== undefined))
          ? Promise.resolve(modName.attr('value').value())
          : Promise.reject(new util.DataInvalid('Unexpected modinfo.xml format'));
      } catch (err) {
        return Promise.reject(new util.DataInvalid('Failed to parse ModInfo.xml file'))
      }
    })
}

function installContent(files,
                        destinationPath,
                        gameId,
                        progressDelegate) {
  // The modinfo.xml file is expected to always be positioned in the root directory
  //  of the mod itself; we're going to disregard anything placed outside the root.
  const modFile = files.find(file => path.basename(file).toLowerCase() === MOD_INFO);
  const rootPath = path.dirname(modFile);
  return getModName(path.join(destinationPath, modFile))
    .then(modName => {
      modName = modName.replace(/[^a-zA-Z0-9]/g, '');

      // Remove directories and anything that isn't in the rootPath (also directories).
      const filtered = files.filter(filePath =>
        filePath.startsWith(rootPath) && !filePath.endsWith(path.sep));

      const instructions = filtered.map(filePath => {
        return {
          type: 'copy',
          source: filePath,
          destination: path.relative(rootPath, filePath),
        };
      });

      return Promise.resolve({ instructions });
    });
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = (gameId === GAME_ID) &&
    (files.find(file => path.basename(file).toLowerCase() === MOD_INFO) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

function prepareForModding(discovery) {
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'),
    () => Promise.resolve());
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
  const profile = selectors.activeProfile(state);
  const loadOrder = util.getSafe(state, ['persistent', 'loadOrder', profile.id], []);
  const pos = loadOrder.indexOf(mod.id);
  if (pos === -1) {
    return 'ZZZZ-';
  }

  return makePrefix(pos) + '-';
}

function LoadOrderBase(props) {
  const loValue = (input) => {
    const idx = props.order.indexOf(input);
    return idx !== -1 ? idx : Number.MAX_SAFE_INTEGER;
  }

  const sorted = Object.keys(props.mods).sort((lhs, rhs) =>
    loValue(lhs) - loValue(rhs));

  class ItemRenderer extends React.Component {
    render() {
      return React.createElement(BS.ListGroupItem, {
        style: { backgroundColor: 'var(--brand-bg, black)' },
      }, util.renderModName(props.mods[this.props.item]))
    }
  }

  return React.createElement(MainPage, {},
    React.createElement(MainPage.Body, {},
      React.createElement(BS.Panel, { id: 'sevendtd-loadorder-panel' },
        React.createElement(BS.Panel.Body, {},
          React.createElement(FlexLayout, { type: 'row' }, 
            React.createElement(FlexLayout.Flex, {}, 
              React.createElement(DraggableList, {
                id: '7dtd-loadorder',
                itemTypeId: '7dtd-loadorder-item',
                items: sorted,
                itemRenderer: ItemRenderer,
                style: {
                  height: '100%',
                  overflow: 'auto',
                  borderWidth: 'var(--border-width, 1px)',
                  borderStyle: 'solid',
                  borderColor: 'var(--border-color, white)',
                },
                apply: ordered => props.onSetOrder(props.profile.id, ordered),
              })
            ),
            React.createElement(FlexLayout.Flex, {},
              React.createElement('div', {
                style: {
                  padding: 'var(--half-gutter, 15px)',
                }
              },
                React.createElement('p', {}, 
                  props.t('Change the load order with drag&drop.', { ns: I18N_NAMESPACE })),
                React.createElement('p', {}, 
                  props.t('7 Days to Die loads mods in alphabetic order so Vortex prefixes '
                      + 'the directory names with "AAA, AAB, AAC, ..." to ensure they '
                      + 'load in the order you set here.', { ns: I18N_NAMESPACE })),
              ))
        )))));
}

function mapStateToProps(state) {
  const profile = selectors.activeProfile(state);
  return {
    profile,
    mods: util.getSafe(state, ['persistent', 'mods', profile.gameId], []),
    order: util.getSafe(state, ['persistent', 'loadOrder', profile.id], []),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onSetOrder: (profileId, ordered) => dispatch(actions.setLoadOrder(profileId, ordered)),
  };
}

const LoadOrder = connect(mapStateToProps, mapDispatchToProps)(LoadOrderBase);

function migrate020(api, oldVersion) {
  if (semver.gte(oldVersion, '0.2.0')) {
    return Promise.resolve();
  }

  const state = api.store.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  const hasMods = Object.keys(mods).length > 0;

  if (!hasMods) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    return api.sendNotification({
      id: '7dtd-requires-upgrade',
      type: 'warning',
      message: api.translate('Mods for 7 Days to Die need to be reinstalled',
        { ns: I18N_NAMESPACE }),
      noDismiss: true,
      actions: [
        {
          title: 'Explain',
          action: () => {
            api.showDialog('info', '7 Days to Die', {
              text: 'In version 17 of the game 7 Days to Die the way mods are installed '
                  + 'has changed considerably. Unfortunately we are now not able to support '
                  + 'this change with the way mods were previously installed.\n'
                  + 'This means that for the mods to work correctly you have to reinstall '
                  + 'them.\n'
                  + 'We are sorry for the inconvenience.',
            }, [
              { label: 'Close' },
            ]);
          },
        },
        {
          title: 'Understood',
          action: dismiss => {
            dismiss();
            resolve();
          }
        }
      ],
    });
  });
}

function requiresLauncher(gamePath) {
  return fs.readdirAsync(gamePath)
    .then(files => (files.find(file => file.endsWith(STEAM_DLL)) !== undefined)
      ? Promise.resolve({ launcher: 'steam' })
      : Promise.resolve(undefined))
    .catch(err => Promise.reject(err));
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: '7 Days to Die',
    mergeMods: mod => loadOrderPrefix(context.api, mod) + mod.id,
    requiresCleanup: true,
    queryPath: findGame,
    queryModPath: () => 'Mods',
    requiresLauncher,
    logo: 'gameart.png',
    executable: gameExecutable,
    requiredFiles: [
      '7DaysToDie.exe',
    ],
    setup: prepareForModding,
    details: {
      steamAppId: 251570,
    },
  });

  context.registerInstaller('7dtd-mod', 25, testSupportedContent, installContent);

  context.registerMigration(old => migrate020(context.api, old));

  context.registerMainPage('sort-none', 'Load Order', LoadOrder, {
    id: '7dtd-plugins',
    hotkey: 'E',
    group: 'per-game',
    visible: () => selectors.activeGameId(context.api.store.getState()) === GAME_ID,
    props: () => ({
      t: context.api.translate,
    }),
  });

  return true;
}

module.exports = {
  default: main
};
