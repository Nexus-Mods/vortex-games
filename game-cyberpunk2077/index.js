const path = require('path');
const { fs, log, util } = require('vortex-api');
const winapi = require('winapi-bindings');

const GAME_NAME = 'Cyberpunk 2077';
const GAME_ID = 'cyberpunk2077';
const STEAMAPP_ID = '1091500';
const GOGAPP_ID = '1423049311';

function main(context) {
    context.registerGame({
        id: GAME_ID,
        name: GAME_NAME,
        mergeMods: true,
        queryPath: findGame,
        supportedTools: [],
        queryModPath: () => '',
        logo: 'gameart.jpg',
        executable: () => 'bin/x64/Cyberpunk2077.exe',
        requiredFiles: [
            'REDprelauncher.exe',
            'bin/x64/Cyberpunk2077.exe'
        ],
        setup: prepareForModding,
        environment: {
            SteamAPPId: STEAMAPP_ID,
        },
        details: {
            steamAppId: STEAMAPP_ID,
            gogAppId: GOGAPP_ID,
        },
    });

    return true
}

function findGame() {
    try {
        return util.steam.findByName(GAME_NAME).then(game => game.gamePath);
    } catch (err) {
        return util.GameStoreHelper.findByAppId([STEAMAPP_ID, GOGAPP_ID]).then(game => game.gamePath);
    }
}

function prepareForModding(discovery) {
    return fs.readdirAsync(path.join(discovery.path));
}

module.exports = {
    default: main,
};