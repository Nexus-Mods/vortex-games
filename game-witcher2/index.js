const Promise = require('bluebird');
const path = require('path');
const { fs } = require('vortex-api');
const Registry = require('winreg');

function findGame() {
  if (Registry === undefined) {
    // linux ? macos ?
    return null;
  }

  let regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\Software\\CD Project Red\\The Witcher 2',
  });

  return new Promise((resolve, reject) => {
    regKey.get('InstallFolder', (err, result) => {
      if (err !== null) {
        reject(new Error(err.message));
      } else if (result === null) {
        reject(new Error('empty registry key'));
      } else {
        resolve(result.value);
      }
    });
  });
}

function testUserContent(instructions) {
  return Promise.resolve(instructions.find(
    instruction => path.basename(instruction.destination) === 'cook.hash'));
}

function prepareForModding(discovery) {
  return fs.ensureDirAsync(path.join(discovery.path, 'UserContent'));
}

function main(context) {
  context.registerGame({
    id: 'witcher2',
    name: 'The Witcher 2',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => 'CookedPC',
    logo: 'gameart.png',
    executable: () => 'bin/witcher2.exe',
    setup: prepareForModding,
    requiredFiles: [
      'bin/witcher2.exe',
      'bin/userContentManager.exe',
    ],
    details: {
      steamAppId: 20920,
    }
  });

  const getPath = (game) => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    return path.join(discovery.path, 'UserContent');
  };

  context.registerModType('witcher2user', 25, gameId => gameId === 'witcher2', getPath, testUserContent);

  return true;
}

module.exports = {
  default: main,
};
