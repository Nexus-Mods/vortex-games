const Promise = require('bluebird');
const path = require('path');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

/* 
Ignore the Meshes\AnimTextData\AnimationOffsets\PersistantSubgraphInfoAndOffsetData.txt file as a conflict. 
It's present in a lot of weapon mods but doesn't matter if it's overwritten. 
This issue is compounded by users extracting all their BA2s. 
*/
const IGNORED_FILES = [ path.join('**', 'PersistantSubgraphInfoAndOffsetData.txt') ];

const MS_ID = 'BethesdaSoftworks.Fallout4-PC';
const GOG_ID = '1998527297';

let tools = [
  {
    id: 'FO4Edit',
    name: 'FO4Edit',
    logo: 'fo3edit.png',
    executable: () => 'FO4Edit.exe',
    requiredFiles: [
      'FO4Edit.exe',
    ],
  },
  {
    id: 'WryeBash',
    name: 'Wrye Bash',
    logo: 'wrye.png',
    executable: () => 'Wrye Bash.exe',
    requiredFiles: [
      'Wrye Bash.exe',
    ],
  },
  {
    id: 'f4se',
    name: 'Fallout 4 Script Extender',
    shortName: 'F4SE',
    executable: () => 'f4se_loader.exe',
    requiredFiles: [
      'f4se_loader.exe',
      'Fallout4.exe',
    ],
    relative: true,
    exclusive: true,
    defaultPrimary: true
  },
  {
    id: 'bodyslide',
    name: 'BodySlide',
    executable: () => path.join('Data', 'Tools', 'BodySlide', 'BodySlide x64.exe'),
    requiredFiles: [
      path.join('Data', 'Tools', 'BodySlide', 'BodySlide x64.exe'),
    ],
    relative: true,
    logo: 'auto',
  }
];

function requiresLauncher(gamePath) {
  return util.GameStoreHelper.findByAppId([MS_ID], 'xbox')
    .then(() => Promise.resolve({
      launcher: 'xbox',
      addInfo: {
        appId: MS_ID,
        parameters: [
          { appExecName: 'Game' },
        ],
      }
    }))
    .catch(err => Promise.resolve(undefined));
}

function main(context) {
  context.registerGame({
    id: 'fallout4',
    name: 'Fallout 4',
    mergeMods: true,
    queryArgs: {
      steam: [{ name: 'Fallout 4' }],
      xbox: [{ id: MS_ID }],      
      gog: [{ id: GOG_ID, prefer: 0 }],
      registry: [{ id: 'HKEY_LOCAL_MACHINE:Software\\Wow6432Node\\Bethesda Softworks\\Fallout4:Installed Path' }],
    },
    supportedTools: tools,
    queryModPath: () => 'Data',
    logo: 'gameart.jpg',
    executable: () => 'Fallout4.exe',
    requiredFiles: [
      'Fallout4.exe',
    ],
    requiresLauncher,
    environment: {
      SteamAPPId: '377160',     
    },
    details: {
      steamAppId: 377160,
      gogAppId: GOG_ID,
      ignoreConflicts: IGNORED_FILES,
      hashFiles: [
        'appxmanifest.xml',
        'Data/Fallout4.esm',
      ]
    }
  });

  return true;
}

module.exports = {
  default: main,
};
