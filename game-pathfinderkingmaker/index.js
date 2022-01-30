const Promise = require('bluebird');
const path = require('path');
const winapi = require('winapi-bindings');
const {actions, fs, util} = require('vortex-api');

const IsWin = process.platform === 'win32';

const NexusId = 'pathfinderkingmaker';
const Name = 'Pathfinder:\tKingmaker';
const ExeName = 'Kingmaker.exe';
const SteamId = '640820';
const GogId = '1982293831';

const ummDll = 'UnityModManager.dll';
const ummModInfo = 'Info.json';

function main(context) {
  context.requireExtension('modtype-umm');
  context.registerGame(
    {
      id: NexusId,
      name: Name,
      logo: 'gameart.jpg',
      mergeMods: true,
      queryPath: findGame,
      queryModPath: () => 'Mods',
      executable: () => ExeName,
      requiredFiles: [ExeName],
      environment: {
        SteamAPPId: SteamId,
      }, 
      details:
      {
        steamAppId: SteamId,
      },
      setup: setup,
    });
  context.registerInstaller(NexusId + '-mod', 25, testMod, installMod);

  function findGame() {
    return util.steam.findByAppId(SteamId)
      .then(game => game.gamePath)
      .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
        `SOFTWARE\\WOW6432Node\\GOG.com\\Games\\${GogId}`,
        'PATH'))
      .catch(() => readRegistryKey('HKEY_LOCAL_MACHINE',
        `SOFTWARE\\GOG.com\\Games\\${GogId}`,
        'PATH'))
  }

  function readRegistryKey(hive, key, name) {
    if (!IsWin) {
      return Promise.reject(new util.UnsupportedOperatingSystem());
    }

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
      .then(value => fs.statAsync(path.join(value, ummDll)));
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
                      util.opn('https://www.nexusmods.com/site/mods/21/').catch(err => undefined);
                      reject(new util.UserCanceled());
                    }
                  }
                ]
              )
            );
          });
        }))
  }

  function installMod(files, destinationPath) {
    const infoFile = files.find(file => file.endsWith(ummModInfo));
    const idx = infoFile.indexOf(ummModInfo);
    const rootPath = path.dirname(infoFile);
    const modName = path.basename(destinationPath, '.installing')
      .replace(/[^A-Za-z]/g, '');
  
    const filtered = files.filter(file => (!file.endsWith(path.sep))
      && (file.indexOf(rootPath) !== -1));
  
    const instructions = filtered.map(file => {
      return {
        type: 'copy',
        source: file,
        destination: path.join(modName, file.substr(idx)),
      };
    });
  
    return Promise.resolve({ instructions });
  }
  
  function isUMMMod(files) {
    return files.find(file => file.endsWith(ummModInfo)) !== undefined;
  }
  
  function testMod(files, gameId) {
    return Promise.resolve({
      supported: ((gameId === NexusId) && (isUMMMod(files))),
      requiredFiles: []
    });
  }

  return true;
}

module.exports = {
    default: main
};
