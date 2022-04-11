const path = require('path');
const { fs, selectors, util } = require('vortex-api');
const { default: IniParser, WinapiFormat } = require('vortex-parse-ini');

const { MORROWIND_ID } = require('./constants');

const deserializeDebouncer = new util.Debouncer(() => {
  return Promise.resolve();
}, 1000);

async function validate(before, after) {
  return Promise.resolve();
}

async function deserializeLoadOrder(api) {
  const state = api.getState();
  const discovery = selectors.discoveryByGame(state, MORROWIND_ID);
  if (discovery?.path === undefined) {
    return Promise.resolve([]);
  }
  const mods = util.getSafe(state, ['persistent', 'mods', MORROWIND_ID], {});
  const fileMap = Object.keys(mods).reduce((accum, iter) => {
    const plugins = mods[iter]?.attributes?.plugins;
    if (mods[iter]?.attributes?.plugins !== undefined) {
      for (const plugin of plugins) {
        accum[plugin] = iter;
      }
    }
    return accum;
  }, {});

  const iniFilePath = path.join(discovery.path, 'Morrowind.ini');
  const gameFiles = await refreshPlugins(api);
  const enabled = await readGameFiles(iniFilePath);
  return gameFiles.sort((lhs, rhs) => lhs.mtime - rhs.mtime)
    .map((file) => ({
      id: file.name,
      enabled: enabled.includes(file.name),
      name: util.renderModName(fileMap[file.name]),
      modId: fileMap[file.name],
    }));
}

async function refreshPlugins(api) {
  const state = api.getState()
  const discovery = selectors.discoveryByGame(state, MORROWIND_ID);
  if (discovery?.path === undefined) {
    return Promise.resolve([]);
  }

  const dataDirectory = path.join(discovery.path, 'Data Files');
  const fileEntries = await fs.readdirAsync(dataDirectory);
  const pluginEntries = [];
  for (const fileName of fileEntries) {
    if (!['.esp', '.esm'].includes(path.extname(fileName.toLocaleLowerCase()))) {
      continue;
    }
    const stats = await fs.statAsync(path.join(dataDirectory, fileName));
    pluginEntries.push({ name: fileName, mtime: stats.mtime });
  }

  return Promise.resolve(pluginEntries);
}

async function readGameFiles(iniFilePath) {
  const parser = new IniParser(new WinapiFormat());
  return parser.read(iniFilePath)
    .then(ini => {
      const files = ini.data['Game Files'];
      return Object.keys(files).map(key => files[key]);
    });
}

async function updatePluginOrder(iniFilePath, plugins) {
  const parser = new IniParser(new WinapiFormat());
  return parser.read(iniFilePath)
    .then(ini => {
      ini.data['Game Files'] = plugins.reduce((prev, plugin, idx) => {
        prev[`GameFile${idx}`] = plugin;
        return prev;
      }, {});
      return parser.write(iniFilePath, ini);
    });
}

async function updatePluginTimestamps(dataPath, plugins) {
  const offset = 946684800;
  const oneDay = 24 * 60 * 60;
  return Promise.mapSeries(plugins, (fileName, idx) => {
    const mtime = offset + oneDay * idx;
    return fs.utimesAsync(path.join(dataPath, fileName), mtime, mtime)
      .catch(err => err.code === 'ENOENT'
        ? Promise.resolve()
        : Promise.reject(err));
  }).then(() => undefined);
}

async function serializeLoadOrder(api, order) {
  const state = api.getState();
  const discovery = selectors.discoveryByGame(state, MORROWIND_ID);
  if (discovery?.path === undefined) {
    return Promise.reject(new util.ProcessCanceled('Game is not discovered'));
  }

  const iniFilePath = path.join(discovery.path, 'Morrowind.ini');
  const dataDirectory = path.join(discovery.path, 'Data Files');
  const enabled = order.filter(loEntry => loEntry.enabled === true).map(loEntry => loEntry.id);
  await updatePluginOrder(iniFilePath, enabled);
  await updatePluginTimestamps(dataDirectory, enabled);
  return Promise.resolve();
}

module.exports = {
  deserializeLoadOrder,
  serializeLoadOrder,
  readGameFiles,
  validate,
};