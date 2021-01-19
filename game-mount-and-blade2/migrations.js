const Promise = require('bluebird');
const path = require('path');
const semver = require('semver');
const { parseXmlString } = require('libxmljs');
const walk = require('turbowalk').default;

const { actions, fs, selectors, util } = require('vortex-api');

const { GAME_ID, SUBMOD_FILE } = require('./common');

function migrate026(api, oldVersion) {
  if (semver.gte(oldVersion, '0.2.6')) {
    return Promise.resolve();
  }

  const state = api.getState();
  const mods = util.getSafe(state, ['persistent', 'mods', GAME_ID], {});
  return Promise.each(Object.keys(mods), iter => addSubModsAttrib(api, mods[iter]));
}

function addSubModsAttrib(api, mod) {
  if (mod === undefined) {
    // Weird, but we don't care.
    return Promise.resolve();
  }
  const state = api.getState();
  const stagingFolder = selectors.installPathForGame(state, GAME_ID);
  const modPath = path.join(stagingFolder, mod.installationPath);
  let allEntries = [];
  return walk(modPath, entries => {
    allEntries = allEntries.concat(entries.filter(entry => path.basename(entry.filePath).toLowerCase() === SUBMOD_FILE));
  }, { skipInaccessible: true, recurse: true, skipLinks: true })
  .catch(err => Promise.resolve()) // We don't care for errors.
  .then(() => {
    return (allEntries.length > 1)
      ? Promise.reduce(allEntries, async (accum, entry) => {
        try {
          const data = await getXMLData(entry.filePath);
          const subModId = data.get('//Id').attr('value').value();
          accum.push(subModId);
        } catch (err) {
          // nop - we don't care for errors - this is supposed to be
          //  a noninvasive "migration".
        }
        return Promise.resolve(accum);
      }, [])
        .then(subModIds => {
          api.store.dispatch(actions.setModAttribute(GAME_ID, mod.id, 'subModIds', subModIds))
          return Promise.resolve();
        })
      : Promise.resolve();
    });
}

async function getXMLData(xmlFilePath) {
  return fs.readFileAsync(xmlFilePath)
    .then(data => {
      try {
        const xmlData = parseXmlString(data);
        return Promise.resolve(xmlData);
      } catch (err) {
        return Promise.reject(err);
      }
    })
}

module.exports = {
  migrate026,
}