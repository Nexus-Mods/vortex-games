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

// extensions/games/game-bloodstainedritualofthenight/index.ts
var import_path4 = __toESM(require("path"));
var import_vortex_api4 = require("vortex-api");

// extensions/games/game-bloodstainedritualofthenight/common.ts
var import_path = __toESM(require("path"));
var MOD_FILE_EXT = ".pak";
var GAME_ID = "bloodstainedritualofthenight";
var LO_FILE_NAME = "loadOrder.json";
function modsRelPath() {
  return import_path.default.join("BloodstainedRotN", "Content", "Paks", "~mods");
}

// extensions/games/game-bloodstainedritualofthenight/loadOrder.ts
var import_vortex_api2 = require("vortex-api");

// extensions/games/game-bloodstainedritualofthenight/util.ts
var import_bluebird = __toESM(require("bluebird"));
var import_path2 = __toESM(require("path"));
var import_turbowalk = __toESM(require("turbowalk"));
var import_vortex_api = require("vortex-api");
function toBlue(func) {
  return (...args) => import_bluebird.default.resolve(func(...args));
}
function genProps(context, profileId) {
  const api = context.api;
  const state = api.getState();
  const profile = profileId !== void 0 ? import_vortex_api.selectors.profileById(state, profileId) : import_vortex_api.selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return void 0;
  }
  const discovery = import_vortex_api.util.getSafe(
    state,
    ["settings", "gameMode", "discovered", GAME_ID],
    void 0
  );
  if (discovery?.path === void 0) {
    return void 0;
  }
  const mods = import_vortex_api.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  return { api, state, profile, mods, discovery };
}
async function ensureLOFile(context, profileId, props) {
  if (props === void 0) {
    props = genProps(context, profileId);
  }
  if (props === void 0) {
    return Promise.reject(new import_vortex_api.util.ProcessCanceled("failed to generate game props"));
  }
  const targetPath = import_path2.default.join(props.discovery.path, props.profile.id + "_" + LO_FILE_NAME);
  try {
    await import_vortex_api.fs.statAsync(targetPath).catch({ code: "ENOENT" }, () => import_vortex_api.fs.writeFileAsync(targetPath, JSON.stringify([]), { encoding: "utf8" }));
    return targetPath;
  } catch (err) {
    return Promise.reject(err);
  }
}
function makePrefix(input) {
  let res = "";
  let rest = input;
  while (rest > 0) {
    res = String.fromCharCode(65 + rest % 25) + res;
    rest = Math.floor(rest / 25);
  }
  return import_vortex_api.util.pad(res, "A", 3);
}
async function getPakFiles(basePath) {
  let filePaths = [];
  return (0, import_turbowalk.default)(basePath, (files) => {
    const filtered = files.filter((entry) => !entry.isDirectory && import_path2.default.extname(entry.filePath) === MOD_FILE_EXT);
    filePaths = filePaths.concat(filtered.map((entry) => entry.filePath));
  }, { recurse: true, skipLinks: true }).catch((err) => ["ENOENT", "ENOTFOUND"].includes(err.code) ? Promise.resolve() : Promise.reject(err)).then(() => Promise.resolve(filePaths));
}

// extensions/games/game-bloodstainedritualofthenight/loadOrder.ts
async function serialize(context, loadOrder, profileId) {
  const props = genProps(context);
  if (props === void 0) {
    return Promise.reject(new import_vortex_api2.util.ProcessCanceled("invalid props"));
  }
  const loFilePath = await ensureLOFile(context, profileId, props);
  const filteredLO = loadOrder.filter((lo) => props.mods?.[lo?.modId]?.type !== "collection");
  const prefixedLO = filteredLO.map((loEntry, idx) => {
    const prefix = makePrefix(idx);
    const data = {
      prefix
    };
    return { ...loEntry, data };
  });
  await import_vortex_api2.fs.removeAsync(loFilePath).catch({ code: "ENOENT" }, () => Promise.resolve());
  await import_vortex_api2.fs.writeFileAsync(loFilePath, JSON.stringify(prefixedLO), { encoding: "utf8" });
  return Promise.resolve();
}
async function deserialize(context) {
  const props = genProps(context);
  if (props?.profile?.gameId !== GAME_ID) {
    return [];
  }
  const currentModsState = import_vortex_api2.util.getSafe(props.profile, ["modState"], {});
  const enabledModIds = Object.keys(currentModsState).filter((modId) => import_vortex_api2.util.getSafe(currentModsState, [modId, "enabled"], false));
  const mods = import_vortex_api2.util.getSafe(
    props.state,
    ["persistent", "mods", GAME_ID],
    {}
  );
  const loFilePath = await ensureLOFile(context);
  const fileData = await import_vortex_api2.fs.readFileAsync(loFilePath, { encoding: "utf8" });
  let data = [];
  try {
    try {
      data = JSON.parse(fileData);
    } catch (err) {
      await new Promise((resolve, reject) => {
        props.api.showDialog("error", "Corrupt load order file", {
          bbcode: props.api.translate("The load order file is in a corrupt state. You can try to fix it yourself or Vortex can regenerate the file for you, but that may result in loss of data (Will only affect load order items you added manually, if any).")
        }, [
          { label: "Cancel", action: () => reject(err) },
          {
            label: "Regenerate File",
            action: () => {
              data = [];
              return resolve();
            }
          }
        ]);
      });
    }
    const filteredData = data.filter((entry) => enabledModIds.includes(entry.id));
    const diff = enabledModIds.filter((id) => mods[id]?.type !== "collection" && filteredData.find((loEntry) => loEntry.id === id) === void 0);
    diff.forEach((missingEntry) => {
      filteredData.push({
        id: missingEntry,
        modId: missingEntry,
        enabled: true,
        name: mods[missingEntry] !== void 0 ? import_vortex_api2.util.renderModName(mods[missingEntry]) : missingEntry
      });
    });
    return filteredData;
  } catch (err) {
    return Promise.reject(err);
  }
}
async function validate(prev, current) {
  return void 0;
}

// extensions/games/game-bloodstainedritualofthenight/migrations.ts
var import_path3 = __toESM(require("path"));
var import_semver = __toESM(require("semver"));
var import_vortex_api3 = require("vortex-api");
var oldModRelPath = import_path3.default.join("BloodstainedRotN", "Content", "Paks", "~mod");
async function migrate100(api, oldVersion) {
  if (import_semver.default.gte(oldVersion || "0.0.1", "1.0.0")) {
    return Promise.resolve();
  }
  const state = api.store.getState();
  const activatorId = import_vortex_api3.selectors.activatorForGame(state, GAME_ID);
  const activator = import_vortex_api3.util.getActivator(activatorId);
  const discovery = import_vortex_api3.util.getSafe(state, ["settings", "gameMode", "discovered", GAME_ID], void 0);
  if (discovery === void 0 || discovery.path === void 0 || activator === void 0) {
    (0, import_vortex_api3.log)("debug", "skipping bloodstained migration because no deployment set up for it");
    return Promise.resolve();
  }
  return api.awaitUI().then(() => import_vortex_api3.fs.ensureDirWritableAsync(import_path3.default.join(discovery.path, modsRelPath()))).then(() => api.emitAndAwait(
    "purge-mods-in-path",
    GAME_ID,
    "",
    import_path3.default.join(discovery.path, oldModRelPath)
  )).then(() => {
    api.store.dispatch(import_vortex_api3.actions.setDeploymentNecessary(GAME_ID, true));
  });
}

// extensions/games/game-bloodstainedritualofthenight/index.ts
var STEAM_ID = "692850";
var EPIC_ID = "a2ac59c83b704e40b4ab3a9e963fef52";
async function findGame() {
  return import_vortex_api4.util.GameStoreHelper.findByAppId([STEAM_ID, EPIC_ID]).then((game) => game.gamePath);
}
async function externalFilesWarning(api, externalMods) {
  const t = api.translate;
  if (externalMods.length === 0) {
    return Promise.resolve(void 0);
  }
  return new Promise((resolve, reject) => {
    api.showDialog("info", "External Mod Files Detected", {
      bbcode: t(
        "Vortex has discovered the following unmanaged/external files in the the game's mods directory:[br][/br][br][/br]{{files}}[br][/br]Please note that the existence of these mods interferes with Vortex's load ordering functionality and as such, they should be removed using the same medium through which they have been added.[br][/br][br][/br]Alternatively, Vortex can try to import these files into its mods list which will allow Vortex to take control over them and display them inside the load ordering page. Vortex's load ordering functionality will not display external mod entries unless imported!",
        { replace: { files: externalMods.map((mod) => `"${mod}"`).join("[br][/br]") } }
      )
    }, [
      { label: "Close", action: () => reject(new import_vortex_api4.util.UserCanceled()) },
      { label: "Import External Mods", action: () => resolve(void 0) }
    ]);
  });
}
async function ImportExternalMods(api, external) {
  const state = api.getState();
  const downloadsPath = import_vortex_api4.selectors.downloadPathForGame(state, GAME_ID);
  const szip = new import_vortex_api4.util.SevenZip();
  for (const modFile of external) {
    const archivePath = import_path4.default.join(downloadsPath, import_path4.default.basename(modFile, MOD_FILE_EXT) + ".zip");
    try {
      await szip.add(archivePath, [modFile], { raw: ["-r"] });
      await import_vortex_api4.fs.removeAsync(modFile);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
async function prepareForModding(context, discovery) {
  const state = context.api.getState();
  const modsPath = import_path4.default.join(discovery.path, modsRelPath());
  try {
    await import_vortex_api4.fs.ensureDirWritableAsync(modsPath);
    const installPath = import_vortex_api4.selectors.installPathForGame(state, GAME_ID);
    const managedFiles = await getPakFiles(installPath);
    const deployedFiles = await getPakFiles(modsPath);
    const modifier = (filePath) => import_path4.default.basename(filePath).toLowerCase();
    const unManagedPredicate = (filePath) => managedFiles.find((managed) => modifier(managed) === modifier(filePath)) === void 0;
    const externalMods = deployedFiles.filter(unManagedPredicate);
    try {
      await externalFilesWarning(context.api, externalMods);
      await ImportExternalMods(context.api, externalMods);
    } catch (err) {
      if (err instanceof import_vortex_api4.util.UserCanceled) {
      } else {
        return Promise.reject(err);
      }
    }
  } catch (err) {
    return Promise.reject(err);
  }
}
function installContent(files) {
  const modFile = files.find((file) => import_path4.default.extname(file).toLowerCase() === MOD_FILE_EXT);
  const idx = modFile.indexOf(import_path4.default.basename(modFile));
  const rootPath = import_path4.default.dirname(modFile);
  const filtered = files.filter((file) => file.indexOf(rootPath) !== -1 && !file.endsWith(import_path4.default.sep));
  const instructions = filtered.map((file) => {
    return {
      type: "copy",
      source: file,
      destination: import_path4.default.join(file.substr(idx))
    };
  });
  return Promise.resolve({ instructions });
}
function testSupportedContent(files, gameId) {
  let supported = gameId === GAME_ID && files.find((file) => import_path4.default.extname(file).toLowerCase() === MOD_FILE_EXT) !== void 0;
  if (supported && files.find((file) => import_path4.default.basename(file).toLowerCase() === "moduleconfig.xml" && import_path4.default.basename(import_path4.default.dirname(file)).toLowerCase() === "fomod")) {
    supported = false;
  }
  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}
function toLOPrefix(context, mod) {
  const props = genProps(context);
  if (props === void 0) {
    return "ZZZZ-" + mod.id;
  }
  const loadOrder = import_vortex_api4.util.getSafe(props.state, ["persistent", "loadOrder", props.profile.id], []);
  const loEntry = loadOrder.find((loEntry2) => loEntry2.id === mod.id);
  return loEntry?.data?.prefix !== void 0 ? loEntry.data.prefix + "-" + mod.id : "ZZZZ-" + mod.id;
}
async function requiresLauncher(gamePath, store) {
  if (store === "epic") {
    return Promise.resolve({
      launcher: "epic",
      addInfo: {
        appId: EPIC_ID
      }
    });
  }
  return Promise.resolve(void 0);
}
function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: "Bloodstained:	Ritual of the Night",
    mergeMods: (mod) => toLOPrefix(context, mod),
    queryPath: toBlue(findGame),
    requiresCleanup: true,
    supportedTools: [],
    queryModPath: () => modsRelPath(),
    logo: "gameart.jpg",
    executable: () => "BloodstainedROTN.exe",
    requiredFiles: [
      "BloodstainedRotN.exe",
      "BloodstainedROTN/Binaries/Win64/BloodstainedRotN-Win64-Shipping.exe"
    ],
    setup: toBlue((discovery) => prepareForModding(context, discovery)),
    requiresLauncher,
    environment: {
      SteamAPPId: STEAM_ID
    },
    details: {
      steamAppId: +STEAM_ID,
      hashFiles: [
        "BloodstainedRotN.exe",
        "BloodstainedROTN/Binaries/Win64/BloodstainedRotN-Win64-Shipping.exe"
      ]
    }
  });
  context.registerLoadOrder({
    deserializeLoadOrder: () => deserialize(context),
    serializeLoadOrder: (loadOrder) => serialize(context, loadOrder),
    validate,
    gameId: GAME_ID,
    toggleableEntries: false,
    usageInstructions: 'Drag and drop the mods on the left to reorder them. BloodstainedROTN loads mods in alphabetic order so Vortex prefixes the directory names with "AAA, AAB, AAC, ..." to ensure they load in the order you set here.'
  });
  context.registerInstaller(
    "bloodstainedrotn-mod",
    25,
    toBlue(testSupportedContent),
    toBlue(installContent)
  );
  context.registerMigration(toBlue((oldVer) => migrate100(context.api, oldVer)));
  return true;
}
module.exports = {
  default: main
};
//# sourceMappingURL=index.js.map
