const GAME_ID = 'starfield';
const XBOX_ID = 'BethesdaSoftworks.ProjectGold';
const STEAMAPP_ID = '1716740';

const gameFinderQuery = {
  steam: [ { id: STEAMAPP_ID, prefer: 0 } ],
  xbox: [ { id: XBOX_ID } ],
}

function requiresLauncher(gamePath, store) {
  // If Xbox, we'll launch via Xbox app
  if (store === 'xbox') {
    return Promise.resolve({
      launcher: 'xbox',
      addInfo: {
        appId: XBOX_ID,
        parameters: [
          { appExecName: 'Game' }
        ]
      }
    });
  } else {
    return Promise.resolve(undefined);
  }
}

function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: 'Starfield',
    mergeMods: true,
    queryArgs: gameFinderQuery,
    queryModPath: () => '.',
    logo: 'gameart.jpg',
    executable: () => 'Starfield.exe',
    requiredFiles: [
      'Starfield.exe',
    ],
    requiresLauncher,
  });

  return true;
}

module.exports = {
  default: main,
};