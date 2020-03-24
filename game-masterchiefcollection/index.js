//const { app, remote } = require('electron');
const path = require('path');
const Promise = require('bluebird');
const { parseXmlString } = require('libxmljs');
const { actions, fs, FlexLayout, OptionsFilter, log, selectors, util } = require('vortex-api');

const React = require('react');

// These are all used when attempting to find a user's xbox id.
//  currently unused.
// const appUni = app || remote.app;
// const MCC_LOCAL_LOW = path.resolve(appUni.getPath('appData'), '..', 'LocalLow', 'MCC');
// const REPORT_PATH = path.join(MCC_LOCAL_LOW, 'Temporary');
// const REPORT_PATTERN = /campaigncarnagereport.*.xml/;

// Game Ids for different game stores and the nexus game Id.
const MS_APPID = 'Microsoft.Chelan';
const STEAM_ID = '976730';
const GAME_ID = 'halothemasterchiefcollection';

// At the time of writing this extension, only Halo: Combat Evolved and Halo Reach were available.
//  We may have to come back to this object as more of the games get released.
const HALO_GAMES = {
  halo1: { internalId: '1', name: 'Halo: CE', modsPath: 'halo1', img: path.join(__dirname, 'halo1.png') },
  halo2: { internalId: '2', name: 'Halo 2', modsPath: 'halo2', img: path.join(__dirname, 'halo2.png') },
  halo3: { internalId: '3', name: 'Halo 3', modsPath: 'halo3', img: path.join(__dirname, 'halo3.png') },
  odst: { internalId: '4', name: 'ODST', modsPath: 'odst', img: path.join(__dirname, 'odst.png') },
  halo4: { internalId: '5', name: 'Halo 4', modsPath: 'halo4', img: path.join(__dirname, 'halo4.png') },
  haloreach: { internalId: '6', name: 'Reach', modsPath: 'haloreach', img: path.join(__dirname, 'haloreach.png') },
};

let _GAME_STORE_ID;

// Master chef collection
class MasterChiefCollectionGame {
  constructor(context) {
    this.context = context;
    this.id = GAME_ID;
    this.name = 'Halo: The Master Chief Collection';
    this.shortName = 'Halo: MCC';
    this.logo = 'gameart.jpg';
    this.requiredFiles = [
      this.executable(),
    ];
    this.supportedTools = [
      {
        id: 'haloassemblytool',
        name: 'Halo Assembly Tool',
        logo: path.join(__dirname, 'assemblytool.png'),
        executable: () => 'Assembly.exe',
        requiredFiles: [
          'Assembly.exe',
        ],
        relative: true,
      },
    ];
    this.details = {
      steamAppId: STEAM_ID.toString(),
    };
    this.mergeMods = true;
  }

  queryModPath(gamePath) {
    if (_GAME_STORE_ID !== 'xbox') {
      return '.'
    }
  
    const segments = gamePath.split(path.sep).filter(seg => !!seg);
    const idx = segments.indexOf('WindowsApps');
    const progFiles = segments.splice(0, idx).join(path.sep);
    return path.join(progFiles, 'ModifiableWindowsApps', 'HaloMCC');
  }

  executable() {
    return 'mcclauncher.exe';
  }

  prepareXboxId() {
    // if (_GAME_STORE_ID === undefined) {
    //   return this.queryPath();
    // }
    // const runGameNotif = () => {
    //   this.context.api.showErrorNotification('Unable to resolve Xbox user ID',
    //     'Please run the game at least once before modding it.',
    //   { allowReport: false });
    // };
    // return fs.readdirAsync(REPORT_PATH).then(entries => {
    //   const reports = entries.filter(entry => entry.match(REPORT_PATTERN));
    //   return Promise.each(reports, report => (!!this.fullModsPath)
    //     ? Promise.resolve()
    //     : getXboxId(this.internalId, path.join(REPORT_PATH, report), 'utf-8')
    //         .catch(util.DataInvalid, err => Promise.resolve())
    //         .then(xboxId => {
    //           this.fullModsPath = path.join(MCC_LOCAL_LOW, 'LocalFiles', xboxId, this.modsFolder);
    //           return fs.ensureDirWritableAsync(this.fullModsPath, () => Promise.resolve());
    //     }))
    //     .catch(err => {
    //       runGameNotif();
    //       return Promise.reject(new Error('Unable to resolve mods path'));
    //     })
    // })
  }

  async setup(discovery) {
    const xboxWarning = () => {
      this.context.api.showDialog('warn', 'Xbox Store Permissions', {
        bbcode: 'Halo: MCC appears to be installed through the Xbox game store and your account ' 
              + 'does not have permissions to write new files. This needs to be resolved manually '
              + 'before mods can be deployed [url=https://wiki.nexusmods.com/index.php/Modding_Halo:_The_Master_Chief_Collection_with_Vortex]as seen here.[/url]',
      }, [
        { label: 'Close' },
      ]);

      return Promise.resolve();
    }

    const createXboxModsPath = () => {
      const segments = discovery.path.split(path.sep).filter(seg => !!seg);
      const idx = segments.indexOf('WindowsApps');
      const progFiles = segments.splice(0, idx).join(path.sep);
      return fs.ensureDirWritableAsync(path.join(progFiles, 'ModifiableWindowsApps', 'HaloMCC'), () => Promise.resolve())
        .catch(err => (err.code === 'EPERM')
          ? xboxWarning() : Promise.reject(err));
    }

    return (_GAME_STORE_ID === 'xbox') 
      ? createXboxModsPath()
      : Promise.resolve();
  }

  queryPath() {
    return util.GameStoreHelper.findByAppId([STEAM_ID, MS_APPID])
      .then(game => {
        _GAME_STORE_ID = game.gameStoreId;
        return game.gamePath
      });
  }

  requiresLauncher(gamePath) {
    if (_GAME_STORE_ID === 'xbox') {
      return Promise.resolve({
        launcher: 'xbox',
        addInfo: {
          appId: MS_APPID,
          parameters: [
            { appExecName: 'HaloMCCShippingNoEAC' },
          ],
        }
      });
    } else if (_GAME_STORE_ID === 'steam') {
      return Promise.resolve({
        launcher: 'steam',
        addInfo: {
          appId: STEAM_ID,
          parameters: ['option1'],
          launchType: 'gamestore',
        }
      });
    }

    return Promise.resolve(undefined);
  }
}

function getXboxId(internalId, filePath, encoding) {
  // This function will return the xbox id of the last player
  //  who ran the game. This can potentially be used to mod the game
  //  only for specific xbox ids while leaving others in an untampered state. (WIP)
  return fs.readFileAsync(filePath, { encoding })
    .then(fileData => {
      let xmlDoc;
      try {
        xmlDoc = parseXmlString(fileData);
      } catch (err) {
        return Promise.reject(err);
      }

      const generalData = xmlDoc.find('//CampaignCarnageReport/GeneralData');
      if (generalData[0].attr('GameId').value() === internalId) {
        const players = xmlDoc.find('//CampaignCarnageReport/Players/PlayerInfo');
        const mainPlayer = players.find(player => player.attr('isGuest').value() === 'false');
        const xboxId = mainPlayer.attr('mXboxUserId').value();
        // The userId is prefixed with "0x" which is not needed.
        return Promise.resolve(xboxId.substring(2));
      } else {
        return Promise.reject(new util.DataInvalid('Wrong internal gameId'));
      }
    });
}

function identifyHaloGames(files) {
  // Function aims to identify the relevant halo game entry using the
  //  mod files.
  const filtered = files.filter(file => path.extname(file) !== '');
  return Promise.reduce(Object.keys(HALO_GAMES), (accum, key) => {
    const entry = HALO_GAMES[key];
    filtered.forEach(element => {
      const segments = element.split(path.sep);
      if (segments.includes(entry.modsPath)) {
        accum.push(entry);
        return Promise.resolve(accum);
      }
    });

    return Promise.resolve(accum);
  }, []);
}

function testInstaller(files, gameId) {
  return (gameId !== GAME_ID)
   ? Promise.resolve({ supported: false, requiredFiles: [] })
   : identifyHaloGames(files).then(haloGames => Promise.resolve({
      supported: (haloGames.length > 0),
      requiredFiles: [],
    }));
}

function install(context, files, destinationPath) {
  return identifyHaloGames(files).then(haloGames => {
    const internalIds = haloGames.map(game => game.internalId);
    context.api.store.dispatch(actions.setModAttribute(GAME_ID, path.basename(destinationPath, '.installing'), 'haloGames', internalIds));
    
    return Promise.reduce(haloGames, (accum, haloGame) => {
      const filtered = files.filter(file => {
        const segments = file.split(path.sep).filter(seg => !!seg);
        return (path.extname(segments[segments.length - 1]) !== '')
          && (segments.indexOf(haloGame.modsPath) !== -1);
      })

      filtered.forEach(element => {
        const segments = element.split(path.sep).filter(seg => !!seg);
        const rootIdx = segments.indexOf(haloGame.modsPath);
        const destination = segments.splice(rootIdx).join(path.sep);
        accum.push({
          type: 'copy',
          source: element,
          destination
        });
      });
      return Promise.resolve(accum);
    }, []).then(instructions => Promise.resolve({ instructions }));
  });
}

module.exports = {
  default: context => {
    context.registerGame(new MasterChiefCollectionGame(context));

    // let collator;
    // const getCollator = (locale) => {
    //   if ((collator === undefined) || (locale !== lang)) {
    //     lang = locale;
    //     collator = new Intl.Collator(locale, { sensitivity: 'base' });
    //   }
    //   return collator;
    // };

    context.registerInstaller('masterchiefinstaller', 25, testInstaller, (files, destinationPath) => install(context, files, destinationPath));

    context.registerTableAttribute('mods', {
      id: 'gameType',
      name: 'Game(s)',
      description: 'Target Halo game(s) for this mod',
      icon: 'inspect',
      placement: 'table',
      customRenderer: (mod) => {
        const createImgDiv = (entry, idx) => {
          return React.createElement('div', { className: 'halo-img-div', key: `${entry.internalId}-${idx}` }, 
            React.createElement('img', { className: 'halogameimg', src: `file://${entry.img}` }),
            React.createElement('span', {}, entry.name))
        };

        const internalIds = util.getSafe(mod, ['attributes', 'haloGames'], []);
        const haloEntries = Object.keys(HALO_GAMES)
          .filter(key => internalIds.includes(HALO_GAMES[key].internalId))
          .map(key => HALO_GAMES[key]);

        return React.createElement(FlexLayout, { type: 'row' }, 
          React.createElement(FlexLayout.Flex, { className: 'haloimglayout' }, haloEntries.map((entry, idx) => createImgDiv(entry, idx))));
      },
      calc: (mod) => util.getSafe(mod, ['attributes', 'haloGames'], undefined),
      filter: new OptionsFilter(
        [].concat([{ value: OptionsFilter.EMPTY, label: '<None>' }],
        Object.keys(HALO_GAMES)
          .map(key => {
            return { value: HALO_GAMES[key].internalId, label: HALO_GAMES[key].name };
          }))
        , true, false),
      isToggleable: true,
      edit: {},
      isSortable: false,
      isGroupable: (mod) => {
        const internalIds = util.getSafe(mod, ['attributes', 'haloGames'], []);
        const haloEntries = Object.keys(HALO_GAMES)
          .filter(key => internalIds.includes(HALO_GAMES[key].internalId))
          .map(key => HALO_GAMES[key]);

        if (haloEntries.length > 1) {
          return 'Multiple';
        } else {
          return haloEntries[0].name;
        }
      },
      isDefaultVisible: true,
      //sortFunc: (lhs, rhs) => getCollator(locale).compare(lhs, rhs),
      condition: () => {
        const activeGameId = selectors.activeGameId(context.api.store.getState());
        return (activeGameId === GAME_ID);
      }
    });

    context.once(() => {
      context.api.setStylesheet('masterchiefstyle', path.join(__dirname, 'masterchief.scss'));
    });
  }
};
