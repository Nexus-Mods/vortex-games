const fs = require('fs');
const Promise = require('bluebird');
const opn = require('opn');
const path = require('path');
const winapi = require('winapi-bindings');
const {log, actions, util} = require('vortex-api');

const IsWin = process.platform === 'win32';

const NexusId = 'oxygennotincluded';
const Name = 'Oxygen Not Included';
const ExeName = 'OxygenNotIncluded';
const SteamId = 457140;

function main(context) {
    context.registerGame({
        id: NexusId,
        name: Name,
        logo: 'gameart.png',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => 'Mods',
        executable: () => ExeName + '.exe',
        requiredFiles: [ExeName + '.exe'],
        details: {
            steamAppId: SteamId,
        },
        setup: setup,
        supportedTools: [
            {
                id: 'UnityModManager',
                name: 'Unity Mod Manager',
                logo: 'umm.png',
                queryPath : findUnityModManager,
                executable: () => 'UnityModManager.exe',
                requiredFiles: ['UnityModManager.exe'],
            }],
    });

    function findGame() {
        return util.steam.findByAppId(SteamId.toString()).then(game => game.gamePath);
    }

    function findUnityModManager() {
        let result = '';
        if (IsWin) {
            const path = winapi.RegGetValue('HKEY_CURRENT_USER', 'Software\\UnityModManager', 'Path');
            if (path) {
                result = path.value;
            }
        }

        return Promise.resolve(result);
    }

    function setup(discovery) {
        // skip if UnityModManager found
        if (fs.existsSync(path.join(discovery.path, ExeName + '_Data', 'Managed', 'UnityModManager', 'UnityModManager.dll'))) {
            return;
        }

        // show dialogue
        return new Promise((resolve, reject) => {
            context.api.store.dispatch(
                actions.showDialog(
                    'question',
                    'Action required',
                    {message: 'You must install UnityModManager to use mods with ' + Name},
                    [
                        {label: 'Cancel', action: () => reject(new util.UserCanceled())},
                        {
                            label: 'Go to UnityModManager page', action: () => {
                                opn('https://www.nexusmods.com/site/mods/21/').catch(err => undefined);
                                reject(new util.UserCanceled());
                            }
                        }
                    ]
                )
            );
        });
    }

    return true;
}

module.exports = {
    default: main
};
