const Promise = require('bluebird');
const path = require('path');
const { actions, fs, util } = require('vortex-api');

let _API;
const GAME_ID = 'sekiro';
const STEAM_ID = 814380;
const DINPUT = 'dinput8.dll';
const PARTS_DCX_EXT = '.partsbnd.dcx';

function findGame() {
  return util.steam.findByAppId(STEAM_ID.toString())
    .then(game => game.gamePath);
}

function prepareForModding(discovery) {
  const modEngineDInput = path.join(discovery.path, DINPUT);
  const showModEngineDialog = () => new Promise((resolve, reject) => {
    _API.store.dispatch(actions.showDialog('question', 'Action required',
      {
        message: 'Sekiro requires "Sekiro Mod Engine" for mods to install and function correctly.\n' 
               + 'Vortex is able to install Mod Engine automatically (as a mod) but please ensure it is enabled\n'
               + 'and deployed at all times.'
      },
      [
        { label: 'Continue', action: () => resolve() },
        { label: 'Go to Mod Engine Page', action: () => {
            util.opn('https://www.nexusmods.com/sekiro/mods/6').catch(err => undefined);
            resolve();
        }},
      ]));
  });

  // Check whether mod engine is installed.
  return fs.ensureDirWritableAsync(path.join(discovery.path, 'mods', 'parts'), () => Promise.resolve())
    .then(() => fs.statAsync(modEngineDInput)
      .catch(err => (err.code === 'ENOENT')
        ? showModEngineDialog()
        : Promise.reject(err)));
}

function hasLooseParts(files) {
  const dcxFiles = files.filter(file => file.endsWith(PARTS_DCX_EXT));
  return (dcxFiles.length > 0)
    ? dcxFiles[0].indexOf(path.sep + 'parts' + path.sep) === -1
    : false;
}

function installLooseMod(files, destinationPath) {
  const dcxFiles = files.filter(file => file.endsWith(PARTS_DCX_EXT));
  const instructions = dcxFiles.map(file => {
    return {
      type: 'copy',
      source: file,
      destination: path.join('parts', path.basename(file)),
    };
  });

  return Promise.resolve({ instructions });
}

function testLooseMod(files, gameId) {
  return Promise.resolve({
    supported: ((gameId === GAME_ID) && (hasLooseParts(files))),
    requiredFiles: [],
  });
}

function main(context) {
  const gameExec = 'Sekiro.exe';
  _API = context.api;
  context.registerGame({
    id: GAME_ID,
    name: 'Sekiro',
    logo: 'gameart.jpg',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'mods',
    executable: () => gameExec,
    requiredFiles: [gameExec],
    details: {
      steamAppId: STEAM_ID,
    },
    setup: prepareForModding,
  });

  context.registerInstaller('sek-loose-files', 25, testLooseMod, installLooseMod);
}

module.exports = {
  default: main
};
