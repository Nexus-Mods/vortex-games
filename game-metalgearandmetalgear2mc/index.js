
const spec = {
  "game": {
    "id": "metalgearandmetalgear2mc",
    "name": "Metal Gear & Metal Gear 2: Solid Snake - Master Collection",
    "executable": "launcher.exe",
    "logo": "gameart.png",
    "mergeMods": true,
    "modPath": ".",
    "modPathIsRelative": true,
    "requiredFiles": [
      "launcher.exe",
	  "METAL GEAR.exe"
    ],
    "details": {
      "steamAppId": 2131680,
      "nexusPageId": "metalgearandmetalgear2mc"
    },
    "environment": {
      "SteamAPPId": "2131680"
    }
  },
  "discovery": {
    "ids": [
      "2131680"
    ],
    "names": []
  }
};


const tools = [
  /*
  {
    // unique id
    id: 'skse',
    // display name of the tool
    name: 'Skyrim Script Extender',
    // optional short name for cases where the UI has limited space
    shortName: 'SKSE',
    // the executable to to run
    executable: () => 'skse_loader.exe',
    // list of command line parameters to pass to the tool
    parameters: [
      // '--foobar', '--fullscreen'
    ],
    // files that need to exist in the tool directory. This is used
    // for the automatic detection of the tool
    requiredFiles: [
      'skse_loader.exe',
    ],
    // if true, the tool is run in a shell. Some applications written to be run
    // from the command line/prompt will not work correctly otherwise
    shell: false,
    // if true, the tool will be a detached process, meaning that if Vortex is closed,
    // the tool is not terminated.
    detach: false,
    // set this to true if the tool is installed in the same directory as the
    // game. This helps automatic discovery of the tool
    relative: true,
    // if set, Vortex will not start other tools or the game while this one is running.
    // set this to true if the tools may interfere with each other or if you're unsure
    exclusive: true,
    // if this is true and the tool is detected, whenever the user starts the game,
    // this tool is run instead.
    defaultPrimary: true,
  },
  */
];


const { actions, fs, util } = require('vortex-api');
const path = require('path');
const template = require('string-template');

function modTypePriority(priority) {
    return {
        high: 25,
        low: 75,
    }[priority];
}

function pathPattern(api, game, pattern) {
    var _a;
    return template(pattern, {
        gamePath: (_a = api.getState().settings.gameMode.discovered[game.id]) === null || _a === void 0 ? void 0 : _a.path,
        documents: util.getVortexPath('documents'),
        localAppData: process.env['LOCALAPPDATA'],
        appData: util.getVortexPath('appData'),
    });
}

function makeFindGame(api, gameSpec) {
    return () => util.GameStoreHelper.findByAppId(gameSpec.discovery.ids)
        .catch(() => util.GameStoreHelper.findByName(gameSpec.discovery.names))
        .then((game) => game.gamePath);
}

function makeGetModPath(api, gameSpec) {
    return () => gameSpec.game.modPathIsRelative !== false
        ? gameSpec.game.modPath || '.'
        : pathPattern(api, gameSpec.game, gameSpec.game.modPath);
}

function makeRequiresLauncher(api, gameSpec) {
    return () => Promise.resolve((gameSpec.game.requiresLauncher !== undefined)
        ? { launcher: gameSpec.game.requiresLauncher }
        : undefined);
}

function applyGame(context, gameSpec) {
    const game = {
        ...gameSpec.game,
        queryPath: makeFindGame(context.api, gameSpec),
        queryModPath: makeGetModPath(context.api, gameSpec),
        requiresLauncher: makeRequiresLauncher(context.api, gameSpec),
        requiresCleanup: true,
        executable: () => gameSpec.game.executable,
        supportedTools: tools,
    };
    context.registerGame(game);
    (gameSpec.modTypes || []).forEach((type, idx) => {
        context.registerModType(type.id, modTypePriority(type.priority) + idx, (gameId) => {
            var _a;
            return (gameId === gameSpec.game.id)
                && !!((_a = context.api.getState().settings.gameMode.discovered[gameId]) === null || _a === void 0 ? void 0 : _a.path);
        }, (game) => pathPattern(context.api, game, type.targetPath), () => Promise.resolve(false), { name: type.name });
    });
}

function main(context) {
  applyGame(context, spec);
  context.once(() => {
  });
  return true;
}

module.exports = {
  default: main,
};
