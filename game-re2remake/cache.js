const Promise = require('bluebird');
const path = require('path');
const { fs } = require('vortex-api');

const CACHE_FILE = 'invalcache.json';
const INVAL_FILE = 'invalcache.file';

const CACHE_TEMPLATE = {
  _native: [],
  _920560: [],
  _920561: [],
  _920562: [],
  _920563: [],
  _920564: [],
  _920565: [],
  _920566: [],
  _920567: [],
  _920568: [],
  _920569: [],
  _920570: []
};

function createInvalCache(cacheFilePath) {
  return fs.writeFileAsync(cacheFilePath, JSON.stringify(CACHE_TEMPLATE), { encoding: 'utf8' });
}

function writeInvalCache(cacheFilePath, invalCache) {
  return fs.writeFileAsync(cacheFilePath, JSON.stringify(invalCache), { encoding: 'utf8' });
}

function byteArrayTo32Int(byteArray) {
  if (byteArray.length > 4) {
    return -1;
  }

  let value = 0;
  for (let i = byteArray.length - 1; i >= 0; i--) {
    value = (value * 256) + byteArray[i];
  }

  return value;
};

function readInvalCache(cacheFilePath) {
  return fs.readFileAsync(cacheFilePath, { encoding: 'utf8' })
    .catch(err => (err.code === 'ENOENT')
      ? createInvalCache(cacheFilePath).then(() => JSON.stringify(CACHE_TEMPLATE))
      : Promise.reject(err))
    .then(data => {
      try {
        const invalCache = JSON.parse(data);
        return Promise.resolve(invalCache);
      } catch (err) {
        return Promise.reject(err);
      }
    })
}

function insertOffsets(cacheDir, entries, arcKey) {
  const cacheFilePath = path.join(cacheDir, CACHE_FILE);
  let newCache = {};
  return readInvalCache(cacheFilePath).then(invalCache => {
    newCache = { ...invalCache };
    const hashEntries = Object.keys(newCache[arcKey]).map(key => newCache[arcKey][key]);
    entries.forEach(entry => {
      if (hashEntries.find(hash => hash.hashVal === entry.hash) === undefined) {
        const { hash, offset, lowercase, uppercase } = entry;
        const newEntry = {
          hashVal: hash,
          data: { offset, lowercase, uppercase } };
        newCache[arcKey].push(newEntry);
      }
    })
  }).then(() => writeInvalCache(cacheFilePath, newCache));
}

function removeOffsets(cacheDir, hashes, arcKey) {
  const cacheFilePath = path.join(cacheDir, CACHE_FILE);
  let newCache = {};
  return readInvalCache(cacheFilePath).then(invalCache => {
    newCache = { ...invalCache };
    newCache[arcKey] = Object.keys(invalCache[arcKey])
      .reduce((prev, key) => {
        const entry = newCache[arcKey][key];
        if (hashes.find(hash => hash === entry.hashVal) === undefined) {
          prev.push({ hashVal: entry.hashVal, data: entry.data });
        }

        return prev;
      }, []);

      return writeInvalCache(cacheFilePath, newCache);
  })
}

function findArcKeys(cacheDir, hashes) {
  const cacheFilePath = path.join(cacheDir, CACHE_FILE);
  return readInvalCache(cacheFilePath).then(invalCache => {
    const keys = Object.keys(invalCache);
    const arcKeys = hashes.reduce((prev, hash) => {
      keys.forEach(key => {
        const entries = Object.keys(invalCache[key]).map(id => invalCache[key][id]);
        if (entries.find(entry => entry.hashVal === hash) !== undefined) {
          prev[key].push(hash);
        }
      })

      return prev;
    }, CACHE_TEMPLATE);

    return Promise.resolve(arcKeys);
  });
}

function readNewInvalEntries(invalFilePath) {
  let iter = 0;
  const entries = [];
  return fs.readFileAsync(invalFilePath)
    .then(data => {
      let totalFiles = byteArrayTo32Int(data.slice(data.byteLength - 4));
      for (let i = 0; i < totalFiles; i++) {
        const offset = data.slice(iter, iter + 8);
        const lowercase = data.slice(iter + 8, iter + 12);
        const hash = byteArrayTo32Int(lowercase);
        const uppercase = data.slice(iter + 12, iter + 16);
        iter += 16;
        entries.push({ hash, offset, lowercase, uppercase });
      }
      
      return Promise.resolve(entries)
    });
}

function hasHash(cacheDir, hash) {
  const cacheFilePath = path.join(cacheDir, CACHE_FILE);
  return readInvalCache(cacheFilePath).then(invalCache => {
    const keys = Object.keys(invalCache);
    keys.forEach(key => {
      const hashEntry = Object.keys(invalCache[key])
        .find(entry => invalCache[key][entry].hashVal === hash);
      if (hashEntry !== undefined) {
        return Promise.resolve(true);
      }
    });

    return Promise.resolve(false);
  });
}

function getInvalEntries(cacheDir, hashes, arcKey) {
  const cacheFilePath = path.join(cacheDir, CACHE_FILE);
  return readInvalCache(cacheFilePath).then(invalCache => {
    const entries = Object.keys(invalCache[arcKey]).reduce((prev, key) => {
      const entry = invalCache[arcKey][key];
      if (hashes.find(hash => entry.hashVal === hash) !== undefined) {
        const offsetBuf = Buffer.from(entry.data['offset'].data);
        const lowerCaseBuf = Buffer.from(entry.data['lowercase'].data);
        const upperCaseBuf = Buffer.from(entry.data['uppercase'].data);
        prev.push({
          offset: offsetBuf,
          lowercase: lowerCaseBuf,
          uppercase: upperCaseBuf
        });
      }
      return prev;
    }, []);

    return Promise.resolve(entries || []);
  })
}

function writeInvalEntries(writeDir, entries) {
  const invalFilePath = path.join(writeDir, INVAL_FILE);
  let invalFileBuffer = Buffer.alloc(0);
  const totalFilesBuffer = Buffer.alloc(4);
  totalFilesBuffer.writeInt32LE(entries.length, 0);
  let iter = 0;
  for (let i = 0; i < entries.length; i++) {
    iter += 16;
    invalFileBuffer = Buffer.concat([
      invalFileBuffer, 
      entries[i].offset,
      entries[i].lowercase,
      entries[i].uppercase], iter);
  }
  invalFileBuffer = Buffer.concat([
    invalFileBuffer,
    totalFilesBuffer
  ], iter + 4);

  return fs.writeFileAsync(invalFilePath, invalFileBuffer);
}

module.exports = {
  insertOffsets,
  removeOffsets,
  readNewInvalEntries,
  getInvalEntries,
  writeInvalEntries,
  findArcKeys,
  hasHash,
}
