// @ts-check
const Promise = require('bluebird');
const winapi = require('winapi-bindings');

/**
 * @returns {string | Promise<String>}
 */
function findGame() {
  try {
    const instPath = winapi.RegGetValue(
      'HKEY_CURRENT_USER',
      'Software\\Fractal Softworks\\Starsector',
      '');
    if (!instPath) {
      throw new Error('Starsector registry key not found!');
    }
    return Promise.resolve(instPath.value);
  } catch (err) {
    return Promise.reject(err);
  }
}

/**
 * @param {import('vortex-api/lib/types/api').IExtensionContext} context
 */
function main(context) {
  context.registerGame({
    id: 'starsector',
    name: 'Starsector',
    mergeMods: true,
    queryPath: findGame,
    queryModPath: () => 'mods',
    logo: 'gameart.png',
    executable: () => 'starsector.exe',
    requiredFiles: [
      'starsector.exe',
    ]
  });

  return true;
}

module.exports = {
  default: main
};
