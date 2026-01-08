var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// extensions/games/game-masterchiefcollection/index.ts
var import_path6 = __toESM(require("path"));
var import_vortex_api5 = require("vortex-api");
var React = __toESM(require("react"));

// extensions/games/game-masterchiefcollection/common.ts
var import_path = __toESM(require("path"));
var import_vortex_api = require("vortex-api");
var MCC_LOCAL_LOW = import_path.default.resolve(import_vortex_api.util.getVortexPath("appData"), "..", "LocalLow", "MCC");
var MOD_MANIFEST_FILE = "ModManifest.txt";
var MOD_MANIFEST_FILE_PATH = import_path.default.join(MCC_LOCAL_LOW, "Config", MOD_MANIFEST_FILE);
var MOD_INFO_JSON_FILE = "modinfo.json";
var HALO1_MAPS_RELPATH = import_path.default.join("halo1", "maps");
var MS_APPID = "Microsoft.Chelan";
var STEAM_ID = "976730";
var GAME_ID = "halothemasterchiefcollection";
var MOD_CONFIG_FILE = "modpack_config.cfg";
var MOD_CONFIG_DEST_ELEMENT = "$MCC_home\\";
var ASSEMBLY_EXT = ".asmp";
var MAP_EXT = ".map";
var MODTYPE_PLUG_AND_PLAY = "halo-mcc-plug-and-play-modtype";
var HALO_GAMES = {
  halo1: { internalId: "1", name: "Halo: CE", modsPath: "halo1", img: import_path.default.join(__dirname, "halo1.png") },
  halo2: { internalId: "2", name: "Halo 2", modsPath: "halo2", img: import_path.default.join(__dirname, "halo2.png") },
  halo3: { internalId: "3", name: "Halo 3", modsPath: "halo3", img: import_path.default.join(__dirname, "halo3.png") },
  // Someone should get Mike a cookie for his premonition skills
  odst: { internalId: "4", name: "ODST", modsPath: "halo3odst", img: import_path.default.join(__dirname, "odst.png") },
  halo4: { internalId: "5", name: "Halo 4", modsPath: "halo4", img: import_path.default.join(__dirname, "halo4.png") },
  haloreach: { internalId: "6", name: "Reach", modsPath: "haloreach", img: import_path.default.join(__dirname, "haloreach.png") }
};

// extensions/games/game-masterchiefcollection/modTypes.ts
var import_path2 = __toESM(require("path"));
async function testPlugAndPlayModType(instr) {
  const modInfo = instr.find((instr2) => instr2.type === "copy" && import_path2.default.basename(instr2.source).toLowerCase() === MOD_INFO_JSON_FILE);
  return modInfo !== void 0;
}

// extensions/games/game-masterchiefcollection/installers.ts
var import_path4 = __toESM(require("path"));
var rjson = __toESM(require("relaxed-json"));
var import_vortex_api3 = require("vortex-api");

// extensions/games/game-masterchiefcollection/util.ts
var import_path3 = __toESM(require("path"));
var import_vortex_api2 = require("vortex-api");
function identifyHaloGames(files) {
  const filtered = files.filter((file) => import_path3.default.extname(file) !== "");
  return Object.keys(HALO_GAMES).reduce((accum, key) => {
    const entry = HALO_GAMES[key];
    filtered.forEach((element) => {
      const segments = element.split(import_path3.default.sep);
      if (segments.includes(entry.modsPath)) {
        accum.push(entry);
        return accum;
      }
    });
    return accum;
  }, []);
}
async function applyToManifest(api, apply) {
  const state = api.getState();
  const activeGame = import_vortex_api2.selectors.activeGameId(state);
  if (activeGame !== GAME_ID) {
    return;
  }
  let manifestData = "";
  try {
    manifestData = await import_vortex_api2.fs.readFileAsync(MOD_MANIFEST_FILE_PATH, { encoding: "utf8" });
  } catch (err) {
    if (!["ENOENT"].includes(err.code)) {
      api.showErrorNotification("Failed to read mod manifest file", err, { allowReport: err.code !== "EPERM" });
      return;
    }
  }
  const stagingPath = import_vortex_api2.selectors.installPathForGame(state, GAME_ID);
  const lines = manifestData.split("\r\n");
  const hasStagingFolderEntry = lines.some((line) => line.includes(stagingPath));
  if (apply && !hasStagingFolderEntry) {
    lines.push(stagingPath);
  } else if (!apply && hasStagingFolderEntry) {
    lines.splice(lines.indexOf(stagingPath), 1);
  }
  try {
    await import_vortex_api2.fs.ensureDirWritableAsync(import_path3.default.dirname(MOD_MANIFEST_FILE_PATH));
    await import_vortex_api2.fs.writeFileAsync(MOD_MANIFEST_FILE_PATH, lines.filter((line) => !!line).join("\r\n"));
  } catch (err) {
    api.showErrorNotification("Failed to write mod manifest file", err, { allowReport: err.code !== "EPERM" });
  }
}

// extensions/games/game-masterchiefcollection/installers.ts
async function testPlugAndPlayInstaller(files, gameId) {
  const hasModInfoFile = files.some((file) => import_path4.default.basename(file).toLowerCase() === MOD_INFO_JSON_FILE);
  return Promise.resolve({ supported: gameId === GAME_ID && hasModInfoFile, requiredFiles: [] });
}
async function installPlugAndPlay(files, destinationPath) {
  const modInfo = files.find((file) => import_path4.default.basename(file).toLowerCase() === MOD_INFO_JSON_FILE);
  const modInfoData = await import_vortex_api3.fs.readFileAsync(import_path4.default.join(destinationPath, modInfo), { encoding: "utf8" });
  const parsed = rjson.parse(modInfoData);
  let modConfigAttributes = [];
  modConfigAttributes.push({
    type: "attribute",
    key: "haloGames",
    value: [HALO_GAMES[parsed.Engine.toLowerCase()].internalId]
  });
  if (parsed.ModVersion !== void 0) {
    modConfigAttributes.push({
      type: "attribute",
      key: "version",
      value: `${parsed.ModVersion.Major || 0}.${parsed.ModVersion.Minor || 0}.${parsed.ModVersion.Patch || 0}`
    });
  }
  if (parsed.Title?.Neutral !== void 0) {
    modConfigAttributes.push({
      type: "attribute",
      key: "customFileName",
      value: parsed.Title.Neutral
    });
  }
  const infoSegments = modInfo.split(import_path4.default.sep);
  const modFolderIndex = infoSegments.length >= 1 ? infoSegments.length - 1 : 0;
  const filtered = files.filter((file) => import_path4.default.extname(import_path4.default.basename(file)) !== "");
  const instructions = filtered.map((file) => {
    const segments = file.split(import_path4.default.sep);
    const destination = segments.slice(modFolderIndex);
    return {
      type: "copy",
      source: file,
      destination: destination.join(import_path4.default.sep)
    };
  });
  instructions.push(...modConfigAttributes);
  return Promise.resolve({ instructions });
}
function testModConfigInstaller(files, gameId) {
  const isAssemblyOnlyMod = () => {
    return files.find((file) => import_path4.default.extname(file) === ASSEMBLY_EXT) !== void 0 && files.find((file) => import_path4.default.extname(file) === MAP_EXT) === void 0;
  };
  return gameId !== GAME_ID ? Promise.resolve({ supported: false, requiredFiles: [] }) : Promise.resolve({
    supported: files.find((file) => import_path4.default.basename(file) === MOD_CONFIG_FILE) !== void 0 && !isAssemblyOnlyMod(),
    requiredFiles: []
  });
}
async function installModConfig(files, destinationPath) {
  const modConfigFile = files.find((file) => import_path4.default.basename(file) === MOD_CONFIG_FILE);
  const filtered = files.filter((file) => {
    const segments = file.split(import_path4.default.sep);
    const lastElementExt = import_path4.default.extname(segments[segments.length - 1]);
    return modConfigFile !== file && ["", ".txt", ASSEMBLY_EXT].indexOf(lastElementExt) === -1;
  });
  const configData = await import_vortex_api3.fs.readFileAsync(import_path4.default.join(destinationPath, modConfigFile), { encoding: "utf8" });
  let data;
  try {
    data = rjson.parse(import_vortex_api3.util.deBOM(configData));
  } catch (err) {
    (0, import_vortex_api3.log)("error", "Unable to parse modpack_config.cfg", err);
    return Promise.reject(new import_vortex_api3.util.DataInvalid("Invalid modpack_config.cfg file"));
  }
  if (!data.entries) {
    return Promise.reject(new import_vortex_api3.util.DataInvalid("modpack_config.cfg file contains no entries"));
  }
  const instructions = filtered.reduce((accum, file) => {
    const matchingEntry = data.entries.find((entry) => "src" in entry && entry.src.toLowerCase() === file.toLowerCase());
    if (!!matchingEntry) {
      const destination = matchingEntry.dest.substring(MOD_CONFIG_DEST_ELEMENT.length);
      accum.push({
        type: "copy",
        source: file,
        destination
      });
    } else {
      (0, import_vortex_api3.log)("warn", "Failed to find matching manifest entry for file in archive", file);
    }
    return accum;
  }, []);
  return Promise.resolve({ instructions });
}
function testInstaller(files, gameId) {
  if (gameId !== GAME_ID) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }
  const haloGames = identifyHaloGames(files);
  return Promise.resolve({
    supported: haloGames.length > 0,
    requiredFiles: []
  });
}
async function install(files, destinationPath) {
  const haloGames = identifyHaloGames(files);
  const internalIds = haloGames.map((game) => game.internalId);
  const attrInstruction = {
    type: "attribute",
    key: "haloGames",
    value: internalIds
  };
  const instructions = haloGames.reduce((accum, haloGame) => {
    const filtered = files.filter((file) => {
      const segments = file.split(import_path4.default.sep).filter((seg) => !!seg);
      return import_path4.default.extname(segments[segments.length - 1]) !== "" && segments.indexOf(haloGame.modsPath) !== -1;
    });
    filtered.forEach((element) => {
      const segments = element.split(import_path4.default.sep).filter((seg) => !!seg);
      const rootIdx = segments.indexOf(haloGame.modsPath);
      const destination = segments.splice(rootIdx).join(import_path4.default.sep);
      accum.push({
        type: "copy",
        source: element,
        destination
      });
    });
    return accum;
  }, [attrInstruction]);
  return Promise.resolve({ instructions });
}

// extensions/games/game-masterchiefcollection/tests.ts
var import_path5 = __toESM(require("path"));
var import_vortex_api4 = require("vortex-api");
var MAP_NUMBER_CONSTRAINT = 28;
async function testCEMP(api) {
  const state = api.getState();
  const activeGameMode = import_vortex_api4.selectors.activeGameId(state);
  if (activeGameMode !== GAME_ID) {
    return Promise.resolve(void 0);
  }
  const discovery = import_vortex_api4.selectors.discoveryByGame(state, GAME_ID);
  if (discovery === void 0) {
    return Promise.resolve(void 0);
  }
  const mods = import_vortex_api4.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  const ceMods = Object.keys(mods).filter((modId) => mods[modId]?.attributes?.haloGames.includes(HALO_GAMES.halo1.internalId));
  if (ceMods.length === 0) {
    return Promise.resolve(void 0);
  }
  const halo1MapsPath = import_path5.default.join(discovery.path, HALO1_MAPS_RELPATH);
  try {
    const fileEntries = await import_vortex_api4.fs.readdirAsync(halo1MapsPath);
    if (fileEntries.length < MAP_NUMBER_CONSTRAINT) {
      throw new Error("Not enough maps");
    }
    return Promise.resolve(void 0);
  } catch (err) {
    const result = {
      description: {
        short: "Halo: CE Multiplayer maps are missing",
        long: 'Your "{{dirPath}}" folder is either missing/inaccessible, or appears to not contain all the required maps. This is usually an indication that you do not have Halo: CE Multiplayer installed. Some mods may not work properly due to a bug in the game engine. Please ensure you have installed CE MP through your game store.',
        replace: {
          dirPath: halo1MapsPath
        }
      },
      severity: "warning"
    };
    return Promise.resolve(result);
  }
}

// extensions/games/game-masterchiefcollection/index.ts
var MasterChiefCollectionGame = class {
  constructor(context) {
    this.requiresLauncher = import_vortex_api5.util.toBlue((gamePath, store) => this.checkLauncher(gamePath, store));
    this.context = context;
    this.id = GAME_ID;
    this.name = "Halo: The Master Chief Collection";
    this.shortName = "Halo: MCC";
    this.logo = "gameart.jpg";
    this.api = context.api;
    this.getGameVersion = resolveGameVersion, this.requiredFiles = [
      this.executable()
    ];
    this.supportedTools = [
      {
        id: "haloassemblytool",
        name: "Assembly",
        logo: "assemblytool.png",
        executable: () => "Assembly.exe",
        requiredFiles: [
          "Assembly.exe"
        ],
        relative: true
      }
    ];
    this.environment = {
      SteamAPPId: STEAM_ID
    };
    this.details = {
      steamAppId: +STEAM_ID
    };
    this.mergeMods = true;
  }
  queryModPath(gamePath) {
    return ".";
  }
  executable() {
    return "mcclauncher.exe";
  }
  async prepare(discovery) {
    return Promise.resolve();
  }
  queryPath() {
    return import_vortex_api5.util.GameStoreHelper.findByAppId([STEAM_ID, MS_APPID]).then((game) => game.gamePath);
  }
  async checkLauncher(gamePath, store) {
    if (store === "xbox") {
      return Promise.resolve({
        launcher: "xbox",
        addInfo: {
          appId: MS_APPID,
          parameters: [
            { appExecName: "HaloMCCShippingNoEAC" }
          ]
        }
      });
    } else if (store === "steam") {
      return Promise.resolve({
        launcher: "steam",
        addInfo: {
          appId: STEAM_ID,
          parameters: ["option2"],
          launchType: "gamestore"
        }
      });
    }
    return Promise.resolve(void 0);
  }
};
var resolveGameVersion = async (discoveryPath) => {
  const versionPath = import_path6.default.join(discoveryPath, "build_tag.txt");
  return import_vortex_api5.fs.readFileAsync(versionPath, { encoding: "utf8" }).then((res) => Promise.resolve(res.split("\r\n")[0].trim()));
};
module.exports = {
  default: (context) => {
    context.registerGame(new MasterChiefCollectionGame(context));
    context.registerModType(
      MODTYPE_PLUG_AND_PLAY,
      15,
      (gameId) => gameId === GAME_ID,
      () => void 0,
      testPlugAndPlayModType,
      {
        deploymentEssential: false,
        mergeMods: true,
        name: "MCC Plug and Play mod",
        noConflicts: true
      }
    );
    context.registerInstaller(
      "mcc-plug-and-play-installer",
      15,
      testPlugAndPlayInstaller,
      installPlugAndPlay
    );
    context.registerInstaller(
      "masterchiefmodconfiginstaller",
      20,
      testModConfigInstaller,
      installModConfig
    );
    context.registerInstaller(
      "masterchiefinstaller",
      25,
      testInstaller,
      install
    );
    context.registerTest("mcc-ce-mp-test", "gamemode-activated", import_vortex_api5.util.toBlue(() => testCEMP(context.api)));
    context.registerTableAttribute("mods", {
      id: "gameType",
      name: "Game(s)",
      description: "Target Halo game(s) for this mod",
      icon: "inspect",
      placement: "table",
      customRenderer: (mod) => {
        const createImgDiv = (entry, idx) => {
          return React.createElement(
            "div",
            { className: "halo-img-div", key: `${entry.internalId}-${idx}` },
            React.createElement("img", { className: "halogameimg", src: `file://${entry.img}` }),
            React.createElement("span", {}, entry.name)
          );
        };
        const internalIds = import_vortex_api5.util.getSafe(mod, ["attributes", "haloGames"], []);
        const haloEntries = Object.keys(HALO_GAMES).filter((key) => internalIds.includes(HALO_GAMES[key].internalId)).map((key) => HALO_GAMES[key]);
        return React.createElement(
          import_vortex_api5.FlexLayout,
          { type: "row" },
          React.createElement(import_vortex_api5.FlexLayout.Flex, { className: "haloimglayout" }, haloEntries.map((entry, idx) => createImgDiv(entry, idx)))
        );
      },
      calc: (mod) => import_vortex_api5.util.getSafe(mod, ["attributes", "haloGames"], void 0),
      filter: new import_vortex_api5.OptionsFilter(
        [].concat(
          [{ value: import_vortex_api5.OptionsFilter.EMPTY, label: "<None>" }],
          Object.keys(HALO_GAMES).map((key) => {
            return { value: HALO_GAMES[key].internalId, label: HALO_GAMES[key].name };
          })
        ),
        true,
        false
      ),
      isToggleable: true,
      edit: {},
      isSortable: false,
      isGroupable: (mod) => {
        const internalIds = import_vortex_api5.util.getSafe(mod, ["attributes", "haloGames"], []);
        const haloEntries = Object.keys(HALO_GAMES).filter((key) => internalIds.includes(HALO_GAMES[key].internalId)).map((key) => HALO_GAMES[key]);
        if (haloEntries.length > 1) {
          return "Multiple";
        } else {
          return !!haloEntries && haloEntries.length > 0 ? haloEntries[0].name : "None";
        }
      },
      isDefaultVisible: true,
      //sortFunc: (lhs, rhs) => getCollator(locale).compare(lhs, rhs),
      condition: () => {
        const activeGameId = import_vortex_api5.selectors.activeGameId(context.api.store.getState());
        return activeGameId === GAME_ID;
      }
    });
    context.once(() => {
      context.api.setStylesheet("masterchiefstyle", import_path6.default.join(__dirname, "masterchief.scss"));
      context.api.onAsync("did-deploy", async (profileId) => applyToManifest(context.api, true));
      context.api.onAsync("did-purge", async (profileId) => applyToManifest(context.api, false));
    });
  }
};
//# sourceMappingURL=index.js.map
