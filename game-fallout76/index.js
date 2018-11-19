const Promise = require('bluebird');
const { util } = require('vortex-api');
const winapi = require('winapi-bindings');

function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_LOCAL_MACHINE',
      'Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Fallout 76',
      'Path');
    if (!instPath) {
      throw new Error('empty registry key');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return Promise.reject(err);
  }
}

let tools = [
];

function main(context) {
  context.registerGame({
    id: 'fallout76',
    name: 'Fallout 76',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: tools,
    queryModPath: () => 'Data',
    logo: 'gameart.png',
    executable: () => 'Fallout76.exe',
    requiredFiles: [
      'Fallout76.exe',
    ],
  });
  return true;
}

module.exports = {
  default: main
};
