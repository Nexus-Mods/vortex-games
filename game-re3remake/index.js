const Promise = require('bluebird');
const path = require('path');

const { actions, fs, log, selectors, util } = require('vortex-api');

// Expected file name for the qbms script.
const BMS_SCRIPT = path.join(__dirname, 're3_pak_unpack.bms');

// Invalidation qbms script - this script relies on a filtered.list
//  file to be generated.
const INVAL_SCRIPT = path.join(__dirname, 're3_pak_invalidate.bms');

// Revalidation qbms script - this script relies on a invalcache.file
//  file to be generated and placed next to the input archive.
const REVAL_SCRIPT = path.join(__dirname, 're3_pak_revalidate.bms');

// RE2 filenames are encrypted. The list file contains
//  the actual filenames mapped against their murmur3 hash.
const ORIGINAL_FILE_LIST = path.join(__dirname, 're3_pak_names_release.list');

const NATIVES_DIR = 'natives' + path.sep;
const STEAM_DLL = 'steam_api64.dll';
const GAME_PAK_FILE = 're_chunk_000.pak';
const GAME_ID = 'residentevil32020';
const STEAM_ID = 952060;

const I18N_NAMESPACE = `game-${GAME_ID}`;

function findGame() {
  return util.steam.findByAppId(STEAM_ID.toString())
    .then(game => game.gamePath);
}

function showBranchWarning(api) {
  const t = api.translate;
  api.sendNotification({
    id: 're3-branch-warning-notification',
    type: 'warning',
    message: api.translate('Resident Evil 3 RT(DX12) Update is incompatible', { ns: I18N_NAMESPACE }),
    allowSuppress: true,
    actions: [
      {
        title: 'More',
        action: (dismiss) => {
          api.showDialog('info', 'Resident Evil 3 RT(DX12) Update', {
            bbcode: t('The latest Resident Evil 3 Ray Tracing update is not compatible with '
                    + 'the Vortex game extension. To successfully mod your game you will need to '
                    + 'switch to the “dx11_non-rt” branch of the game.{{bl}}'
                    + 'You can use Vortex’s built-in Steam File Verification to overwrite the '
                    + 'updated files with the previous moddable versions by clicking ‘Fix’ below.{{bl}}'
                    + 'Alternatively, you can manually switch the Resident Evil 3 branch in Steam by right '
                    + 'clicking the game in your Steam library and clicking Properties. Then click Betas and '
                    + 'select the “dx11_non-rt” option in the drop-down menu. You will also need to delete '
                    + 'the “invalcache.json” file inside your games staging folder.{{bl}}'
                    + 'Note: We recommend switching the branch to “dx11_non-rt” in Steam to prevent future updates from breaking compatibility with mods.',
                  { replace: { bl: '[br][/br][br][/br]' } }),
            checkboxes: [
              { id: 'dontaskagain', text: 'Don\'t ask me again', value: false },
            ],
          }, [
            { label: 'Close', action: () => {
                dismiss();
              }
            },
            { label: 'Fix', action: () => {
              api.events.emit('re-engine-wrapper-run-file-verification', GAME_ID);
              api.store.dispatch(actions.suppressNotification('re3-branch-warning-notification', true));
              dismiss();
            }
          },
          ])
          .then((result) => {
            if (result.input['dontaskagain']) {
              api.store.dispatch(actions.suppressNotification('re3-branch-warning-notification', true));    
            }
            return Promise.resolve();
          })
        },
      },
      {
        title: 'Fix',
        action: dismiss => {
          api.events.emit('re-engine-wrapper-run-file-verification', GAME_ID);
          api.store.dispatch(actions.suppressNotification('re3-branch-warning-notification', true));
          dismiss();
        }
      }
    ],
  });
}

function prepareForModding(discovery, api) {
  if (api.ext.addReEngineGame === undefined) {
    return Promise.reject(new Error('re-engine-wrapper dependency is not loaded!'));
  }
  return new Promise((resolve, reject) => {
    api.ext.addReEngineGame({
      gameMode: GAME_ID,
      bmsScriptPaths: {
        invalidation: INVAL_SCRIPT,
        revalidation: REVAL_SCRIPT,
        extract: BMS_SCRIPT,
      },
      depotIds: [952061, 952062],
      steamBranch: 'dx11_non-rt',
      fileListPath: ORIGINAL_FILE_LIST,
    }, err => (err === undefined)
      ? resolve()
      : reject(err));
  }).then(() => {
    showBranchWarning(api);
    return fs.ensureDirWritableAsync(path.join(discovery.path, 'natives'))
  });
}

function testSupportedContent(files, gameId) {
  // Make sure we're able to support this mod.
  const supported = (gameId === GAME_ID)
    && (files.find(file => file.indexOf(NATIVES_DIR) !== -1) !== undefined);
  return Promise.resolve({
    supported,
    requiredFiles: [],
  });
}

async function installContent(files,
                              destinationPath,
                              gameId,
                              progressDelegate) {
  const rootPath = files.find(file => file.endsWith(NATIVES_DIR));
  const idx = rootPath.length - NATIVES_DIR.length;
  // Remove directories and anything that isn't in the rootPath.
  let filtered = files.filter(file =>
    ((file.indexOf(rootPath) !== -1)
      && (!file.endsWith(path.sep))));

  filtered = filtered.map(file => {
    return {
      source: file,
      destination: file.substr(idx),
    };
  });

  const instructions = filtered.map(file => {
    return {
      type: 'copy',
      source: file.source,
      destination: file.destination.toLowerCase(),
    }
  });

  return Promise.resolve({ instructions });
}

function main(context) {
  context.requireExtension('re-engine-wrapper');
  context.registerGame({
    id: GAME_ID,
    name: 'Resident Evil 3 (2020)',
    compatible: { usvfs: false },
    logo: 'gameart.jpg',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => '.',
    executable: () => 're3.exe',
    requiredFiles: ['re3.exe', GAME_PAK_FILE],
    //requiresLauncher,
    environment: {
      SteamAPPId: STEAM_ID.toString(),
    },
    details: {
      hideSteamKit: true,
      hashFiles: ['re3.exe'],
    },
    setup: (discovery) => prepareForModding(discovery, context.api),
  });

  context.registerInstaller('re3qbmsmod', 25, testSupportedContent, installContent);
}

module.exports = {
  default: main
};