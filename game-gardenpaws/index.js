const Promise = require('bluebird');
const { app, remote } = require('electron');
const opn = require('opn');
const path = require('path');
const winapi = require('winapi-bindings');
const { fs, actions, util } = require('vortex-api');

const uniApp = app || remote.app;

// Expected UMM path when installed via Vortex
const UMM_VORTEX_PATH = path.join(uniApp.getPath('userData'), 'Tools', 'UnityModManager');
const UMM_DLL = 'UnityModManager.dll';

const NexusId = 'gardenpaws';
const Name = 'Garden Paws';
const ExeName = 'GardenPaws';
const SteamId = 840010;

function main(context) {
  context.requireExtension('modtype-umm');
  context.registerGame(
    {
      id: NexusId,
      name: Name,
      logo: 'gameart.png',
      mergeMods: true,
      queryPath: findGame,
      queryModPath: () => 'Mods',
      executable: () => ExeName + '.exe',
      requiredFiles: [ExeName + '.exe'],
      details:
      {
        steamAppId: SteamId,
      },
      setup: setup,
    });

  function findGame() {
    return util.steam.findByAppId(SteamId.toString()).then(game => game.gamePath);
  }

  function readRegistryKey(hive, key, name) {
    try {
      const instPath = winapi.RegGetValue(hive, key, name);
      if (!instPath) {
        throw new Error('empty registry key');
      }
      return Promise.resolve(instPath.value);
    } catch (err) {
      return Promise.reject(new util.ProcessCanceled(err));
    }
  }

  function findUnityModManager() {
    return readRegistryKey('HKEY_CURRENT_USER', 'Software\\UnityModManager', 'Path')
      .then(value => fs.statAsync(path.join(value, UMM_DLL))
        .catch(err => fs.statAsync(path.join(UMM_VORTEX_PATH, UMM_DLL))));
  }

  function setup(discovery) {
    return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'), () => Promise.resolve())
      .then(() => findUnityModManager()
        .catch(err => {
          return new Promise((resolve, reject) => {
            context.api.store.dispatch(
              actions.showDialog(
                'question',
                'Action required',
                { message: 'You must install Unity Mod Manager to use mods with ' + Name + '.' },
                [
                  { label: 'Cancel', action: () => reject(new util.UserCanceled()) },
                  {
                    label: 'Go to the Unity Mod Manager page', action: () => {
                      opn('https://www.nexusmods.com/site/mods/21/').catch(err => undefined);
                      reject(new util.UserCanceled());
                    }
                  }
                ]
              )
            );
          });
        }))
  }

  return true;
}

module.exports = {
    default: main
};
