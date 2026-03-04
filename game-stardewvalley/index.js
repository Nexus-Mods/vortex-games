var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// extensions/games/game-stardewvalley/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => init
});
module.exports = __toCommonJS(index_exports);
var import_vortex_api29 = require("vortex-api");

// extensions/games/game-stardewvalley/state/reducers.ts
var import_vortex_api = require("vortex-api");

// extensions/games/game-stardewvalley/state/actions.ts
var import_redux_act = require("redux-act");
var setRecommendations = (0, import_redux_act.createAction)("SET_SDV_RECOMMENDATIONS", (enabled) => enabled);
var setMergeConfigs = (0, import_redux_act.createAction)("SET_SDV_MERGE_CONFIGS", (profileId, enabled) => ({ profileId, enabled }));

// extensions/games/game-stardewvalley/state/reducers.ts
var sdvReducers = {
  reducers: {
    [setRecommendations]: (state, payload) => {
      return import_vortex_api.util.setSafe(state, ["useRecommendations"], payload);
    },
    [setMergeConfigs]: (state, payload) => {
      const { profileId, enabled } = payload;
      return import_vortex_api.util.setSafe(state, ["mergeConfigs", profileId], enabled);
    }
  },
  defaults: {
    useRecommendations: false
  }
};
var reducers_default = sdvReducers;

// extensions/games/game-stardewvalley/configMod/index.ts
var import_vortex_api15 = require("vortex-api");

// extensions/games/game-stardewvalley/common.ts
var GAME_ID = "stardewvalley";
var MOD_CONFIG = "config.json";
var MOD_MANIFEST = "manifest.json";
var MODS_REL_PATH = "Mods";
var RGX_INVALID_CHARS_WINDOWS = /[:/\\*?"<>|]/g;
var MOD_TYPE_SMAPI = "SMAPI";
var MOD_TYPE_CONFIG = "sdv-configuration-mod";
var MOD_TYPE_ROOT = "sdvrootfolder";
var INSTALLER_ID_SMAPI = "smapi-installer";
var INSTALLER_ID_ROOT = "sdvrootfolder";
var INSTALLER_ID_MANIFEST = "stardew-valley-installer";
var INSTALLER_PRIORITY_SMAPI = 30;
var INSTALLER_PRIORITY_ROOT = 50;
var INSTALLER_PRIORITY_MANIFEST = 50;
var MOD_TYPE_PRIORITY_SMAPI = 30;
var MOD_TYPE_PRIORITY_CONFIG = 30;
var MOD_TYPE_PRIORITY_ROOT = 25;
var SMAPI_INTERNAL_DIRECTORY = "smapi-internal";
var _SMAPI_BUNDLED_MODS = ["ErrorHandler", "ConsoleCommands", "SaveBackup"];
var SMAPI_QUERY_FREQUENCY = 1e3 * 60 * 24 * 7;
var SMAPI_IO_API_VERSION = "3.0.0";
var SMAPI_MOD_ID = 2400;
var SMAPI_URL = `https://www.nexusmods.com/stardewvalley/mods/${SMAPI_MOD_ID}`;
var NOTIF_ACTIVITY_CONFIG_MOD = "sdv-config-mod-activity";
var getBundledMods = () => {
  return Array.from(new Set(_SMAPI_BUNDLED_MODS.map((modName) => modName.toLowerCase())));
};

// extensions/games/game-stardewvalley/configMod/ingest.ts
var import_path4 = __toESM(require("path"));
var import_vortex_api13 = require("vortex-api");

// extensions/games/game-stardewvalley/smapi/download.ts
var import_vortex_api2 = require("vortex-api");
async function downloadSMAPI(api) {
  if (api.ext?.ensureLoggedIn !== void 0) {
    await api.ext.ensureLoggedIn();
  }
  const file = await findSMAPIMainFile(api);
  const dlInfo = {
    game: GAME_ID,
    name: "SMAPI"
  };
  const nxmUrl = `nxm://${GAME_ID}/mods/${SMAPI_MOD_ID}/files/${file.file_id}`;
  return import_vortex_api2.util.toPromise((cb) => api.events.emit("start-download", [nxmUrl], dlInfo, void 0, cb, void 0, { allowInstall: false }));
}
async function findSMAPIMainFile(api) {
  if (api.ext?.nexusGetModFiles === void 0) {
    throw new import_vortex_api2.util.ProcessCanceled("Nexus API unavailable");
  }
  const modFiles = await api.ext.nexusGetModFiles(GAME_ID, SMAPI_MOD_ID);
  const fileTime = (input) => Number.parseInt(String(input.uploaded_time ?? 0), 10);
  const file = modFiles.filter((modFile) => modFile.category_id === 1).sort((lhs, rhs) => fileTime(lhs) - fileTime(rhs))[0];
  if (file === void 0) {
    throw new import_vortex_api2.util.ProcessCanceled("No SMAPI main file found");
  }
  return file;
}

// extensions/games/game-stardewvalley/smapi/install.ts
var import_vortex_api3 = require("vortex-api");
async function installDownloadedSMAPI(api, downloadId) {
  return import_vortex_api3.util.toPromise((cb) => api.events.emit("start-install-download", downloadId, { allowAutoEnable: false }, cb));
}
async function enableSMAPIMod(api, modId) {
  const profileId = import_vortex_api3.selectors.lastActiveProfileForGame(api.getState(), GAME_ID);
  await import_vortex_api3.actions.setModsEnabled(api, profileId, [modId], true, {
    allowAutoDeploy: false,
    installed: true
  });
}

// extensions/games/game-stardewvalley/smapi/workflow.ts
var import_vortex_api5 = require("vortex-api");

// extensions/games/game-stardewvalley/smapi/lifecycle.ts
var import_vortex_api4 = require("vortex-api");
async function deploySMAPI(api) {
  await import_vortex_api4.util.toPromise((cb) => api.events.emit("deploy-mods", cb));
  await import_vortex_api4.util.toPromise((cb) => api.events.emit("start-quick-discovery", () => cb(null)));
  const discovery = import_vortex_api4.selectors.discoveryByGame(api.getState(), GAME_ID);
  const tool = discovery?.tools?.["smapi"];
  if (tool !== void 0 && api.store !== void 0) {
    api.store.dispatch(import_vortex_api4.actions.setPrimaryTool(GAME_ID, tool.id));
  }
}

// extensions/games/game-stardewvalley/smapi/workflow.ts
async function downloadAndInstallSMAPI(api, update) {
  api.dismissNotification?.("smapi-missing");
  api.sendNotification?.({
    id: "smapi-installing",
    message: update ? "Updating SMAPI" : "Installing SMAPI",
    type: "activity",
    noDismiss: true,
    allowSuppress: false
  });
  try {
    const downloadId = await downloadSMAPI(api);
    const modId = await installDownloadedSMAPI(api, downloadId);
    await enableSMAPIMod(api, modId);
    await deploySMAPI(api);
  } catch (err) {
    api.showErrorNotification?.("Failed to download/install SMAPI", err);
    import_vortex_api5.util.opn(SMAPI_URL).catch(() => null);
  } finally {
    api.dismissNotification?.("smapi-installing");
  }
}

// extensions/games/game-stardewvalley/smapi/proxy.ts
var https = __toESM(require("https"));
var semver2 = __toESM(require("semver"));
var import_vortex_api6 = require("vortex-api");

// extensions/games/game-stardewvalley/smapi/version.ts
var semver = __toESM(require("semver"));
function coerce2(input) {
  try {
    return new semver.SemVer(input);
  } catch (_err) {
    return semver.coerce(input) ?? new semver.SemVer("0.0.0");
  }
}
function semverCompare(lhs, rhs) {
  const l = coerce2(lhs);
  const r = coerce2(rhs);
  if (l !== null && r !== null) {
    return semver.compare(l, r);
  } else {
    return lhs.localeCompare(rhs, "en-US");
  }
}

// extensions/games/game-stardewvalley/smapi/proxy.ts
var SMAPIProxy = class {
  /**
   * Creates a proxy bound to a Vortex extension API instance.
   *
   * @param api Vortex extension API (`types.IExtensionApi`) used for Nexus
   * fallback metadata lookups.
   */
  constructor(api) {
    this.mAPI = api;
    this.mOptions = {
      host: SMAPI_HOST,
      method: "POST",
      protocol: "https:",
      path: "/api/v3.0/mods",
      headers: {
        "Content-Type": "application/json"
      }
    };
  }
  /**
   * Resolves compatibility metadata for a single modmeta query.
   *
   * @param query Modmeta query (`IQuery`) containing mod name and version
   * constraints.
   * @returns Lookup results (`ILookupResult[]`) used by Vortex metadata
   * pipelines.
   */
  async find(query) {
    const queryName = query.name;
    if (queryName === void 0) {
      return [];
    }
    const res = await this.findByNames([{ id: queryName }]);
    const firstResult = res[0];
    const main = firstResult?.metadata?.main;
    if (firstResult === void 0 || main === void 0) {
      return [];
    }
    const key = this.makeKey(query);
    if (firstResult.metadata.nexusID !== void 0) {
      return this.lookupOnNexus(query, firstResult.metadata.nexusID, main.version);
    }
    return [{ key, value: {
      gameId: GAME_ID,
      fileMD5: "",
      fileName: queryName,
      fileSizeBytes: 0,
      fileVersion: "",
      sourceURI: main.url ?? ""
    } }];
  }
  /**
   * Sends one or more mod ids to the SMAPI.io compatibility endpoint.
   *
   * @param query SMAPI.io request payload (`ISMAPIIOQuery[]`).
   * @returns Parsed compatibility results (`ISMAPIResult[]`) returned by
   * SMAPI.io.
   */
  async findByNames(query) {
    return new Promise((resolve, reject) => {
      const req = https.request(this.mOptions, (res) => {
        let body = Buffer.from([]);
        res.on("error", (err) => reject(err)).on("data", (chunk) => {
          body = Buffer.concat([body, chunk]);
        }).on("end", () => {
          const textual = body.toString("utf8");
          try {
            const parsed = JSON.parse(textual);
            resolve(parsed);
          } catch (err) {
            (0, import_vortex_api6.log)("error", "failed to parse smapi response", textual);
            reject(err);
          }
        });
      }).on("error", (err) => reject(err));
      req.write(JSON.stringify({
        mods: query,
        includeExtendedMetadata: true,
        apiVersion: SMAPI_IO_API_VERSION
      }));
      req.end();
    });
  }
  makeKey(query) {
    return `smapio:${query.name}:${query.versionMatch}`;
  }
  async lookupOnNexus(query, nexusId, version) {
    if (this.mAPI.ext?.ensureLoggedIn !== void 0) {
      await this.mAPI.ext.ensureLoggedIn();
    }
    const files = await this.mAPI.ext.nexusGetModFiles?.(GAME_ID, nexusId) ?? [];
    const versionPattern = version !== void 0 ? `>=${version}` : "*";
    const file = files.filter((iter) => semver2.satisfies(coerce2(iter.version), versionPattern)).sort((lhs, rhs) => semverCompare(rhs.version, lhs.version))[0];
    if (file === void 0) {
      throw new Error("no file found");
    }
    return [{
      key: this.makeKey(query),
      value: {
        fileMD5: "",
        fileName: file.file_name ?? "",
        fileSizeBytes: file.size * 1024,
        fileVersion: file.version ?? "",
        gameId: GAME_ID,
        sourceURI: `nxm://${GAME_ID}/mods/${nexusId}/files/${file.file_id}`,
        logicalFileName: (query.name ?? "").toLowerCase(),
        source: "nexus",
        domainName: GAME_ID,
        details: {
          category: file.category_id.toString(),
          description: file.description,
          modId: nexusId.toString(),
          fileId: file.file_id.toString()
        }
      }
    }];
  }
};
var SMAPI_HOST = "smapi.io";

// extensions/games/game-stardewvalley/smapi/selectors.ts
var import_semver = require("semver");
var import_vortex_api8 = require("vortex-api");

// extensions/games/game-stardewvalley/state/selectors.ts
var import_vortex_api7 = require("vortex-api");
function selectSdvDiscoveryPath(state) {
  return import_vortex_api7.util.getSafe(state, ["settings", "gameMode", "discovered", GAME_ID, "path"], void 0);
}
function selectDiscoveredToolPath(state, gameId) {
  return import_vortex_api7.util.getSafe(state, ["settings", "gameMode", "discovered", gameId, "path"], "");
}
function selectSdvMods(state) {
  return import_vortex_api7.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
}
function selectMergeConfigsEnabled(state, profileId) {
  return import_vortex_api7.util.getSafe(state, ["settings", "SDV", "mergeConfigs", profileId], false);
}
function selectConfigModAttributes(state, configModId) {
  return import_vortex_api7.util.getSafe(state, ["persistent", "mods", GAME_ID, configModId, "attributes", "configMod"], []);
}

// extensions/games/game-stardewvalley/smapi/selectors.ts
function findSMAPITool(api) {
  const state = api.getState();
  const discovery = import_vortex_api8.selectors.discoveryByGame(state, GAME_ID);
  const tool = discovery?.tools?.["smapi"];
  return tool?.path ? tool : void 0;
}
function getSMAPIMods(api) {
  const state = api.getState();
  const profileId = import_vortex_api8.selectors.lastActiveProfileForGame(state, GAME_ID);
  const profile = import_vortex_api8.selectors.profileById(state, profileId);
  const isActive = (modId) => import_vortex_api8.util.getSafe(profile, ["modState", modId, "enabled"], false);
  const isSMAPI = (mod) => mod.type === MOD_TYPE_SMAPI && mod.attributes?.modId === SMAPI_MOD_ID;
  const mods = selectSdvMods(state);
  return Object.values(mods).filter((mod) => isSMAPI(mod) && isActive(mod.id));
}
function findSMAPIMod(api) {
  const smapiMods = getSMAPIMods(api);
  return smapiMods.length === 0 ? void 0 : smapiMods.length > 1 ? smapiMods.reduce((prev, iter) => {
    if (prev === void 0) {
      return iter;
    }
    return (0, import_semver.gte)(iter?.attributes?.version ?? "0.0.0", prev?.attributes?.version ?? "0.0.0") ? iter : prev;
  }, void 0) : smapiMods[0];
}

// extensions/games/game-stardewvalley/configMod/sync.ts
var import_path3 = __toESM(require("path"));
var import_vortex_api12 = require("vortex-api");

// extensions/games/game-stardewvalley/configMod/filesystem.ts
var import_turbowalk = __toESM(require("turbowalk"));
var import_vortex_api9 = require("vortex-api");
async function walkPath(dirPath, walkOptions) {
  walkOptions = walkOptions ? { ...walkOptions, skipHidden: true, skipInaccessible: true, skipLinks: true } : { skipLinks: true, skipHidden: true, skipInaccessible: true };
  const walkResults = [];
  try {
    await (0, import_turbowalk.default)(dirPath, (entries) => {
      walkResults.push(...entries);
      return Promise.resolve();
    }, walkOptions);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
  return walkResults;
}
async function deleteFolder(dirPath, walkOptions) {
  try {
    const entries = await walkPath(dirPath, walkOptions);
    entries.sort((a, b) => b.filePath.length - a.filePath.length);
    for (const entry of entries) {
      await import_vortex_api9.fs.removeAsync(entry.filePath);
    }
    await import_vortex_api9.fs.rmdirAsync(dirPath);
  } catch (err) {
    return Promise.reject(err);
  }
}

// extensions/games/game-stardewvalley/configMod/lifecycle.ts
var import_path = __toESM(require("path"));
var import_vortex_api10 = require("vortex-api");
function sanitizeProfileName(input) {
  return input.replace(RGX_INVALID_CHARS_WINDOWS, "_");
}
function extractConfigModAttributes(state, configModId) {
  return selectConfigModAttributes(state, configModId);
}
function setConfigModAttribute(api, configModId, attributes) {
  api.store?.dispatch(import_vortex_api10.actions.setModAttribute(GAME_ID, configModId, "configMod", attributes));
}
function removeConfigModAttributes(api, configMod, attributes) {
  const existing = extractConfigModAttributes(api.getState(), configMod.id);
  const nextAttributes = existing.filter((attr) => !attributes.includes(attr));
  setConfigModAttribute(api, configMod.id, nextAttributes);
}
async function initializeConfigMod(api, profileId) {
  const state = api.getState();
  const profile = resolveProfile(state, profileId);
  if (profile?.gameId !== GAME_ID) {
    return void 0;
  }
  const mergeConfigs = selectMergeConfigsEnabled(state, profile.id);
  if (!mergeConfigs) {
    return void 0;
  }
  try {
    const mod = await ensureConfigMod(api, profile);
    const installationPath = import_vortex_api10.selectors.installPathForGame(state, GAME_ID);
    const configModPath = import_path.default.join(installationPath, mod.installationPath);
    return {
      mod,
      configModPath,
      profileId: profile.id
    };
  } catch (err) {
    api.showErrorNotification?.("Failed to resolve config mod path", err);
    return void 0;
  }
}
function resolveProfile(state, profileId) {
  return profileId !== void 0 ? import_vortex_api10.selectors.profileById(state, profileId) : import_vortex_api10.selectors.activeProfile(state);
}
function configModName(profileName) {
  return `Stardew Valley Configuration (${sanitizeProfileName(profileName)})`;
}
async function ensureConfigMod(api, profile) {
  const state = api.getState();
  const mods = selectSdvMods(state);
  const modInstalled = Object.values(mods).find((iter) => iter.type === MOD_TYPE_CONFIG);
  if (modInstalled !== void 0) {
    return modInstalled;
  }
  const modName = configModName(profile.name);
  const mod = await createConfigMod(api, modName, profile);
  api.store?.dispatch(import_vortex_api10.actions.setModEnabled(profile.id, mod.id, true));
  return mod;
}
async function createConfigMod(api, modName, profile) {
  const mod = {
    id: modName,
    state: "installed",
    attributes: {
      name: "Stardew Valley Mod Configuration",
      description: "This mod is a collective merge of SDV mod configuration files which Vortex maintains for the mods you have installed. The configuration is maintained through mod updates, but at times it may need to be manually updated",
      logicalFileName: "Stardew Valley Mod Configuration",
      modId: 42,
      version: "1.0.0",
      variant: sanitizeProfileName(profile.name.replace(RGX_INVALID_CHARS_WINDOWS, "_")),
      installTime: /* @__PURE__ */ new Date(),
      source: "user-generated"
    },
    installationPath: modName,
    type: MOD_TYPE_CONFIG
  };
  return new Promise((resolve, reject) => {
    api.events.emit("create-mod", profile.gameId, mod, (error) => {
      if (error !== null) {
        reject(error);
        return;
      }
      resolve(mod);
    });
  });
}

// extensions/games/game-stardewvalley/configMod/policy.ts
var import_path2 = __toESM(require("path"));
var import_vortex_api11 = require("vortex-api");
function shouldSuppressSync(api) {
  const state = api.getState();
  const suppressOnActivities = ["installing_dependencies"];
  const isActivityRunning = (activity) => import_vortex_api11.util.getSafe(state, ["session", "base", "activity", activity], []).length > 0;
  return suppressOnActivities.some((activity) => isActivityRunning(activity));
}
function isSmapiInternalPath(filePath) {
  const normalizedInternalDir = SMAPI_INTERNAL_DIRECTORY.toLowerCase().replace(/[-_]/g, "");
  const segments = filePath.toLowerCase().split(import_path2.default.sep).filter((segment) => segment.length > 0).map((segment) => segment.replace(/[-_]/g, ""));
  return segments.some((segment) => segment === normalizedInternalDir);
}
function isModCandidateValid(mod, entry) {
  if (mod === void 0 || mod.id === void 0 || mod.type === MOD_TYPE_ROOT) {
    return false;
  }
  if (mod.type !== MOD_TYPE_SMAPI) {
    return true;
  }
  const segments = entry.filePath.toLowerCase().split(import_path2.default.sep).filter((segment) => segment.length > 0);
  const modsSegIdx = segments.indexOf("mods");
  const modFolderName = modsSegIdx !== -1 && segments.length > modsSegIdx + 1 ? segments[modsSegIdx + 1] : void 0;
  if (segments.includes("content")) {
    return false;
  }
  let bundledMods = import_vortex_api11.util.getSafe(mod, ["attributes", "smapiBundledMods"], []);
  bundledMods = bundledMods.length > 0 ? bundledMods : getBundledMods();
  return modFolderName !== void 0 && bundledMods.includes(modFolderName);
}

// extensions/games/game-stardewvalley/configMod/sync.ts
async function onSyncModConfigurations(api, silent, profileId) {
  const state = api.getState();
  const profile = profileId !== void 0 ? import_vortex_api12.selectors.profileById(state, profileId) : import_vortex_api12.selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID || shouldSuppressSync(api)) {
    return;
  }
  const smapiTool = findSMAPITool(api);
  if (!smapiTool?.path) {
    return;
  }
  const mergeConfigs = selectMergeConfigsEnabled(state, profile.id);
  if (!mergeConfigs) {
    if (silent || api.showDialog === void 0) {
      return;
    }
    const result = await api.showDialog("info", "Mod Configuration Sync", {
      bbcode: "Many Stardew Valley mods generate their own configuration files during game play. By default the generated files are, ingested by their respective mods.[br][/br][br][/br]Unfortunately the mod configuration files are lost when updating or removing a mod.[br][/br][br][/br] This button allows you to Import all of your active mod's configuration files into a single mod which will remain unaffected by mod updates.[br][/br][br][/br]Would you like to enable this functionality? (SMAPI must be installed)"
    }, [
      { label: "Close" },
      { label: "Enable" }
    ]);
    if (result.action === "Close") {
      return;
    }
    if (result.action === "Enable") {
      api.store?.dispatch(setMergeConfigs(profile.id, true));
    }
  }
  try {
    const configMod = await initializeConfigMod(api, profile.id);
    if (configMod === void 0) {
      return;
    }
    await emitLifecycleEvent(api, "purge-mods");
    const installPath = import_vortex_api12.selectors.installPathForGame(api.getState(), GAME_ID);
    const resolveCandidateName = (file) => {
      const relPath = import_path3.default.relative(installPath, file.filePath);
      const segments = relPath.split(import_path3.default.sep);
      return segments[0] ?? "";
    };
    const files = await walkPath(installPath);
    const smapiModIds = getSMAPIMods(api).map((mod) => mod.id);
    const isSMAPI = (file) => isSmapiInternalPath(file.filePath) || smapiModIds.some((modId) => file.filePath.includes(modId));
    const filtered = files.reduce((accum, file) => {
      if (isSMAPI(file)) {
        return accum;
      }
      if (import_path3.default.basename(file.filePath).toLowerCase() !== MOD_CONFIG) {
        return accum;
      }
      if (import_path3.default.dirname(file.filePath).includes(configMod.configModPath)) {
        return accum;
      }
      const candidateName = resolveCandidateName(file);
      if (candidateName === "") {
        return accum;
      }
      if (!import_vortex_api12.util.getSafe(profile, ["modState", candidateName, "enabled"], false)) {
        return accum;
      }
      accum.push({ filePath: file.filePath, candidates: [candidateName] });
      return accum;
    }, []);
    await addModConfig(api, filtered, profile.id, installPath);
    await emitLifecycleEvent(api, "deploy-mods");
  } catch (err) {
    api.showErrorNotification?.("Failed to sync mod configurations", err);
  }
}
async function addModConfig(api, files, profileId, modsPath) {
  const configMod = await initializeConfigMod(api, profileId);
  if (configMod === void 0) {
    return;
  }
  const state = api.getState();
  const discovery = import_vortex_api12.selectors.discoveryByGame(state, GAME_ID);
  const isInstallPath = modsPath !== void 0;
  const resolvedModsPath = modsPath ?? (discovery?.path !== void 0 ? import_path3.default.join(discovery.path, MODS_REL_PATH) : void 0);
  if (resolvedModsPath === void 0) {
    return;
  }
  if (findSMAPITool(api) === void 0) {
    return;
  }
  const configModAttributes = extractConfigModAttributes(state, configMod.mod.id);
  const nextAttributes = Array.from(new Set(configModAttributes));
  for (const file of files) {
    const primaryCandidate = file.candidates[0];
    if (primaryCandidate === void 0 || isSmapiInternalPath(file.filePath)) {
      continue;
    }
    api.sendNotification?.({
      type: "activity",
      id: NOTIF_ACTIVITY_CONFIG_MOD,
      title: "Importing config files...",
      message: primaryCandidate
    });
    if (!configModAttributes.includes(primaryCandidate)) {
      nextAttributes.push(primaryCandidate);
    }
    try {
      const installRelPath = import_path3.default.relative(resolvedModsPath, file.filePath);
      const segments = installRelPath.split(import_path3.default.sep);
      const relPath = isInstallPath ? segments.slice(1).join(import_path3.default.sep) : installRelPath;
      const targetPath = import_path3.default.join(configMod.configModPath, relPath);
      const targetDir = import_path3.default.extname(targetPath) !== "" ? import_path3.default.dirname(targetPath) : targetPath;
      await import_vortex_api12.fs.ensureDirWritableAsync(targetDir);
      (0, import_vortex_api12.log)("debug", "importing config file from", {
        source: file.filePath,
        destination: targetPath,
        modId: primaryCandidate
      });
      await import_vortex_api12.fs.copyAsync(file.filePath, targetPath, { overwrite: true });
      await import_vortex_api12.fs.removeAsync(file.filePath);
    } catch (err) {
      api.showErrorNotification?.("Failed to write mod config", err);
    }
  }
  api.dismissNotification?.(NOTIF_ACTIVITY_CONFIG_MOD);
  setConfigModAttribute(api, configMod.mod.id, Array.from(new Set(nextAttributes)));
}
function emitLifecycleEvent(api, eventType) {
  return new Promise((resolve, reject) => {
    const cb = (err) => err !== null ? reject(err) : resolve();
    if (eventType === "purge-mods") {
      api.events.emit(eventType, false, cb);
      return;
    }
    api.events.emit(eventType, cb);
  });
}

// extensions/games/game-stardewvalley/configMod/ingest.ts
async function onAddedFilesImpl(api, profileId, files) {
  const state = api.store?.getState();
  if (state === void 0) {
    return;
  }
  const profile = import_vortex_api13.selectors.profileById(state, profileId);
  if (profile?.gameId !== GAME_ID) {
    return;
  }
  if (findSMAPITool(api) === void 0) {
    return;
  }
  const mergeConfigs = selectMergeConfigsEnabled(state, profile.id);
  const routed = files.reduce((accum, file) => {
    if (mergeConfigs && !isSmapiInternalPath(file.filePath) && import_path4.default.basename(file.filePath).toLowerCase() === MOD_CONFIG) {
      accum.configs.push(file);
    } else {
      accum.regulars.push(file);
    }
    return accum;
  }, { configs: [], regulars: [] });
  await Promise.all([
    addConfigFiles(api, profileId, routed.configs),
    addRegularFiles(api, routed.regulars)
  ]);
}
async function addConfigFiles(api, profileId, files) {
  if (files.length === 0) {
    return;
  }
  api.sendNotification?.({
    type: "activity",
    id: NOTIF_ACTIVITY_CONFIG_MOD,
    title: "Importing config files...",
    message: "Starting up..."
  });
  await addModConfig(api, files, profileId);
}
async function addRegularFiles(api, files) {
  if (files.length === 0) {
    return;
  }
  const state = api.getState();
  const game = import_vortex_api13.util.getGame(GAME_ID);
  const discovery = import_vortex_api13.selectors.discoveryByGame(state, GAME_ID);
  if (game.getModPaths === void 0 || discovery?.path === void 0) {
    return;
  }
  const modPaths = game.getModPaths(discovery.path);
  const installPath = import_vortex_api13.selectors.installPathForGame(state, GAME_ID);
  for (const entry of files) {
    if (entry.candidates.length !== 1) {
      continue;
    }
    const candidateId = entry.candidates[0];
    if (candidateId === void 0) {
      continue;
    }
    const mod = import_vortex_api13.util.getSafe(state.persistent.mods, [GAME_ID, candidateId], void 0);
    if (!isModCandidateValid(mod, entry)) {
      continue;
    }
    const from = modPaths[mod.type];
    if (from === void 0) {
      (0, import_vortex_api13.log)("error", "failed to resolve mod path for mod type", mod.type);
      continue;
    }
    const relPath = import_path4.default.relative(from, entry.filePath);
    const targetPath = import_path4.default.join(installPath, mod.id, relPath);
    try {
      await import_vortex_api13.fs.ensureDirWritableAsync(import_path4.default.dirname(targetPath));
      await import_vortex_api13.fs.copyAsync(entry.filePath, targetPath);
      await import_vortex_api13.fs.removeAsync(entry.filePath);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes("are the same file")) {
        (0, import_vortex_api13.log)("error", "failed to re-import added file to mod", message);
      }
    }
  }
}

// extensions/games/game-stardewvalley/configMod/transitions.ts
var import_path5 = __toESM(require("path"));
var import_vortex_api14 = require("vortex-api");
async function onWillEnableModsImpl(api, profileId, modIds, enabled, options) {
  const state = api.getState();
  const profile = import_vortex_api14.selectors.profileById(state, profileId);
  if (profile?.gameId !== GAME_ID) {
    return;
  }
  if (enabled) {
    await onSyncModConfigurations(api, true, profileId);
    return;
  }
  const configMod = await initializeConfigMod(api, profileId);
  if (configMod === void 0) {
    return;
  }
  if (modIds.includes(configMod.mod.id)) {
    await onRevertFilesImpl(api, profileId);
    return;
  }
  if (options?.installed || options?.willBeReplaced) {
    return;
  }
  const attributes = extractConfigModAttributes(state, configMod.mod.id);
  const relevantModIds = modIds.filter((id) => attributes.includes(id));
  if (relevantModIds.length === 0) {
    return;
  }
  const installPath = import_vortex_api14.selectors.installPathForGame(state, GAME_ID);
  const mods = selectSdvMods(state);
  for (const modId of relevantModIds) {
    const mod = mods[modId];
    if (!mod?.installationPath) {
      continue;
    }
    const modPath = import_path5.default.join(installPath, mod.installationPath);
    const files = await walkPath(modPath, {
      skipLinks: true,
      skipHidden: true,
      skipInaccessible: true
    });
    const manifestFile = files.find((file) => import_path5.default.basename(file.filePath) === MOD_MANIFEST);
    if (manifestFile === void 0) {
      continue;
    }
    const relPath = import_path5.default.relative(modPath, import_path5.default.dirname(manifestFile.filePath));
    const modConfigFilePath = import_path5.default.join(configMod.configModPath, relPath, MOD_CONFIG);
    await import_vortex_api14.fs.copyAsync(modConfigFilePath, import_path5.default.join(modPath, relPath, MOD_CONFIG), { overwrite: true }).catch(() => null);
    try {
      await applyToConfigMod(api, profileId, () => deleteFolder(import_path5.default.dirname(modConfigFilePath)));
    } catch (err) {
      api.showErrorNotification?.("Failed to write mod config", err);
      return;
    }
  }
  removeConfigModAttributes(api, configMod.mod, relevantModIds);
}
async function onRevertFilesImpl(api, profileId) {
  const state = api.getState();
  const profile = import_vortex_api14.selectors.profileById(state, profileId);
  if (profile?.gameId !== GAME_ID) {
    return;
  }
  const configMod = await initializeConfigMod(api, profileId);
  if (configMod === void 0) {
    return;
  }
  const attributes = extractConfigModAttributes(state, configMod.mod.id);
  if (attributes.length === 0) {
    return;
  }
  await onWillEnableModsImpl(api, profileId, attributes, false);
}
async function applyToConfigMod(api, profileId, cb) {
  try {
    const configMod = await initializeConfigMod(api, profileId);
    if (configMod === void 0) {
      return;
    }
    await api.emitAndAwait("deploy-single-mod", GAME_ID, configMod.mod.id, false);
    await cb();
    await api.emitAndAwait("deploy-single-mod", GAME_ID, configMod.mod.id, true);
  } catch (err) {
    api.showErrorNotification?.("Failed to write mod config", err);
  }
}

// extensions/games/game-stardewvalley/configMod/index.ts
function registerConfigMod(context) {
  context.registerAction(
    "mod-icons",
    999,
    "swap",
    {},
    "Sync Mod Configurations",
    () => {
      void onSyncModConfigurations(context.api);
    },
    () => {
      const state = context.api.store?.getState();
      if (state === void 0) {
        return false;
      }
      return import_vortex_api15.selectors.activeGameId(state) === GAME_ID;
    }
  );
}
async function onWillEnableMods(api, profileId, modIds, enabled, options) {
  return onWillEnableModsImpl(api, profileId, modIds, enabled, options);
}
async function onRevertFiles(api, profileId) {
  return onRevertFilesImpl(api, profileId);
}
async function onAddedFiles(api, profileId, files) {
  return onAddedFilesImpl(api, profileId, files);
}

// extensions/games/game-stardewvalley/game/StardewValleyGame.ts
var import_path8 = __toESM(require("path"));
var import_vortex_api17 = require("vortex-api");

// extensions/games/game-stardewvalley/helpers.ts
var import_bluebird = __toESM(require("bluebird"));
function toBlue(func) {
  return (...args) => import_bluebird.default.resolve(func(...args));
}
function errorMessage(err) {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  if (typeof err === "number" || typeof err === "boolean" || typeof err === "bigint") {
    return `${err}`;
  }
  if (typeof err === "symbol") {
    return err.toString();
  }
  if (err === null) {
    return "null";
  }
  if (err === void 0) {
    return "undefined";
  }
  if (typeof err === "function") {
    return err.toString();
  }
  try {
    return err.toString();
  } catch (_err) {
    return Object.prototype.toString.call(err);
  }
}

// extensions/games/game-stardewvalley/installers/smapiInstaller.ts
var import_bluebird2 = __toESM(require("bluebird"));
var import_path7 = __toESM(require("path"));
var import_vortex_api16 = require("vortex-api");

// extensions/games/game-stardewvalley/installers/archiveClassifier.ts
var import_path6 = __toESM(require("path"));
function classifyArchive(files, gameId) {
  return {
    isGameArchive: gameId === GAME_ID,
    hasManifest: hasManifest(files),
    hasContentFolder: hasContentFolder(files),
    hasSmapiInstallerDll: hasSmapiInstallerDll(files)
  };
}
function makeInstallerTestResult(supported) {
  return {
    supported,
    requiredFiles: []
  };
}
function withFakePrefix(filePath) {
  return import_path6.default.join("fakeDir", filePath);
}
function hasContentFolder(files) {
  return files.filter((file) => file.endsWith(import_path6.default.sep)).map(withFakePrefix).some((file) => file.endsWith(PTRN_CONTENT));
}
function hasManifest(files, manifestFileName = MOD_MANIFEST) {
  const manifestName = manifestFileName.toLowerCase();
  return files.some((filePath) => {
    const segments = filePath.toLowerCase().split(import_path6.default.sep);
    const isManifestFile = segments[segments.length - 1] === manifestName;
    const isLocale = segments.includes("locale");
    return isManifestFile && !isLocale;
  });
}
function hasSmapiInstallerDll(files) {
  return files.some((file) => import_path6.default.basename(file).toLowerCase() === SMAPI_INSTALLER_DLL);
}
var PTRN_CONTENT = import_path6.default.sep + "Content" + import_path6.default.sep;
var SMAPI_INSTALLER_DLL = "smapi.installer.dll";

// extensions/games/game-stardewvalley/installers/smapiInstaller.ts
var SMAPI_EXE = "StardewModdingAPI.exe";
function isSMAPIModType(instructions) {
  const smapiData = instructions.find((inst) => inst.type === "copy" && typeof inst.source === "string" && inst.source.endsWith(SMAPI_EXE));
  return import_bluebird2.default.resolve(smapiData !== void 0);
}
function testSMAPI(files, gameId) {
  const archiveInfo = classifyArchive(files, gameId);
  const supported = archiveInfo.isGameArchive && archiveInfo.hasSmapiInstallerDll;
  return import_bluebird2.default.resolve(makeInstallerTestResult(supported));
}
async function installSMAPI(getGameInstallPath, files, destinationPath) {
  const folder = process.platform === "win32" ? "windows" : process.platform === "linux" ? "linux" : "macos";
  const fileHasCorrectPlatform = (file) => {
    const segments = file.split(import_path7.default.sep).map((seg) => seg.toLowerCase());
    return segments.includes(folder);
  };
  const dataFile = files.find((file) => {
    const isCorrectPlatform = fileHasCorrectPlatform(file);
    return isCorrectPlatform && SMAPI_DATA.includes(import_path7.default.basename(file).toLowerCase());
  });
  if (dataFile === void 0) {
    return Promise.reject(new import_vortex_api16.util.DataInvalid("Failed to find the SMAPI data files - download appears to be corrupted; please re-download SMAPI and try again"));
  }
  let data = "";
  try {
    data = await import_vortex_api16.fs.readFileAsync(import_path7.default.join(getGameInstallPath(), "Stardew Valley.deps.json"), { encoding: "utf8" });
  } catch (err) {
    (0, import_vortex_api16.log)("error", "failed to parse SDV dependencies", err);
  }
  const updatedFiles = [];
  const szip = new import_vortex_api16.util.SevenZip();
  await szip.extractFull(import_path7.default.join(destinationPath, dataFile), destinationPath);
  await import_vortex_api16.util.walk(destinationPath, (iter, stats) => {
    const relPath = import_path7.default.relative(destinationPath, iter);
    if (!files.includes(relPath) && stats.isFile() && !files.includes(relPath + import_path7.default.sep)) updatedFiles.push(relPath);
    const segments = relPath.toLocaleLowerCase().split(import_path7.default.sep);
    const modsFolderIdx = segments.indexOf("mods");
    if (modsFolderIdx !== -1) {
      const bundledMod = segments[modsFolderIdx + 1];
      if (bundledMod !== void 0) {
        _SMAPI_BUNDLED_MODS.push(bundledMod);
      }
    }
    return import_bluebird2.default.resolve();
  });
  const smapiExe = updatedFiles.find((file) => file.toLowerCase().endsWith(SMAPI_EXE.toLowerCase()));
  if (smapiExe === void 0) {
    return Promise.reject(new import_vortex_api16.util.DataInvalid(`Failed to extract ${SMAPI_EXE} - download appears to be corrupted; please re-download SMAPI and try again`));
  }
  const idx = smapiExe.indexOf(import_path7.default.basename(smapiExe));
  const instructions = updatedFiles.map((file) => {
    return {
      type: "copy",
      source: file,
      destination: import_path7.default.join(file.substr(idx))
    };
  });
  instructions.push({
    type: "attribute",
    key: "smapiBundledMods",
    value: getBundledMods()
  });
  instructions.push({
    type: "generatefile",
    data,
    destination: "StardewModdingAPI.deps.json"
  });
  return Promise.resolve({ instructions });
}
var SMAPI_DATA = ["windows-install.dat", "install.dat"];

// extensions/games/game-stardewvalley/game/StardewValleyGame.ts
var StardewValleyGame = class {
  /**
   * Construct an instance.
   * @param context The Vortex extension context.
   */
  constructor(context) {
    this.id = GAME_ID;
    this.name = "Stardew Valley";
    this.logo = "assets/gameart.jpg";
    this.environment = {
      SteamAPPId: "413150"
    };
    this.details = {
      steamAppId: 413150
    };
    this.supportedTools = [
      {
        id: "smapi",
        name: "SMAPI",
        logo: "assets/smapi.png",
        executable: () => SMAPI_EXE,
        requiredFiles: [SMAPI_EXE],
        shell: true,
        exclusive: true,
        relative: true,
        defaultPrimary: true
      }
    ];
    this.mergeMods = true;
    this.requiresCleanup = true;
    // Whether to boot the game through a shell.
    this.shell = process.platform === "win32";
    /**
     * Query known stores/default locations for the install path.
     */
    this.queryPath = toBlue(async () => {
      const game = await import_vortex_api17.util.GameStoreHelper.findByAppId([
        "413150",
        "1453375253",
        "ConcernedApe.StardewValleyPC"
      ]).catch(() => void 0);
      if (game !== void 0) {
        return game.gamePath;
      }
      for (const defaultPath of this.defaultPaths) {
        if (await this.getPathExistsAsync(defaultPath)) {
          return defaultPath;
        }
      }
      throw new Error("Stardew Valley install path not found");
    });
    /**
     * Runs when Stardew Valley is selected in Vortex.
     * Ensures the Mods folder is writable and, if SMAPI is missing from the
     * game install folder, shows an install/deploy recommendation.
     */
    this.setup = toBlue(async (discovery) => {
      try {
        await import_vortex_api17.fs.ensureDirWritableAsync(import_path8.default.join(discovery.path, MODS_REL_PATH));
      } catch (err) {
        return Promise.reject(err);
      }
      const smapiPath = import_path8.default.join(discovery.path, SMAPI_EXE);
      const smapiFound = await this.getPathExistsAsync(smapiPath);
      if (!smapiFound) {
        this.recommendSmapi();
      }
    });
    this.context = context;
    this.requiredFiles = process.platform == "win32" ? ["Stardew Valley.exe"] : ["StardewValley"];
    this.defaultPaths = [
      // Linux
      process.env.HOME + "/GOG Games/Stardew Valley/game",
      process.env.HOME + "/.local/share/Steam/steamapps/common/Stardew Valley",
      // Mac
      "/Applications/Stardew Valley.app/Contents/MacOS",
      process.env.HOME + "/Library/Application Support/Steam/steamapps/common/Stardew Valley/Contents/MacOS",
      // Windows
      "C:\\Program Files (x86)\\GalaxyClient\\Games\\Stardew Valley",
      "C:\\Program Files (x86)\\GOG Galaxy\\Games\\Stardew Valley",
      "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stardew Valley"
    ];
  }
  executable() {
    return process.platform == "win32" ? "Stardew Valley.exe" : "StardewValley";
  }
  queryModPath() {
    return MODS_REL_PATH;
  }
  /**
   * Shows a SMAPI warning with a one-click Deploy/Get action.
   */
  recommendSmapi() {
    const smapiMod = findSMAPIMod(this.context.api);
    const title = smapiMod ? "SMAPI is not deployed" : "SMAPI is not installed";
    const actionTitle = smapiMod ? "Deploy" : "Get SMAPI";
    const action = () => (smapiMod ? deploySMAPI(this.context.api) : downloadAndInstallSMAPI(this.context.api)).then(() => this.context.api.dismissNotification?.("smapi-missing"));
    this.context.api.sendNotification?.({
      id: "smapi-missing",
      type: "warning",
      title,
      message: "SMAPI is required to mod Stardew Valley.",
      actions: [
        {
          title: actionTitle,
          action
        }
      ]
    });
  }
  /**
   * Asynchronously check whether a file or directory path exists.
   */
  async getPathExistsAsync(inputPath) {
    try {
      await import_vortex_api17.fs.statAsync(inputPath);
      return true;
    } catch (err) {
      return false;
    }
  }
};

// extensions/games/game-stardewvalley/manifests/createManifestAttributeExtractor.ts
var semver3 = __toESM(require("semver"));
var import_vortex_api19 = require("vortex-api");

// extensions/games/game-stardewvalley/manifests/getModManifests.ts
var import_path9 = __toESM(require("path"));
var import_turbowalk2 = __toESM(require("turbowalk"));
function getModManifests(modPath) {
  const manifests = [];
  if (modPath === void 0) {
    return Promise.resolve([]);
  }
  return (0, import_turbowalk2.default)(modPath, async (entries) => {
    for (const entry of entries) {
      if (import_path9.default.basename(entry.filePath) === MOD_MANIFEST) {
        manifests.push(entry.filePath);
      }
    }
  }, { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true }).then(() => manifests);
}

// extensions/games/game-stardewvalley/manifests/parseManifest.ts
var import_relaxed_json = require("relaxed-json");
var import_vortex_api18 = require("vortex-api");
async function parseManifest(manifestFilePath) {
  try {
    const manifestData = await import_vortex_api18.fs.readFileAsync(manifestFilePath, { encoding: "utf-8" });
    const manifest = (0, import_relaxed_json.parse)(import_vortex_api18.util.deBOM(manifestData));
    if (!manifest) {
      throw new import_vortex_api18.util.DataInvalid("Manifest file is invalid");
    }
    return manifest;
  } catch (err) {
    return Promise.reject(err);
  }
}

// extensions/games/game-stardewvalley/manifests/createManifestAttributeExtractor.ts
function createManifestAttributeExtractor(context) {
  return toBlue(async (modInfo, modPath) => {
    if (import_vortex_api19.selectors.activeGameId(context.api.getState()) !== GAME_ID) {
      return Promise.resolve({});
    }
    const manifests = await getModManifests(modPath);
    const parsedManifests = (await Promise.all(manifests.map(
      async (manifest) => {
        try {
          return await parseManifest(manifest);
        } catch (err) {
          (0, import_vortex_api19.log)("warn", "Failed to parse manifest", { manifestFile: manifest, error: errorMessage(err) });
          return void 0;
        }
      }
    ))).filter((manifest) => manifest !== void 0);
    if (parsedManifests.length === 0) {
      return Promise.resolve({});
    }
    const refManifest = parsedManifests[0];
    const additionalLogicalFileNames = parsedManifests.filter((manifest) => manifest.UniqueID !== void 0).map((manifest) => manifest.UniqueID.toLowerCase());
    const minSMAPIVersion = parsedManifests.map((manifest) => manifest.MinimumApiVersion).filter((version) => semver3.valid(version)).sort((lhs, rhs) => semver3.compare(rhs, lhs))[0];
    const result = {
      additionalLogicalFileNames,
      minSMAPIVersion
    };
    if (refManifest !== void 0) {
      if (modInfo.download.modInfo?.nexus?.ids?.modId !== SMAPI_MOD_ID) {
        result["customFileName"] = refManifest.Name;
      }
      if (typeof refManifest.Version === "string") {
        result["manifestVersion"] = refManifest.Version;
      }
    }
    return Promise.resolve(result);
  });
}

// extensions/games/game-stardewvalley/manifests/ModManifestCache.ts
var import_turbowalk3 = __toESM(require("turbowalk"));
var import_vortex_api20 = require("vortex-api");
var import_path10 = __toESM(require("path"));
var ModManifestCache = class {
  constructor(api) {
    this.mLoading = false;
    this.mApi = api;
  }
  async getManifests() {
    await this.scanManifests();
    return this.mManifests ?? {};
  }
  async refresh() {
    if (this.mLoading) {
      return;
    }
    this.mLoading = true;
    await this.scanManifests(true);
    this.mLoading = false;
  }
  async scanManifests(force) {
    if (!force && this.mManifests !== void 0) {
      return;
    }
    const state = this.mApi.getState();
    const staging = import_vortex_api20.selectors.installPathForGame(state, GAME_ID);
    const profileId = import_vortex_api20.selectors.lastActiveProfileForGame(state, GAME_ID);
    const profile = import_vortex_api20.selectors.profileById(state, profileId);
    const isInstalled = (mod) => mod?.state === "installed";
    const isActive = (modId) => import_vortex_api20.util.getSafe(profile, ["modState", modId, "enabled"], false);
    const mods = selectSdvMods(state);
    const manifests = await Object.values(mods).reduce(async (accumP, iter) => {
      const accum = await accumP;
      if (!isInstalled(iter) || !isActive(iter.id)) {
        return Promise.resolve(accum);
      }
      const modPath = import_path10.default.join(staging, iter.installationPath);
      return (0, import_turbowalk3.default)(modPath, async (entries) => {
        for (const entry of entries) {
          if (import_path10.default.basename(entry.filePath) === MOD_MANIFEST) {
            let manifest;
            try {
              manifest = await parseManifest(entry.filePath);
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              (0, import_vortex_api20.log)("error", "failed to parse manifest", { error: message, manifest: entry.filePath });
              continue;
            }
            const list = accum[iter.id] ?? [];
            list.push(manifest);
            accum[iter.id] = list;
          }
        }
      }, { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true }).then(() => Promise.resolve(accum)).catch((err) => {
        if (err["code"] === "ENOENT") {
          return Promise.resolve([]);
        } else {
          return Promise.reject(err);
        }
      });
    }, {});
    this.mManifests = manifests;
    return Promise.resolve();
  }
};

// extensions/games/game-stardewvalley/registration/registerInstallers.ts
var import_bluebird5 = __toESM(require("bluebird"));

// extensions/games/game-stardewvalley/installers/rootFolderInstaller.ts
var import_bluebird3 = __toESM(require("bluebird"));
var import_path11 = __toESM(require("path"));
function testRootFolder(files, gameId) {
  const archiveInfo = classifyArchive(files, gameId);
  const supported = archiveInfo.isGameArchive && archiveInfo.hasContentFolder;
  return import_bluebird3.default.resolve(makeInstallerTestResult(supported));
}
function installRootFolder(files, destinationPath) {
  const contentFile = files.find((file) => import_path11.default.join("fakeDir", file).endsWith(PTRN_CONTENT2));
  if (contentFile === void 0) {
    return import_bluebird3.default.resolve({ instructions: [] });
  }
  const idx = contentFile.indexOf(PTRN_CONTENT2) + 1;
  const rootDir = import_path11.default.basename(contentFile.substring(0, idx));
  const filtered = files.filter((file) => !file.endsWith(import_path11.default.sep) && file.indexOf(rootDir) !== -1 && import_path11.default.extname(file) !== ".txt");
  const instructions = filtered.map((file) => {
    return {
      type: "copy",
      source: file,
      destination: file.substr(idx)
    };
  });
  return import_bluebird3.default.resolve({ instructions });
}
var PTRN_CONTENT2 = import_path11.default.sep + "Content" + import_path11.default.sep;

// extensions/games/game-stardewvalley/installers/stardewValleyInstaller.ts
var import_bluebird4 = __toESM(require("bluebird"));
var import_path12 = __toESM(require("path"));
var import_vortex_api21 = require("vortex-api");
function testSupported(files, gameId) {
  const archiveInfo = classifyArchive(files, gameId);
  const supported = archiveInfo.isGameArchive && archiveInfo.hasManifest && !archiveInfo.hasContentFolder;
  return import_bluebird4.default.resolve(makeInstallerTestResult(supported));
}
async function installStardewValley(api, files, destinationPath) {
  const manifestFiles = files.filter(isValidManifest);
  let parseError;
  const scannedMods = await Promise.all(manifestFiles.map(async (manifestFile) => {
    const rootFolder = import_path12.default.dirname(manifestFile);
    const rootSegments = rootFolder.toLowerCase().split(import_path12.default.sep);
    const manifestIndex = manifestFile.toLowerCase().indexOf(MOD_MANIFEST);
    const filterFunc = (file) => {
      const isFile = !file.endsWith(import_path12.default.sep) && import_path12.default.extname(import_path12.default.basename(file)) !== "";
      const fileSegments = file.toLowerCase().split(import_path12.default.sep);
      const isInRootFolder = rootSegments.length > 0 ? fileSegments?.[rootSegments.length - 1] === rootSegments[rootSegments.length - 1] : true;
      return isInRootFolder && isFile;
    };
    try {
      const manifest = await parseManifest(import_path12.default.join(destinationPath, manifestFile));
      const modFiles = files.filter(filterFunc);
      return {
        manifest,
        rootFolder,
        manifestIndex,
        modFiles
      };
    } catch (err) {
      const parsedErr = err instanceof Error ? err : new Error(String(err));
      (0, import_vortex_api21.log)("warn", "Failed to parse manifest", { manifestFile, error: parsedErr.message });
      parseError = parsedErr;
      return void 0;
    }
  }));
  const mods = scannedMods.filter((mod) => mod !== void 0);
  if (mods.length === 0) {
    api.showErrorNotification?.(
      `The mod manifest is invalid and can't be read. You can try to install the mod anyway via right-click -> "Unpack (as-is)"`,
      parseError ?? new Error("Unknown manifest parse error"),
      {
        allowReport: false
      }
    );
  }
  return import_bluebird4.default.map(mods, (mod) => {
    const modName = mod.rootFolder !== "." ? mod.rootFolder : mod.manifest.Name ?? mod.rootFolder;
    if (modName === void 0) {
      return [];
    }
    const dependencies = mod.manifest.Dependencies || [];
    const instructions = [];
    for (const file of mod.modFiles) {
      const destination = import_path12.default.join(modName, file.substr(mod.manifestIndex));
      instructions.push({
        type: "copy",
        source: file,
        destination
      });
    }
    const addRuleForDependency = (dep) => {
      if (dep.UniqueID === void 0 || dep.UniqueID.toLowerCase() === "yourname.yourotherspacksandmods") {
        return;
      }
      const versionMatch = dep.MinimumVersion !== void 0 ? `>=${dep.MinimumVersion}` : "*";
      const rule = {
        // treating all dependencies as recommendations because the dependency information
        // provided by some mod authors is a bit hit-and-miss and Vortex fairly aggressively
        // enforces requirements
        // type: (dep.IsRequired ?? true) ? 'requires' : 'recommends',
        type: "recommends",
        reference: {
          logicalFileName: dep.UniqueID.toLowerCase(),
          versionMatch
        },
        extra: {
          onlyIfFulfillable: true,
          automatic: true
        }
      };
      instructions.push({
        type: "rule",
        rule
      });
    };
    return instructions;
  }).then((data) => {
    const instructions = data.reduce((accum, iter) => accum.concat(iter), []);
    return Promise.resolve({ instructions });
  });
}
function isValidManifest(filePath) {
  const segments = filePath.toLowerCase().split(import_path12.default.sep);
  const isManifestFile = segments[segments.length - 1] === MOD_MANIFEST;
  const isLocale = segments.includes("locale");
  return isManifestFile && !isLocale;
}

// extensions/games/game-stardewvalley/registration/registerInstallers.ts
function registerInstallers(context, getGameInstallPath) {
  context.registerInstaller(
    INSTALLER_ID_SMAPI,
    INSTALLER_PRIORITY_SMAPI,
    testSMAPI,
    (files, destinationPath) => import_bluebird5.default.resolve(installSMAPI(getGameInstallPath, files, destinationPath))
  );
  context.registerInstaller(INSTALLER_ID_ROOT, INSTALLER_PRIORITY_ROOT, testRootFolder, installRootFolder);
  context.registerInstaller(
    INSTALLER_ID_MANIFEST,
    INSTALLER_PRIORITY_MANIFEST,
    testSupported,
    (files, destinationPath) => import_bluebird5.default.resolve(
      installStardewValley(context.api, files, destinationPath)
    )
  );
}

// extensions/games/game-stardewvalley/registration/registerModTypes.ts
var import_bluebird7 = __toESM(require("bluebird"));
var import_path14 = __toESM(require("path"));

// extensions/games/game-stardewvalley/modtypes/sdvRootFolderMatcher.ts
var import_bluebird6 = __toESM(require("bluebird"));
var import_path13 = __toESM(require("path"));
function isSdvRootFolderModType(instructions) {
  const copyInstructions = instructions.filter((instr) => instr.type === "copy");
  const hasManifest2 = copyInstructions.some((instr) => instr.destination?.endsWith(MOD_MANIFEST) === true);
  const hasModsFolder = copyInstructions.some((instr) => instr.destination?.startsWith(MODS_REL_PATH + import_path13.default.sep) === true);
  const hasContentFolder2 = copyInstructions.some((instr) => instr.destination?.startsWith("Content" + import_path13.default.sep) === true);
  return hasManifest2 ? import_bluebird6.default.resolve(hasContentFolder2 && hasModsFolder) : import_bluebird6.default.resolve(hasContentFolder2);
}

// extensions/games/game-stardewvalley/registration/registerModTypes.ts
function registerModTypes(context, getGameInstallPath, getSMAPIPath) {
  context.registerModType(
    MOD_TYPE_SMAPI,
    MOD_TYPE_PRIORITY_SMAPI,
    (gameId) => gameId === GAME_ID,
    getSMAPIPath,
    isSMAPIModType
  );
  context.registerModType(
    MOD_TYPE_CONFIG,
    MOD_TYPE_PRIORITY_CONFIG,
    (gameId) => gameId === GAME_ID,
    () => import_path14.default.join(getGameInstallPath(), MODS_REL_PATH),
    () => import_bluebird7.default.resolve(false)
  );
  context.registerModType(
    MOD_TYPE_ROOT,
    MOD_TYPE_PRIORITY_ROOT,
    (gameId) => gameId === GAME_ID,
    () => getGameInstallPath(),
    isSdvRootFolderModType
  );
}

// extensions/games/game-stardewvalley/registration/registerTests.ts
var import_bluebird8 = __toESM(require("bluebird"));

// extensions/games/game-stardewvalley/tests.ts
var import_semver2 = require("semver");
var import_vortex_api22 = require("vortex-api");
async function testSMAPIOutdated(api, modManifestCache) {
  const state = api.getState();
  const activeGameId = import_vortex_api22.selectors.activeGameId(state);
  if (activeGameId !== GAME_ID) {
    return Promise.resolve(void 0);
  }
  let currentSMAPIVersion = findSMAPIMod(api)?.attributes?.version;
  if (currentSMAPIVersion === void 0) {
    return Promise.resolve(void 0);
  }
  const isSmapiOutdated = async () => {
    currentSMAPIVersion = findSMAPIMod(api)?.attributes?.version;
    if (currentSMAPIVersion === void 0) {
      return false;
    }
    const installedVersion = currentSMAPIVersion;
    const enabledManifests = await modManifestCache.getManifests();
    const incompatibleModIds = [];
    for (const [id, manifests] of Object.entries(enabledManifests)) {
      const incompatible = manifests.filter((iter) => {
        if (iter.MinimumApiVersion !== void 0) {
          const minApiVersion = (0, import_semver2.coerce)(iter.MinimumApiVersion ?? "0.0.0");
          if (minApiVersion === null) {
            return false;
          }
          return !(0, import_semver2.gte)(installedVersion, minApiVersion);
        }
        return false;
      });
      if (incompatible.length > 0) {
        incompatibleModIds.push(id);
      }
    }
    return Promise.resolve(incompatibleModIds.length > 0);
  };
  const outdated = await isSmapiOutdated();
  const t = api.translate;
  return outdated ? Promise.resolve({
    description: {
      short: t("SMAPI update required"),
      long: t("Some Stardew Valley mods require a newer version of SMAPI to function correctly, you should check for SMAPI updates in the mods page.")
    },
    automaticFix: () => downloadAndInstallSMAPI(api, true),
    onRecheck: () => isSmapiOutdated(),
    severity: "warning"
  }) : Promise.resolve(void 0);
}

// extensions/games/game-stardewvalley/registration/registerTests.ts
function registerTests(context, modManifestCache) {
  context.registerTest(
    "sdv-incompatible-mods",
    "gamemode-activated",
    () => import_bluebird8.default.resolve(testSMAPIOutdated(context.api, modManifestCache))
  );
}

// extensions/games/game-stardewvalley/registration/registerUi.ts
var import_react3 = __toESM(require("react"));
var import_vortex_api26 = require("vortex-api");

// extensions/games/game-stardewvalley/ui/CompatibilityIcon.tsx
var import_react = __toESM(require("react"));
var import_vortex_api23 = require("vortex-api");
function CompatibilityIcon(props) {
  const { t, mod } = props;
  const version = mod.attributes?.manifestVersion ?? mod.attributes?.version;
  if (mod.attributes?.compatibilityUpdate !== void 0 && mod.attributes?.compatibilityUpdate !== version) {
    return /* @__PURE__ */ import_react.default.createElement(
      import_vortex_api23.tooltip.Icon,
      {
        name: "auto-update",
        tooltip: t("SMAPI suggests updating this mod to {{update}}. Please use Vortex to check for mod updates", {
          replace: {
            update: mod.attributes?.compatibilityUpdate
          }
        })
      }
    );
  }
  const status = (mod.attributes?.compatibilityStatus ?? "unknown").toLowerCase();
  const icon = iconMap[status] ?? iconMap["unknown"];
  return /* @__PURE__ */ import_react.default.createElement(
    import_vortex_api23.tooltip.Icon,
    {
      className: `sdv-compatibility-${status}`,
      name: icon,
      tooltip: mod.attributes?.compatibilityMessage ?? t("No information")
    }
  );
}
var iconMap = {
  broken: "feedback-error",
  obsolete: "feedback-error",
  abandoned: "feedback-warning",
  unofficial: "feedback-warning",
  workaround: "feedback-warning",
  unknown: "feedback-info",
  optional: "feedback-success",
  ok: "feedback-success"
};

// extensions/games/game-stardewvalley/ui/Settings.tsx
var import_react2 = __toESM(require("react"));
var import_react_bootstrap = require("react-bootstrap");
var import_react_i18next = require("react-i18next");
var import_react_redux = require("react-redux");
var import_vortex_api24 = require("vortex-api");
function Settings(props) {
  const { onMergeConfigToggle } = props;
  const sdvSettings = (0, import_react_redux.useSelector)((state) => state.settings["SDV"]);
  const { useRecommendations, mergeConfigs } = sdvSettings;
  const store = (0, import_react_redux.useStore)();
  const { profileId } = (0, import_react_redux.useSelector)(mapStateToProps);
  const setUseRecommendations = import_react2.default.useCallback((enabled) => {
    store.dispatch(setRecommendations(enabled));
  }, []);
  const setMergeConfigSetting = import_react2.default.useCallback((enabled) => {
    onMergeConfigToggle(profileId, enabled);
  }, [onMergeConfigToggle, profileId]);
  const { t } = (0, import_react_i18next.useTranslation)();
  const mergeEnabled = mergeConfigs?.[profileId];
  return /* @__PURE__ */ import_react2.default.createElement("form", null, /* @__PURE__ */ import_react2.default.createElement(import_react_bootstrap.FormGroup, { controlId: "default-enable" }, /* @__PURE__ */ import_react2.default.createElement(import_react_bootstrap.Panel, null, /* @__PURE__ */ import_react2.default.createElement(import_react_bootstrap.Panel.Body, null, /* @__PURE__ */ import_react2.default.createElement(import_react_bootstrap.ControlLabel, null, t("Stardew Valley")), /* @__PURE__ */ import_react2.default.createElement(
    import_vortex_api24.Toggle,
    {
      checked: useRecommendations,
      disabled: true,
      onToggle: setUseRecommendations
    },
    t("Use recommendations from the mod manifests"),
    /* @__PURE__ */ import_react2.default.createElement(import_vortex_api24.More, { id: "sdv_use_recommendations", name: "SDV Use Recommendations" }, t("If checked, when you install a mod for Stardew Valley you may get suggestions for installing further mods, required or recommended by it.This information could be wrong or incomplete so please carefully consider before accepting them."))
  ), /* @__PURE__ */ import_react2.default.createElement(import_vortex_api24.Toggle, { checked: mergeEnabled, onToggle: setMergeConfigSetting }, t("Manage SDV mod configuration files"), /* @__PURE__ */ import_react2.default.createElement(import_vortex_api24.More, { id: "sdv_mod_configuration", name: "SDV Mod Configuration" }, t(
    'Vortex by default is configured to attempt to pull-in newly created files (mod configuration json files for example) created externally (by the game itself or tools) into their respective mod folders.\n\nUnfortunately the configuration files are lost during mod updates when using this method.\n\nToggling this functionality creates a separate mod configuration "override" folder where all of your mod configuration files will be stored. This allows you to manage your mod configuration files on their own, regardless of mod updates. '
  )))))));
}
function mapStateToProps(state) {
  const profileId = import_vortex_api24.selectors.lastActiveProfileForGame(state, GAME_ID);
  return {
    profileId
  };
}

// extensions/games/game-stardewvalley/ui/smapiLog.ts
var import_path15 = __toESM(require("path"));
var import_vortex_api25 = require("vortex-api");
async function onShowSMAPILog(api) {
  const basePath = import_path15.default.join(import_vortex_api25.util.getVortexPath("appData"), "stardewvalley", "errorlogs");
  try {
    await showSMAPILog(api, basePath, "SMAPI-crash.txt");
  } catch (err) {
    try {
      await showSMAPILog(api, basePath, "SMAPI-latest.txt");
    } catch (innerErr) {
      api.sendNotification?.({
        type: "info",
        title: "No SMAPI logs found.",
        message: "",
        displayMS: 5e3
      });
    }
  }
}
var { clipboard } = require("electron");
async function showSMAPILog(api, basePath, logFile) {
  const logData = await import_vortex_api25.fs.readFileAsync(import_path15.default.join(basePath, logFile), { encoding: "utf-8" });
  if (api.showDialog === void 0) {
    return;
  }
  await api.showDialog("info", "SMAPI Log", {
    text: 'Your SMAPI log is displayed below. To share it, click "Copy & Share" which will copy it to your clipboard and open the SMAPI log sharing website. Next, paste your code into the text box and press "save & parse log". You can now share a link to this page with others so they can see your log file.\n\n' + logData
  }, [{
    label: "Copy & Share log",
    action: () => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/^.+T([^\.]+).+/, "$1");
      clipboard.writeText(`[${timestamp} INFO Vortex] Log exported by Vortex ${import_vortex_api25.util.getApplication().version}.
` + logData);
      return import_vortex_api25.util.opn("https://smapi.io/log").catch(() => void 0);
    }
  }, {
    label: "Close",
    action: () => void 0
  }]);
}

// extensions/games/game-stardewvalley/registration/registerUi.ts
function registerUi(context) {
  const store = context.api.store;
  if (store === void 0) {
    return;
  }
  context.registerSettings("Mods", Settings, () => ({
    onMergeConfigToggle: async (profileId, enabled) => {
      if (!enabled) {
        await onRevertFiles(context.api, profileId);
        context.api.sendNotification?.({
          type: "info",
          message: "Mod configs returned to their respective mods",
          displayMS: 5e3
        });
      }
      store.dispatch(setMergeConfigs(profileId, enabled));
      return Promise.resolve();
    }
  }), () => import_vortex_api26.selectors.activeGameId(context.api.getState()) === GAME_ID, 150);
  context.registerAction(
    "mod-icons",
    999,
    "changelog",
    {},
    "SMAPI Log",
    () => {
      onShowSMAPILog(context.api);
    },
    () => {
      const state = store.getState();
      const gameMode = import_vortex_api26.selectors.activeGameId(state);
      return gameMode === GAME_ID;
    }
  );
  context.registerTableAttribute("mods", {
    id: "sdv-compatibility",
    position: 100,
    condition: () => import_vortex_api26.selectors.activeGameId(context.api.getState()) === GAME_ID,
    placement: "table",
    calc: (mod) => mod.attributes?.compatibilityStatus,
    customRenderer: (mod, detailCell, t) => {
      return import_react3.default.createElement(
        CompatibilityIcon,
        { t, mod, detailCell },
        []
      );
    },
    name: "Compatibility",
    isDefaultVisible: true,
    edit: {}
  });
}

// extensions/games/game-stardewvalley/runtime/registerRuntimeEvents.ts
var import_bluebird9 = __toESM(require("bluebird"));
var import_path16 = __toESM(require("path"));
var import_vortex_api28 = require("vortex-api");

// extensions/games/game-stardewvalley/compatibility/updateConflictInfo.ts
var semver4 = __toESM(require("semver"));
var import_vortex_api27 = require("vortex-api");

// extensions/games/game-stardewvalley/types.ts
var compatibilityOptions = [
  "broken",
  "obsolete",
  "abandoned",
  "unofficial",
  "workaround",
  "unknown",
  "optional",
  "ok"
];

// extensions/games/game-stardewvalley/compatibility/updateConflictInfo.ts
function updateConflictInfo(api, smapi, gameId, modId) {
  const gameMods = api.getState().persistent.mods[gameId];
  if (gameMods === void 0) {
    return Promise.resolve();
  }
  const mod = gameMods[modId];
  if (mod === void 0) {
    return Promise.resolve();
  }
  const now = Date.now();
  const store = api.store;
  if (store === void 0) {
    return Promise.resolve();
  }
  if (now - (mod.attributes?.lastSMAPIQuery ?? 0) < SMAPI_QUERY_FREQUENCY) {
    return Promise.resolve();
  }
  let additionalLogicalFileNames = mod.attributes?.additionalLogicalFileNames;
  if (!additionalLogicalFileNames) {
    if (mod.attributes?.logicalFileName) {
      additionalLogicalFileNames = [mod.attributes?.logicalFileName];
    } else {
      additionalLogicalFileNames = [];
    }
  }
  const query = additionalLogicalFileNames.map((name) => {
    const res = {
      id: name
    };
    const ver = mod.attributes?.manifestVersion ?? semver4.coerce(mod.attributes?.version)?.version;
    if (!!ver) {
      res["installedVersion"] = ver;
    }
    return res;
  });
  const stat = (item) => {
    const status = item.metadata?.compatibilityStatus?.toLowerCase?.();
    if (!compatibilityOptions.includes(status)) {
      return "unknown";
    } else {
      return status;
    }
  };
  const compatibilityPrio = (item) => compatibilityOptions.indexOf(stat(item));
  return smapi.findByNames(query).then((results) => {
    const worstStatus = results.sort((lhs, rhs) => compatibilityPrio(lhs) - compatibilityPrio(rhs))[0];
    if (worstStatus !== void 0) {
      store.dispatch(import_vortex_api27.actions.setModAttributes(gameId, modId, {
        lastSMAPIQuery: now,
        compatibilityStatus: worstStatus.metadata.compatibilityStatus,
        compatibilityMessage: worstStatus.metadata.compatibilitySummary,
        compatibilityUpdate: worstStatus.suggestedUpdate?.version
      }));
    } else {
      (0, import_vortex_api27.log)("debug", "no manifest");
      store.dispatch(import_vortex_api27.actions.setModAttribute(gameId, modId, "lastSMAPIQuery", now));
    }
  }).catch((err) => {
    (0, import_vortex_api27.log)("warn", "error reading manifest", errorMessage(err));
    store.dispatch(import_vortex_api27.actions.setModAttribute(gameId, modId, "lastSMAPIQuery", now));
  });
}

// extensions/games/game-stardewvalley/runtime/registerRuntimeEvents.ts
function registerRuntimeEvents(context) {
  const store = context.api.store;
  if (store === void 0) {
    (0, import_vortex_api28.log)("error", "stardewvalley failed to initialize runtime: redux store unavailable");
    return;
  }
  context.once(() => {
    const proxy = new SMAPIProxy(context.api);
    context.api.setStylesheet("sdv", import_path16.default.join(__dirname, "ui", "sdvstyle.scss"));
    context.api.addMetaServer("smapi.io", {
      url: "",
      loopbackCB: (query) => {
        return import_bluebird9.default.resolve(proxy.find(query)).catch((err) => {
          (0, import_vortex_api28.log)("error", "failed to look up smapi meta info", errorMessage(err));
          return import_bluebird9.default.resolve([]);
        });
      },
      cacheDurationSec: 86400,
      priority: 25
    });
    context.api.onAsync("added-files", (profileId, files) => onAddedFiles(context.api, profileId, files));
    context.api.onAsync(
      "will-enable-mods",
      (profileId, modIds, enabled, options) => onWillEnableMods(context.api, profileId, modIds, enabled, options)
    );
    context.api.onAsync("did-deploy", async (profileId) => {
      const state = context.api.getState();
      const profile = import_vortex_api28.selectors.profileById(state, profileId);
      if (profile?.gameId !== GAME_ID) {
        return Promise.resolve();
      }
      const smapiMod = findSMAPIMod(context.api);
      const primaryTool = import_vortex_api28.util.getSafe(state, ["settings", "interface", "primaryTool", GAME_ID], void 0);
      if (smapiMod && primaryTool === void 0) {
        store.dispatch(import_vortex_api28.actions.setPrimaryTool(GAME_ID, "smapi"));
      }
      return Promise.resolve();
    });
    context.api.onAsync("did-purge", async (profileId) => {
      const state = context.api.getState();
      const profile = import_vortex_api28.selectors.profileById(state, profileId);
      if (profile?.gameId !== GAME_ID) {
        return Promise.resolve();
      }
      const smapiMod = findSMAPIMod(context.api);
      const primaryTool = import_vortex_api28.util.getSafe(state, ["settings", "interface", "primaryTool", GAME_ID], void 0);
      if (smapiMod && primaryTool === "smapi") {
        store.dispatch(import_vortex_api28.actions.setPrimaryTool(GAME_ID, void 0));
      }
      return Promise.resolve();
    });
    context.api.events.on("did-install-mod", (gameId, archiveId, modId) => {
      if (gameId !== GAME_ID) {
        return;
      }
      updateConflictInfo(context.api, proxy, gameId, modId).then(() => (0, import_vortex_api28.log)("debug", "added compatibility info", { modId })).catch((err) => (0, import_vortex_api28.log)("error", "failed to add compatibility info", { modId, error: errorMessage(err) }));
    });
    context.api.events.on("gamemode-activated", (gameMode) => {
      if (gameMode !== GAME_ID) {
        return;
      }
      const state = context.api.getState();
      (0, import_vortex_api28.log)("debug", "updating SDV compatibility info");
      Promise.all(Object.keys(state.persistent.mods[gameMode] ?? {}).map((modId) => updateConflictInfo(context.api, proxy, gameMode, modId))).then(() => {
        (0, import_vortex_api28.log)("debug", "done updating compatibility info");
      }).catch((err) => {
        (0, import_vortex_api28.log)("error", "failed to update conflict info", errorMessage(err));
      });
    });
  });
}

// extensions/games/game-stardewvalley/index.ts
function init(context) {
  const store = context.api.store;
  if (store === void 0) {
    (0, import_vortex_api29.log)("error", "stardewvalley failed to initialize: redux store unavailable");
    return;
  }
  const modManifestCache = new ModManifestCache(context.api);
  const getGameInstallPath = () => {
    const state = store.getState();
    const gameInstallPath = selectSdvDiscoveryPath(state);
    if (gameInstallPath === void 0) {
      (0, import_vortex_api29.log)("error", "stardewvalley was not discovered");
      throw new Error("Stardew Valley was not discovered");
    }
    return gameInstallPath;
  };
  const getSMAPIPath = (game) => {
    const state = store.getState();
    return selectDiscoveredToolPath(state, game.id);
  };
  context.registerGame(new StardewValleyGame(context));
  context.registerReducer(["settings", "SDV"], reducers_default);
  registerUi(context);
  registerInstallers(context, getGameInstallPath);
  registerModTypes(context, getGameInstallPath, getSMAPIPath);
  registerConfigMod(context);
  context.registerAttributeExtractor(25, createManifestAttributeExtractor(context));
  registerTests(context, modManifestCache);
  registerRuntimeEvents(context);
}
//# sourceMappingURL=index.js.map
