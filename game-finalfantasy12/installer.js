const path = require('path');
const { fs, log, util } = require('vortex-api');
const { spawn } = require('child_process');
const { app, remote } = require('electron');
const uniApp = app || remote.app;
const { allow, getUserId } = require('permissions');
const sevenzip = require('node-7z');
const request = require("request")
const settings = require('./settings');

const BIN_PATH = path.join(__dirname, 'bin');
const FF12_VBF_EXT_PATH = path.join(BIN_PATH, 'ff12-vbf.exe');
const FF12_SIZE_EXT_PATH = path.join(BIN_PATH, 'ff12-size.exe');
const FF12_OFFSET_EXT_PATH = path.join(BIN_PATH, 'sizeOffsets.txt');
const FF12_TOOLS_JSON = path.join(BIN_PATH, 'manifest.json');

const BIN_USER_PATH = path.join(uniApp.getPath('userData'), settings.NEXUS_ID, 'bin');
const FF12_VBF_USER_PATH = path.join(BIN_USER_PATH, 'ff12-vbf.exe');
const FF12_SIZE_USER_PATH = path.join(BIN_USER_PATH, 'ff12-size.exe');
const FF12_OFFSET_USER_PATH = path.join(BIN_USER_PATH, 'sizeOffsets.txt');
const FF12_TOOLS_USER_JSON = path.join(BIN_USER_PATH, 'manifest.json');

let FF12_VBF_PATH = FF12_VBF_EXT_PATH;
let FF12_SIZE_PATH = FF12_SIZE_EXT_PATH;
let FF12_OFFSET_PATH = FF12_OFFSET_EXT_PATH;

const VBF_LOG_FILE_PATH = path.join(uniApp.getPath('userData'), settings.NEXUS_ID, 'logs', 'ff12-vbf.log');
const SIZE_LOG_FILE_PATH = path.join(uniApp.getPath('userData'), settings.NEXUS_ID, 'logs', 'ff12-size');
const PATCH_NOTIFICATION_ID = 'finalfantasy12-patch-error';
let CHECK_FOR_UPDATES = true;

const VBF_FILE = 'FFXII_TZA.vbf';
const SIZE_FILES = [
  'FileSizeTable_US.fst',
  'FileSizeTable_KR.fst',
  'FileSizeTable_JP.fst',
  'FileSizeTable_IT.fst',
  'FileSizeTable_IN.fst',
  'FileSizeTable_FR.fst',
  'FileSizeTable_ES.fst',
  'FileSizeTable_DE.fst',
  'FileSizeTable_CN.fst',
  'FileSizeTable_CH.fst',
];

function makeWritableAccess(filePath, api) {
  const userId = getUserId();
  //access seems to care only about access mode and completely ignores permissions  
  return fs.renameAsync(filePath, filePath)
    .catch(() =>
      fs.forcePerm(api.translate, () => {
        return allow(filePath, userId, 'rwx');
      }, filePath)
        .then((result) => (result === undefined ? Promise.reject() : Promise.resolve()))
        .catch(() => {
          api.sendNotification({
            type: 'error',
            id: '',
            icon: 'icon-dialog-error',
            message: "Couldn't make file {{file}} writable. External tools will not work.",
            replace: { file: filePath },
          });
          return Promise.reject();
        })
    );
}

function spawnProcess(exePath, args, logPath, api) {
  let wstream = fs.createWriteStream(logPath);

  return new Promise((resolve, reject) => {
    const process = spawn(
      '"' + exePath + '"',
      args,
      { shell: true, }
    );

    const stdOutLines = [];
    const stdErrLines = [];

    process.on('error', (err) => {
      wstream.close();
      return reject(err);
    });

    process.on('close', (code) => {
      wstream.close();

      if (code !== 0) {
        if (code == 0xc0000135) {
          api.sendNotification({
            type: 'error',
            id: PATCH_NOTIFICATION_ID,
            icon: 'icon-dialog-error',
            message: 'Installation via external tools has failed. VCRuntime or other DLLs missing.',
            replace: { userdata: uniApp.getPath('userData') },
            actions: [
              {
                title: 'See details', action: (dismiss) =>
                  api.showDialog(
                    'error',
                    'Final Fantasy XII: The Zodiac Age', {
                    bbcode: "The patching tool couldn't be executed, because one or more dynamic libraries are missing.<br/>"
                      + "The most probable cause is MS Visual C++ Runtime. You can download it from Microsoft here:<br/><br/>"
                      + "[url]https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads[/url]<br/><br/>"
                      + "Download and install the newest (at the top of the page) [b]\"vc_redist.x64.exe\"[/b].<br/><br/>"
                      + "Alternatively, just use this direct download link:<br/><br/>"
                      + "[url]https://aka.ms/vs/16/release/vc_redist.x64.exe[/url]<br/><br/>"
                      + "Once everything is installed, try again.",
                  },
                    [{ label: 'Close', action: () => dismiss() }]),
              },
            ],
          });
        } else {
          api.sendNotification({
            type: 'error',
            id: PATCH_NOTIFICATION_ID,
            icon: 'icon-dialog-error',
            message: 'Installation via external tools has failed. Please see logs in "{{userdata}}" for further details.',
            replace: { userdata: uniApp.getPath('userData') },
            actions: [
              {
                title: 'Error log', action: (dismiss) =>
                  api.showDialog(
                    'error',
                    'Final Fantasy XII: The Zodiac Age', {
                    text: stdOutLines.join('\n') + '\n' + stdErrLines.join('\n'),
                  },
                    [{ label: 'Close', action: () => dismiss() }]),
              },
            ],
          });
        }
        return reject();
      }

      return resolve();
    });

    process.stdout.on('data', data => {
      const formatted = data.toString('utf16le').split('\n');
      formatted.forEach(line => {
        const formattedLine = line.replace(/\\/g, '/');
        stdOutLines.push(formattedLine);
        wstream.write(formattedLine + '\n');
      });
    });

    process.stderr.on('data', data => {
      const formatted = data.toString('utf16le').split('\n');
      formatted.forEach(line => {
        stdErrLines.push(line);
      });
    });
  });
}

function patchVBF(modDataDir, gameDir, api, listFile = undefined, modBackupDir = undefined) {
  log('info', 'VBF patcher: ' + modDataDir);
  return makeWritableAccess(path.join(gameDir, VBF_FILE), api)
    .then(() => {
      let args = [
        '-r',
        '"' + modDataDir + '"',
        '"' + path.join(gameDir, VBF_FILE) + '"',
      ];
      if (modBackupDir !== undefined)
        args.push('-b="' + modBackupDir + '"');
      if (listFile !== undefined)
        args.push('-s="' + listFile + '"');

      return spawnProcess(FF12_VBF_PATH, args, VBF_LOG_FILE_PATH, api);
    });
}

function patchSize(modDataDir, gameDir, api, language = 'us', listFile = undefined) {
  if (language === 'jp')
    language = 'in';
  else if (language === 'en')
    language = 'us';

  let args = [
    '"' + path.join(gameDir, 'FileSizeTables', 'FileSizeTable_' + language.toUpperCase() + '.fst') + '"',
    '"' + FF12_OFFSET_PATH + '"',
    '"' + modDataDir + '"',
  ];
  if (language !== 'us') {
    args.push('-l=' + language);
  }
  log('info', 'Size patcher: language=' + language);
  if (listFile !== undefined)
    args.push('-s="' + listFile + '"');

  return spawnProcess(FF12_SIZE_PATH, args, SIZE_LOG_FILE_PATH + '_' + language + '.log', api);
}

function patchAllSizes(modDataDir, gameDir, api, listFile = undefined) {
  log('info', 'Size patcher: ' + modDataDir);
  const languages = [
    'us',
    'es',
    'de',
    'it',
    'fr',
    'in',
    'kr',
    'ch',
    'cn',
  ];

  return Promise.all(SIZE_FILES.map(sizeFile =>
    makeWritableAccess(path.join(gameDir, 'FileSizeTables', sizeFile), api)
  ))
    .then(() => Promise.all(
      languages.map(language => patchSize(modDataDir, gameDir, api, language, listFile))
    ))
}
function downloadNotification(api, message) {
  api.sendNotification({
    type: 'info',
    message: message,
    displayMS: 5000,
  });
}

function downloadFile(fileUrl, filePath) {
  return new Promise((resolve, reject) => {
    request({
      url: fileUrl,
      encoding: null
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const seven = new sevenzip();
        let pathName = path.dirname(filePath);
        let zipName = path.join(pathName, path.basename(fileUrl));
        return fs.writeFileAsync(zipName, body)
          .then(() => seven.extract(zipName, pathName))
          .then(() => fs.unlinkAsync(zipName))
          .then(() => resolve())
          ;
      } else {
        if (error)
          return reject(new util.DataInvalid(error))
        if (response)
          return reject(new util.DataInvalid('Url: ' + fileUrl + ', status: ' + response.statusCode + ' - ' + response.statusMessage))
        return reject(new util.DataInvalid())
      }
    });
  });
}

function checkFile(path) {
  return new Promise((resolve, reject) => {
    try {
      fs.accessSync(path);
      return resolve();
    } catch (error) {
      return reject();
    }
  });
}

function checkToolsExist(api) {
  return Promise.all([
    checkFile(FF12_VBF_USER_PATH)
      .then(() => { FF12_VBF_PATH = FF12_VBF_USER_PATH; return Promise.resolve(); })
      .catch(() => {
        return checkFile(FF12_VBF_EXT_PATH)
          .then(() => { FF12_VBF_PATH = FF12_VBF_EXT_PATH; return Promise.resolve(); })
      }),
    checkFile(FF12_SIZE_USER_PATH)
      .then(() => { FF12_SIZE_PATH = FF12_SIZE_USER_PATH; return Promise.resolve(); })
      .catch(() => {
        return checkFile(FF12_SIZE_EXT_PATH)
          .then(() => { FF12_SIZE_PATH = FF12_SIZE_EXT_PATH; return Promise.resolve(); })
      }),
    checkFile(FF12_OFFSET_USER_PATH)
      .then(() => { FF12_OFFSET_PATH = FF12_OFFSET_USER_PATH; return Promise.resolve(); })
      .catch(() => {
        return checkFile(FF12_OFFSET_EXT_PATH)
          .then(() => { FF12_OFFSET_PATH = FF12_OFFSET_EXT_PATH; return Promise.resolve(); })
      }),
    checkFile(FF12_TOOLS_USER_JSON)
      .catch(() => checkFile(FF12_OFFSET_EXT_PATH)),
  ])
    .then(() => checkUpdates(api))
    .catch(() => displayToolsDownloadDialog(api))
    ;
}

function checkNewer(verOld, verNew) {
  if ((verOld.major < verNew.major)
    || (verOld.major == verNew.major && verOld.minor < verNew.minor)
    || (verOld.major == verNew.major && verOld.minor == verNew.minor && verOld.step < verNew.step)
  ) {
    return true;
  } else {
    return false;
  }
}

function checkUpdates(api) {
  return new Promise((resolve, reject) => {
    if (!CHECK_FOR_UPDATES)
      return resolve();

    let manifest;
    try {
      fs.accessSync(FF12_TOOLS_USER_JSON);
      manifest = FF12_TOOLS_USER_JSON;
    } catch (error) {
      try {
        fs.accessSync(FF12_TOOLS_JSON);
        manifest = FF12_TOOLS_JSON;
      } catch {
        downloadNotification(api, "Couldn't find manifest file. Auto updates disabled.");
        CHECK_FOR_UPDATES = false;
        return resolve(); //update is optional anyway, let's not make a fuss out of it
      }
    }

    return fs.readFileAsync(manifest, { encoding: 'utf8' })
      .then(data => {
        let manifestData = JSON.parse(data);
        request({
          url: 'https://vortex.ff12.pl',
          json: true
        }, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            let ff12size = checkNewer(manifestData.ff12size.ver, body.ff12size.ver);
            let ff12offsets = checkNewer(manifestData.sizeOffsets.ver, body.sizeOffsets.ver);
            let ff12vbf = checkNewer(manifestData.ff12vbf.ver, body.ff12vbf.ver);
            let newVersions = [];

            if (ff12vbf)
              newVersions.push(body.ff12vbf);
            if (ff12size)
              newVersions.push(body.ff12size);
            if (ff12offsets)
              newVersions.push(body.sizeOffsets);

            if (newVersions.length > 0) {
              let updateString = 'Updates for the following tools are available:\n\n';

              newVersions.forEach(version => {
                updateString += `${version.name} (v${version.ver.major}.${version.ver.minor}.${version.ver.step})\n`;
                version.changelog.forEach(change => updateString += `- ${change}\n`);
                updateString += '\n';
              });

              updateString += '\nDo you want to download these tools? Pressing "cancel" will disable further checks until you restart Vortex.';
              CHECK_FOR_UPDATES = false;
              api.showDialog(
                'info',
                'Final Fantasy XII: The Zodiac Age', {
                text: updateString,
              },
                [
                  {
                    label: 'Download', action: () => {
                      let promises = [];
                      if (ff12size)
                        promises.push(downloadFile(body.ff12size.url, FF12_SIZE_USER_PATH));
                      if (ff12offsets)
                        promises.push(downloadFile(body.sizeOffsets.url, FF12_OFFSET_USER_PATH));
                      if (ff12vbf)
                        promises.push(downloadFile(body.ff12vbf.url, FF12_VBF_USER_PATH));

                      return Promise.all(promises)
                        .then(() => fs.writeFileAsync(FF12_TOOLS_USER_JSON, JSON.stringify(body), { encoding: 'utf8' }))
                        .then(() => {
                          downloadNotification(api, 'All files downloaded successfully.');
                          if (ff12vbf) FF12_VBF_PATH = FF12_VBF_USER_PATH;
                          if (ff12size) FF12_SIZE_PATH = FF12_SIZE_USER_PATH;
                          if (ff12offsets) FF12_OFFSET_PATH = FF12_OFFSET_USER_PATH;
                          return resolve();
                        })
                        .catch((error) => { api.showErrorNotification('Failed to download modding tools.', error, { allowReport: false }); return resolve(); })
                        ;
                    }
                  },
                  { label: 'Cancel', action: () => resolve() },
                ]
              );
            } else {
              return resolve();
            }
          } else {
            if (error)
              api.showErrorNotification('Failed to download modding tools manifest.', error, { allowReport: false });
            if (response)
              api.showErrorNotification('Failed to download modding tools manifest.', 'Status: ' + response.statusCode + ' - ' + response.statusMessage, { allowReport: false });
            CHECK_FOR_UPDATES = false;
            return resolve();
          }
        });
      })
      .catch(() => resolve());
  });
}

function displayToolsDownloadDialog(api) {
  return new Promise((resolve, reject) => api.showDialog(
    'info',
    'Final Fantasy XII: The Zodiac Age', {
    text: 'Some of the tools required to mod the game are not present. Would you like to download them?',
  },
    [
      {
        label: 'Download', action: () => {
          request({
            url: 'https://vortex.ff12.pl',
            json: true
          }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              return Promise.all([
                fs.writeFileAsync(FF12_TOOLS_USER_JSON, JSON.stringify(body), { encoding: 'utf8' }),
                downloadFile(body.ff12size.url, FF12_SIZE_USER_PATH),
                downloadFile(body.ff12vbf.url, FF12_VBF_USER_PATH),
                downloadFile(body.sizeOffsets.url, FF12_OFFSET_USER_PATH),
              ])
                .then(() => {
                  downloadNotification(api, 'All files downloaded successfully.')
                  FF12_VBF_PATH = FF12_VBF_USER_PATH;
                  FF12_SIZE_PATH = FF12_SIZE_USER_PATH;
                  FF12_OFFSET_PATH = FF12_OFFSET_USER_PATH;
                  return resolve();
                })
                .catch((error) => { api.showErrorNotification('Failed to download modding tools.', error); return reject(error); })
                ;
            } else {
              if (error)
                api.showErrorNotification('Failed to download modding tools.', error);
              if (response)
                api.showErrorNotification('Failed to download modding tools.', 'Status: ' + response.statusCode + ' - ' + response.statusMessage);
              return reject(new util.DataInvalid());
            }
          });
        }
      },
      { label: 'Cancel', action: () => { api.showErrorNotification('Operation cancelled - modding impossible.', 'The tools have to be downloaded to enable modding.', { allowReport: false }); return reject(new util.UserCanceled()); } },
    ]
  ));
}

module.exports = {
  //functions
  patchVBF,
  patchSize,
  patchAllSizes,
  checkToolsExist,

  //variables
  SIZE_FILES,
  VBF_FILE,
};
