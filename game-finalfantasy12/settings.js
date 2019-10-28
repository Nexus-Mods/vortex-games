const path = require('path');

const NEXUS_ID = 'finalfantasy12';
const STEAMID = 595520;
const DEPLOY_DIR = 'deploy';
const BACKUP_DIR = 'backup';
const MODS_DIR = 'mods';
const DATA_DIR = 'ff12data';
const DATA_DIR_SEP = DATA_DIR + path.sep;
/*const MODDING_DIRS = [
    'gamedata',
    'jsondata',
    'prefetchdata',
    'ps2data',
];*/

module.exports = {
  NEXUS_ID,
  STEAMID,
  DEPLOY_DIR,
  BACKUP_DIR,
  MODS_DIR,
  DATA_DIR,
  DATA_DIR_SEP,
};
