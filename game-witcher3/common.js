const crypto = require('crypto');
const { fs } = require('vortex-api');

class MD5ComparisonError extends Error {
  constructor(message, file) {
    super(message);
    this.path = file;
  }

  get affectedFile() {
    return this.path;
  }

  get errorMessage() {
    return this.message + ': ' + this.path;
  }
}

function calcHashImpl(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('readable', () => {
      const data = stream.read();
      if (data) {
        hash.update(data);
      }
    });
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function calcHash(filePath, tries = 3) {
  return calcHashImpl(filePath)
    .catch(err => {
      if (['EMFILE', 'EBADF'].includes(err['code']) && (tries > 0)) {
        return calcHash(filePath, tries - 1);
      } else {
        return Promise.reject(err);
      }
    });
}

exports.MD5ComparisonError = MD5ComparisonError;

exports.getHash = calcHash;

exports.GAME_ID = 'witcher3';

// File used by some mods to define hotkey/input mapping
exports.INPUT_XML_FILENAME = 'input.xml';

// The W3MM menu mod pattern seems to enforce a modding pattern
//  where {filename}.part.txt holds a diff of what needs to be
//  added to the original file - we're going to use this pattern as well. 
exports.PART_SUFFIX = '.part.txt';