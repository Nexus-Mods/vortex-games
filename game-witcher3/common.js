const crypto = require('crypto');
const { app, remote } = require('electron');
const path = require('path');
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

class ResourceInaccessibleError extends Error {
  constructor(filePath, allowReport = false) {
    super(`"${filePath}" is being manipulated by another process`);
    this.filePath = filePath;
    this.isReportingAllowed = allowReport;
  }

  get isOneDrive() {
    const segments = this.filePath.split(path.sep)
      .filter(seg => !!seg)
      .map(seg => seg.toLowerCase());
    return segments.includes('onedrive');
  }

  get allowReport() {
    return this.isReportingAllowed;
  }

  get errorMessage() {
    return (this.isOneDrive)
      ? this.message + ': ' + 'probably by the OneDrive service.'
      : this.message + ': ' + 'close all applications that may be using this file.';
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

function getHash(filePath, tries = 3) {
  return calcHashImpl(filePath)
    .catch(err => {
      if (['EMFILE', 'EBADF'].includes(err['code']) && (tries > 0)) {
        return getHash(filePath, tries - 1);
      } else {
        return Promise.reject(err);
      }
    });
}

const UNIAPP = app || remote.app;
function getLoadOrderFilePath() {
  return path.join(UNIAPP.getPath('documents'), 'The Witcher 3', LOAD_ORDER_FILENAME);
}

function getPriorityTypeBranch() {
  return ['settings', 'witcher3', 'prioritytype'];
}

const GAME_ID = 'witcher3';

// File used by some mods to define hotkey/input mapping
const INPUT_XML_FILENAME = 'input.xml';

// The W3MM menu mod pattern seems to enforce a modding pattern
//  where {filename}.part.txt holds a diff of what needs to be
//  added to the original file - we're going to use this pattern as well. 
const PART_SUFFIX = '.part.txt';

const SCRIPT_MERGER_ID = 'W3ScriptMerger';
const MERGE_INV_MANIFEST = 'MergeInventory.xml';
const LOAD_ORDER_FILENAME = 'mods.settings';
const I18N_NAMESPACE = 'game-witcher3';
const CONFIG_MATRIX_REL_PATH = path.join('bin', 'config', 'r4game', 'user_config_matrix', 'pc');

module.exports = {
  CONFIG_MATRIX_REL_PATH,
  GAME_ID,
  LOAD_ORDER_FILENAME,
  MERGE_INV_MANIFEST,
  SCRIPT_MERGER_ID,
  INPUT_XML_FILENAME,
  PART_SUFFIX,
  I18N_NAMESPACE,
  UNIAPP,
  getHash,
  getLoadOrderFilePath,
  getPriorityTypeBranch,
  MD5ComparisonError,
  ResourceInaccessibleError,
}