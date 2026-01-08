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

// extensions/games/game-codevein/index.ts
var import_bluebird2 = __toESM(require("bluebird"));
var import_path4 = __toESM(require("path"));
var import_vortex_api4 = require("vortex-api");

// extensions/games/game-codevein/common.ts
var import_path = __toESM(require("path"));
var MOD_FILE_EXT = ".pak";
var GAME_ID = "codevein";
var LO_FILE_NAME = "loadOrder.json";
function modsRelPath() {
  return import_path.default.join("CodeVein", "content", "paks", "~mods");
}

// extensions/games/game-codevein/loadOrder.ts
var import_vortex_api2 = require("vortex-api");

// extensions/games/game-codevein/util.ts
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

// extensions/games/game-codevein/loadOrder.ts
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
  try {
    const data = JSON.parse(fileData);
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

// extensions/games/game-codevein/migrations.ts
var import_path3 = __toESM(require("path"));
var import_semver = __toESM(require("semver"));
var import_vortex_api3 = require("vortex-api");
async function migrate100(context, oldVersion) {
  if (import_semver.default.gte(oldVersion, "1.0.0")) {
    return Promise.resolve();
  }
  const state = context.api.store.getState();
  const activatorId = import_vortex_api3.selectors.activatorForGame(state, GAME_ID);
  const activator = import_vortex_api3.util.getActivator(activatorId);
  const discoveryPath = import_vortex_api3.util.getSafe(
    state,
    ["settings", "gameMode", "discovered", GAME_ID, "path"],
    void 0
  );
  if (discoveryPath === void 0 || activator === void 0) {
    return Promise.resolve();
  }
  const mods = import_vortex_api3.util.getSafe(
    state,
    ["persistent", "mods", GAME_ID],
    {}
  );
  if (Object.keys(mods).length === 0) {
    return Promise.resolve();
  }
  const profiles = import_vortex_api3.util.getSafe(state, ["persistent", "profiles"], {});
  const loProfiles = Object.keys(profiles).filter((id) => profiles[id]?.gameId === GAME_ID);
  const loMap = loProfiles.reduce((accum, iter) => {
    const current = import_vortex_api3.util.getSafe(state, ["persistent", "loadOrder", iter], []);
    const newLO = current.map((entry) => {
      return {
        enabled: true,
        name: mods[entry] !== void 0 ? import_vortex_api3.util.renderModName(mods[entry]) : entry,
        id: entry,
        modId: entry
      };
    });
    accum[iter] = newLO;
    return accum;
  }, {});
  for (const profileId of Object.keys(loMap)) {
    await serialize(context, loMap[profileId], profileId);
  }
  const modsPath = import_path3.default.join(discoveryPath, modsRelPath());
  return context.api.awaitUI().then(() => import_vortex_api3.fs.ensureDirWritableAsync(modsPath)).then(() => context.api.emitAndAwait("purge-mods-in-path", GAME_ID, "", modsPath)).then(() => context.api.store.dispatch(import_vortex_api3.actions.setDeploymentNecessary(GAME_ID, true)));
}

// extensions/games/game-codevein/index.ts
var STEAM_ID = "678960";
async function findGame() {
  return import_vortex_api4.util.GameStoreHelper.findByAppId([STEAM_ID]).then((game) => game.gamePath);
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
var localAppData = /* @__PURE__ */ (() => {
  let cached;
  return () => {
    if (cached === void 0) {
      cached = process.env.LOCALAPPDATA || import_path4.default.resolve(import_vortex_api4.util.getVortexPath("appData"), "..", "Local");
    }
    return cached;
  };
})();
var EXECUTABLE = import_path4.default.join("CodeVein", "Binaries", "Win64", "CodeVein-Win64-Shipping.exe");
function getGameVersion(gamePath) {
  const exeVersion = require("exe-version");
  return import_bluebird2.default.resolve(exeVersion.getProductVersionLocalized(import_path4.default.join(gamePath, EXECUTABLE)));
}
function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: "Code Vein",
    mergeMods: (mod) => toLOPrefix(context, mod),
    queryPath: toBlue(findGame),
    requiresCleanup: true,
    supportedTools: [],
    queryModPath: () => modsRelPath(),
    logo: "gameart.jpg",
    executable: () => EXECUTABLE,
    getGameVersion,
    requiredFiles: [
      EXECUTABLE
    ],
    setup: toBlue((discovery) => prepareForModding(context, discovery)),
    environment: {
      SteamAPPId: STEAM_ID
    },
    details: {
      steamAppId: +STEAM_ID,
      settingsPath: () => import_path4.default.join(localAppData(), "CodeVein", "Saved", "Config", "WindowsNoEditor")
    }
  });
  context.registerLoadOrder({
    deserializeLoadOrder: () => deserialize(context),
    serializeLoadOrder: (loadOrder) => serialize(context, loadOrder),
    validate,
    gameId: GAME_ID,
    toggleableEntries: false,
    usageInstructions: 'Drag and drop the mods on the left to reorder them. Code Vein loads mods in alphabetic order so Vortex prefixes the directory names with "AAA, AAB, AAC, ..." to ensure they load in the order you set here.'
  });
  context.registerInstaller(
    "codevein-mod",
    25,
    toBlue(testSupportedContent),
    toBlue(installContent)
  );
  context.registerMigration(toBlue((oldVer) => migrate100(context, oldVer)));
  return true;
}
module.exports = {
  default: main
};
//# sourceMappingURL=index.js.map
