var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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

// extensions/games/game-stardewvalley/constants.ts
var SMAPI_QUERY_FREQUENCY, SMAPI_IO_API_VERSION, SMAPI_MOD_ID, SMAPI_URL;
var init_constants = __esm({
  "extensions/games/game-stardewvalley/constants.ts"() {
    SMAPI_QUERY_FREQUENCY = 1e3 * 60 * 24 * 7;
    SMAPI_IO_API_VERSION = "3.0.0";
    SMAPI_MOD_ID = 2400;
    SMAPI_URL = `https://www.nexusmods.com/stardewvalley/mods/${SMAPI_MOD_ID}`;
  }
});

// extensions/games/game-stardewvalley/common.ts
var common_exports = {};
__export(common_exports, {
  GAME_ID: () => GAME_ID,
  MOD_CONFIG: () => MOD_CONFIG,
  MOD_MANIFEST: () => MOD_MANIFEST,
  MOD_TYPE_CONFIG: () => MOD_TYPE_CONFIG,
  NOTIF_ACTIVITY_CONFIG_MOD: () => NOTIF_ACTIVITY_CONFIG_MOD,
  RGX_INVALID_CHARS_WINDOWS: () => RGX_INVALID_CHARS_WINDOWS,
  _SMAPI_BUNDLED_MODS: () => _SMAPI_BUNDLED_MODS,
  getBundledMods: () => getBundledMods
});
var GAME_ID, MOD_CONFIG, MOD_MANIFEST, RGX_INVALID_CHARS_WINDOWS, MOD_TYPE_CONFIG, _SMAPI_BUNDLED_MODS, NOTIF_ACTIVITY_CONFIG_MOD, getBundledMods;
var init_common = __esm({
  "extensions/games/game-stardewvalley/common.ts"() {
    GAME_ID = "stardewvalley";
    MOD_CONFIG = "config.json";
    MOD_MANIFEST = "manifest.json";
    RGX_INVALID_CHARS_WINDOWS = /[:/\\*?"<>|]/g;
    MOD_TYPE_CONFIG = "sdv-configuration-mod";
    _SMAPI_BUNDLED_MODS = ["ErrorHandler", "ConsoleCommands", "SaveBackup"];
    NOTIF_ACTIVITY_CONFIG_MOD = "sdv-config-mod-activity";
    getBundledMods = () => {
      return Array.from(new Set(_SMAPI_BUNDLED_MODS.map((modName) => modName.toLowerCase())));
    };
  }
});

// extensions/games/game-stardewvalley/SMAPI.ts
var SMAPI_exports = {};
__export(SMAPI_exports, {
  deploySMAPI: () => deploySMAPI,
  downloadSMAPI: () => downloadSMAPI,
  findSMAPIMod: () => findSMAPIMod,
  findSMAPITool: () => findSMAPITool
});
function findSMAPITool(api) {
  const state = api.getState();
  const discovery = import_vortex_api6.selectors.discoveryByGame(state, GAME_ID);
  const tool = discovery?.tools?.["smapi"];
  return !!tool?.path ? tool : void 0;
}
function findSMAPIMod(api) {
  const state = api.getState();
  const profileId = import_vortex_api6.selectors.lastActiveProfileForGame(state, GAME_ID);
  const profile = import_vortex_api6.selectors.profileById(state, profileId);
  const isActive = (modId) => import_vortex_api6.util.getSafe(profile, ["modState", modId, "enabled"], false);
  const isSMAPI = (mod) => mod.type === "SMAPI" && mod.attributes?.modId === 2400;
  const mods = import_vortex_api6.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  const SMAPIMods = Object.values(mods).filter((mod) => isSMAPI(mod) && isActive(mod.id));
  return SMAPIMods.length === 0 ? void 0 : SMAPIMods.length > 1 ? SMAPIMods.reduce((prev, iter) => {
    if (prev === void 0) {
      return iter;
    }
    return (0, import_semver.gte)(iter?.attributes?.version ?? "0.0.0", prev?.attributes?.version ?? "0.0.0") ? iter : prev;
  }, void 0) : SMAPIMods[0];
}
async function deploySMAPI(api) {
  await import_vortex_api6.util.toPromise((cb) => api.events.emit("deploy-mods", cb));
  await import_vortex_api6.util.toPromise((cb) => api.events.emit("start-quick-discovery", () => cb(null)));
  const discovery = import_vortex_api6.selectors.discoveryByGame(api.getState(), GAME_ID);
  const tool = discovery?.tools?.["smapi"];
  if (tool) {
    api.store.dispatch(import_vortex_api6.actions.setPrimaryTool(GAME_ID, tool.id));
  }
}
async function downloadSMAPI(api, update) {
  api.dismissNotification("smapi-missing");
  api.sendNotification({
    id: "smapi-installing",
    message: update ? "Updating SMAPI" : "Installing SMAPI",
    type: "activity",
    noDismiss: true,
    allowSuppress: false
  });
  if (api.ext?.ensureLoggedIn !== void 0) {
    await api.ext.ensureLoggedIn();
  }
  try {
    const modFiles = await api.ext.nexusGetModFiles(GAME_ID, SMAPI_MOD_ID);
    const fileTime = (input) => Number.parseInt(input.uploaded_time, 10);
    const file = modFiles.filter((file2) => file2.category_id === 1).sort((lhs, rhs) => fileTime(lhs) - fileTime(rhs))[0];
    if (file === void 0) {
      throw new import_vortex_api6.util.ProcessCanceled("No SMAPI main file found");
    }
    const dlInfo = {
      game: GAME_ID,
      name: "SMAPI"
    };
    const nxmUrl = `nxm://${GAME_ID}/mods/${SMAPI_MOD_ID}/files/${file.file_id}`;
    const dlId = await import_vortex_api6.util.toPromise((cb) => api.events.emit("start-download", [nxmUrl], dlInfo, void 0, cb, void 0, { allowInstall: false }));
    const modId = await import_vortex_api6.util.toPromise((cb) => api.events.emit("start-install-download", dlId, { allowAutoEnable: false }, cb));
    const profileId = import_vortex_api6.selectors.lastActiveProfileForGame(api.getState(), GAME_ID);
    await import_vortex_api6.actions.setModsEnabled(api, profileId, [modId], true, {
      allowAutoDeploy: false,
      installed: true
    });
    await deploySMAPI(api);
  } catch (err) {
    api.showErrorNotification("Failed to download/install SMAPI", err);
    import_vortex_api6.util.opn(SMAPI_URL).catch(() => null);
  } finally {
    api.dismissNotification("smapi-installing");
  }
}
var import_vortex_api6, import_semver;
var init_SMAPI = __esm({
  "extensions/games/game-stardewvalley/SMAPI.ts"() {
    import_vortex_api6 = require("vortex-api");
    init_common();
    import_semver = require("semver");
    init_constants();
  }
});

// extensions/games/game-stardewvalley/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_bluebird = __toESM(require("bluebird"));
var import_react3 = __toESM(require("react"));
var semver3 = __toESM(require("semver"));
var import_turbowalk3 = __toESM(require("turbowalk"));
var import_vortex_api10 = require("vortex-api");
var winapi = __toESM(require("winapi-bindings"));

// extensions/games/game-stardewvalley/CompatibilityIcon.tsx
var import_react = __toESM(require("react"));
var import_vortex_api = require("vortex-api");
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
function CompatibilityIcon(props) {
  const { t, mod } = props;
  const version = mod.attributes?.manifestVersion ?? mod.attributes?.version;
  if (mod.attributes?.compatibilityUpdate !== void 0 && mod.attributes?.compatibilityUpdate !== version) {
    return /* @__PURE__ */ import_react.default.createElement(
      import_vortex_api.tooltip.Icon,
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
    import_vortex_api.tooltip.Icon,
    {
      name: icon,
      className: `sdv-compatibility-${status}`,
      tooltip: mod.attributes?.compatibilityMessage ?? t("No information")
    }
  );
}
var CompatibilityIcon_default = CompatibilityIcon;

// extensions/games/game-stardewvalley/index.ts
init_constants();

// extensions/games/game-stardewvalley/DependencyManager.ts
var import_turbowalk2 = __toESM(require("turbowalk"));
var import_vortex_api3 = require("vortex-api");
init_common();

// extensions/games/game-stardewvalley/util.ts
var import_relaxed_json = require("relaxed-json");
var semver = __toESM(require("semver"));
var import_turbowalk = __toESM(require("turbowalk"));
var import_vortex_api2 = require("vortex-api");
function defaultModsRelPath() {
  return "Mods";
}
async function parseManifest(manifestFilePath) {
  try {
    const manifestData = await import_vortex_api2.fs.readFileAsync(manifestFilePath, { encoding: "utf-8" });
    const manifest = (0, import_relaxed_json.parse)(import_vortex_api2.util.deBOM(manifestData));
    if (!manifest) {
      throw new import_vortex_api2.util.DataInvalid("Manifest file is invalid");
    }
    return manifest;
  } catch (err) {
    return Promise.reject(err);
  }
}
function coerce2(input) {
  try {
    return new semver.SemVer(input);
  } catch (err) {
    return semver.coerce(input);
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
async function walkPath(dirPath, walkOptions) {
  walkOptions = !!walkOptions ? { ...walkOptions, skipHidden: true, skipInaccessible: true, skipLinks: true } : { skipLinks: true, skipHidden: true, skipInaccessible: true };
  const walkResults = [];
  return new Promise(async (resolve, reject) => {
    await (0, import_turbowalk.default)(dirPath, (entries) => {
      walkResults.push(...entries);
      return Promise.resolve();
    }, walkOptions).catch((err) => err.code === "ENOENT" ? Promise.resolve() : Promise.reject(err));
    return resolve(walkResults);
  });
}
async function deleteFolder(dirPath, walkOptions) {
  try {
    const entries = await walkPath(dirPath, walkOptions);
    entries.sort((a, b) => b.filePath.length - a.filePath.length);
    for (const entry of entries) {
      await import_vortex_api2.fs.removeAsync(entry.filePath);
    }
    await import_vortex_api2.fs.rmdirAsync(dirPath);
  } catch (err) {
    return Promise.reject(err);
  }
}

// extensions/games/game-stardewvalley/DependencyManager.ts
var import_path = __toESM(require("path"));
var DependencyManager = class {
  constructor(api) {
    this.mLoading = false;
    this.mApi = api;
  }
  async getManifests() {
    await this.scanManifests();
    return this.mManifests;
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
    const staging = import_vortex_api3.selectors.installPathForGame(state, GAME_ID);
    const profileId = import_vortex_api3.selectors.lastActiveProfileForGame(state, GAME_ID);
    const profile = import_vortex_api3.selectors.profileById(state, profileId);
    const isInstalled = (mod) => mod?.state === "installed";
    const isActive = (modId) => import_vortex_api3.util.getSafe(profile, ["modState", modId, "enabled"], false);
    const mods = import_vortex_api3.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
    const manifests = await Object.values(mods).reduce(async (accumP, iter) => {
      const accum = await accumP;
      if (!isInstalled(iter) || !isActive(iter.id)) {
        return Promise.resolve(accum);
      }
      const modPath = import_path.default.join(staging, iter.installationPath);
      return (0, import_turbowalk2.default)(modPath, async (entries) => {
        for (const entry of entries) {
          if (import_path.default.basename(entry.filePath) === "manifest.json") {
            let manifest;
            try {
              manifest = await parseManifest(entry.filePath);
            } catch (err) {
              (0, import_vortex_api3.log)("error", "failed to parse manifest", { error: err.message, manifest: entry.filePath });
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

// extensions/games/game-stardewvalley/actions.ts
var import_redux_act = require("redux-act");
var setRecommendations = (0, import_redux_act.createAction)("SET_SDV_RECOMMENDATIONS", (enabled) => enabled);
var setMergeConfigs = (0, import_redux_act.createAction)("SET_SDV_MERGE_CONFIGS", (profileId, enabled) => ({ profileId, enabled }));

// extensions/games/game-stardewvalley/reducers.ts
var import_vortex_api4 = require("vortex-api");
var sdvReducers = {
  reducers: {
    [setRecommendations]: (state, payload) => {
      return import_vortex_api4.util.setSafe(state, ["useRecommendations"], payload);
    },
    [setMergeConfigs]: (state, payload) => {
      const { profileId, enabled } = payload;
      return import_vortex_api4.util.setSafe(state, ["mergeConfigs", profileId], enabled);
    }
  },
  defaults: {
    useRecommendations: void 0
  }
};
var reducers_default = sdvReducers;

// extensions/games/game-stardewvalley/smapiProxy.ts
var https = __toESM(require("https"));
var semver2 = __toESM(require("semver"));
var import_vortex_api5 = require("vortex-api");
init_common();
init_constants();
var SMAPI_HOST = "smapi.io";
var SMAPIProxy = class {
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
  async find(query) {
    if (query.name !== void 0) {
      const res = await this.findByNames([{ id: query.name }]);
      if (res.length === 0 || res[0].metadata?.main === void 0) {
        return [];
      }
      const key = this.makeKey(query);
      if (res[0].metadata.nexusID !== void 0) {
        return await this.lookupOnNexus(
          query,
          res[0].metadata.nexusID,
          res[0].metadata.main.version
        );
      } else {
        return [
          { key, value: {
            gameId: GAME_ID,
            fileMD5: void 0,
            fileName: query.name,
            fileSizeBytes: 0,
            fileVersion: "",
            sourceURI: res[0].metadata.main?.url
          } }
        ];
      }
    } else {
      return [];
    }
  }
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
            (0, import_vortex_api5.log)("error", "failed to parse smapi response", textual);
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
    await this.mAPI.ext.ensureLoggedIn();
    const files = await this.mAPI.ext.nexusGetModFiles?.(GAME_ID, nexusId) ?? [];
    const versionPattern = `>=${version}`;
    const file = files.filter((iter) => semver2.satisfies(coerce2(iter.version), versionPattern)).sort((lhs, rhs) => semverCompare(rhs.version, lhs.version))[0];
    if (file === void 0) {
      throw new Error("no file found");
    }
    return [{
      key: this.makeKey(query),
      value: {
        fileMD5: void 0,
        fileName: file.file_name,
        fileSizeBytes: file.size * 1024,
        fileVersion: file.version,
        gameId: GAME_ID,
        sourceURI: `nxm://${GAME_ID}/mods/${nexusId}/files/${file.file_id}`,
        logicalFileName: query.name.toLowerCase(),
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
var smapiProxy_default = SMAPIProxy;

// extensions/games/game-stardewvalley/tests.ts
var import_vortex_api7 = require("vortex-api");
var import_semver2 = require("semver");
init_SMAPI();
init_common();
async function testSMAPIOutdated(api, depManager) {
  const state = api.getState();
  const activeGameId = import_vortex_api7.selectors.activeGameId(state);
  if (activeGameId !== GAME_ID) {
    return Promise.resolve(void 0);
  }
  let currentSMAPIVersion = findSMAPIMod(api)?.attributes?.version;
  if (currentSMAPIVersion === void 0) {
    return Promise.resolve(void 0);
  }
  const isSmapiOutdated = async () => {
    currentSMAPIVersion = findSMAPIMod(api)?.attributes?.version;
    const enabledManifests = await depManager.getManifests();
    const incompatibleModIds = [];
    for (const [id, manifests] of Object.entries(enabledManifests)) {
      const incompatible = manifests.filter((iter) => {
        if (iter.MinimumApiVersion !== void 0) {
          return !(0, import_semver2.gte)(currentSMAPIVersion, (0, import_semver2.coerce)(iter.MinimumApiVersion ?? "0.0.0"));
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
    automaticFix: () => downloadSMAPI(api, true),
    onRecheck: () => isSmapiOutdated(),
    severity: "warning"
  }) : Promise.resolve(void 0);
}

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

// extensions/games/game-stardewvalley/Settings.tsx
var import_react2 = __toESM(require("react"));
var import_react_bootstrap = require("react-bootstrap");
var import_react_i18next = require("react-i18next");
var import_react_redux = require("react-redux");
var import_vortex_api8 = require("vortex-api");
init_common();
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
    import_vortex_api8.Toggle,
    {
      checked: useRecommendations,
      onToggle: setUseRecommendations,
      disabled: true
    },
    t("Use recommendations from the mod manifests"),
    /* @__PURE__ */ import_react2.default.createElement(import_vortex_api8.More, { id: "sdv_use_recommendations", name: "SDV Use Recommendations" }, t("If checked, when you install a mod for Stardew Valley you may get suggestions for installing further mods, required or recommended by it.This information could be wrong or incomplete so please carefully consider before accepting them."))
  ), /* @__PURE__ */ import_react2.default.createElement(import_vortex_api8.Toggle, { checked: mergeEnabled, onToggle: setMergeConfigSetting }, t("Manage SDV mod configuration files"), /* @__PURE__ */ import_react2.default.createElement(import_vortex_api8.More, { id: "sdv_mod_configuration", name: "SDV Mod Configuration" }, t(
    'Vortex by default is configured to attempt to pull-in newly created files (mod configuration json files for example) created externally (by the game itself or tools) into their respective mod folders.\n\nUnfortunately the configuration files are lost during mod updates when using this method.\n\nToggling this functionality creates a separate mod configuration "override" folder where all of your mod configuration files will be stored. This allows you to manage your mod configuration files on their own, regardless of mod updates. '
  )))))));
}
function mapStateToProps(state) {
  const profileId = import_vortex_api8.selectors.lastActiveProfileForGame(state, GAME_ID);
  return {
    profileId
  };
}
var Settings_default = Settings;

// extensions/games/game-stardewvalley/configMod.ts
var import_path2 = __toESM(require("path"));
var import_vortex_api9 = require("vortex-api");
init_common();
init_SMAPI();
var syncWrapper = (api) => {
  onSyncModConfigurations(api);
};
function registerConfigMod(context) {
  context.registerAction(
    "mod-icons",
    999,
    "swap",
    {},
    "Sync Mod Configurations",
    () => syncWrapper(context.api),
    () => {
      const state = context.api.store.getState();
      const gameMode = import_vortex_api9.selectors.activeGameId(state);
      return gameMode === GAME_ID;
    }
  );
}
var shouldSuppressSync = (api) => {
  const state = api.getState();
  const suppressOnActivities = ["installing_dependencies"];
  const isActivityRunning = (activity) => import_vortex_api9.util.getSafe(state, ["session", "base", "activity", activity], []).length > 0;
  const suppressingActivities = suppressOnActivities.filter((activity) => isActivityRunning(activity));
  const suppressing = suppressingActivities.length > 0;
  return suppressing;
};
async function onSyncModConfigurations(api, silent) {
  const state = api.getState();
  const profile = import_vortex_api9.selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID || shouldSuppressSync(api)) {
    return;
  }
  const smapiTool = findSMAPITool(api);
  if (!smapiTool?.path) {
    return;
  }
  const mergeConfigs = import_vortex_api9.util.getSafe(state, ["settings", "SDV", "mergeConfigs", profile.id], false);
  if (!mergeConfigs) {
    if (silent) {
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
      api.store.dispatch(setMergeConfigs(profile.id, true));
    }
  }
  const eventPromise = (api2, eventType) => new Promise((resolve, reject) => {
    const cb = (err) => err !== null ? reject(err) : resolve();
    eventType === "purge-mods" ? api2.events.emit(eventType, false, cb) : api2.events.emit(eventType, cb);
  });
  try {
    const mod = await initialize(api);
    if (mod?.configModPath === void 0) {
      return;
    }
    await eventPromise(api, "purge-mods");
    const installPath = import_vortex_api9.selectors.installPathForGame(api.getState(), GAME_ID);
    const resolveCandidateName = (file) => {
      const relPath = import_path2.default.relative(installPath, file.filePath);
      const segments = relPath.split(import_path2.default.sep);
      return segments[0];
    };
    const files = await walkPath(installPath);
    const filtered = files.reduce((accum, file) => {
      if (import_path2.default.basename(file.filePath).toLowerCase() === MOD_CONFIG && !import_path2.default.dirname(file.filePath).includes(mod.configModPath)) {
        const candidateName = resolveCandidateName(file);
        if (import_vortex_api9.util.getSafe(profile, ["modState", candidateName, "enabled"], false) === false) {
          return accum;
        }
        accum.push({ filePath: file.filePath, candidates: [candidateName] });
      }
      return accum;
    }, []);
    await addModConfig(api, filtered, installPath);
    await eventPromise(api, "deploy-mods");
  } catch (err) {
    api.showErrorNotification("Failed to sync mod configurations", err);
  }
}
function sanitizeProfileName(input) {
  return input.replace(RGX_INVALID_CHARS_WINDOWS, "_");
}
function configModName(profileName) {
  return `Stardew Valley Configuration (${sanitizeProfileName(profileName)})`;
}
async function initialize(api) {
  const state = api.getState();
  const profile = import_vortex_api9.selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return Promise.resolve(void 0);
  }
  const mergeConfigs = import_vortex_api9.util.getSafe(state, ["settings", "SDV", "mergeConfigs", profile.id], false);
  if (!mergeConfigs) {
    return Promise.resolve(void 0);
  }
  try {
    const mod = await ensureConfigMod(api);
    const installationPath = import_vortex_api9.selectors.installPathForGame(state, GAME_ID);
    const configModPath = import_path2.default.join(installationPath, mod.installationPath);
    return Promise.resolve({ configModPath, mod });
  } catch (err) {
    api.showErrorNotification("Failed to resolve config mod path", err);
    return Promise.resolve(void 0);
  }
}
async function addModConfig(api, files, modsPath) {
  const configMod = await initialize(api);
  if (configMod === void 0) {
    return;
  }
  const state = api.getState();
  const discovery = import_vortex_api9.selectors.discoveryByGame(state, GAME_ID);
  const isInstallPath = modsPath !== void 0;
  modsPath = modsPath ?? import_path2.default.join(discovery.path, defaultModsRelPath());
  const smapiTool = findSMAPITool(api);
  if (smapiTool === void 0) {
    return;
  }
  const configModAttributes = extractConfigModAttributes(state, configMod.mod.id);
  let newConfigAttributes = Array.from(new Set(configModAttributes));
  for (const file of files) {
    const segments = file.filePath.toLowerCase().split(import_path2.default.sep).filter((seg) => !!seg);
    if (segments.includes("smapi_internal")) {
      continue;
    }
    api.sendNotification({
      type: "activity",
      id: NOTIF_ACTIVITY_CONFIG_MOD,
      title: "Importing config files...",
      message: file.candidates[0]
    });
    if (!configModAttributes.includes(file.candidates[0])) {
      newConfigAttributes.push(file.candidates[0]);
    }
    try {
      const installRelPath = import_path2.default.relative(modsPath, file.filePath);
      const segments2 = installRelPath.split(import_path2.default.sep);
      const relPath = isInstallPath ? segments2.slice(1).join(import_path2.default.sep) : installRelPath;
      const targetPath = import_path2.default.join(configMod.configModPath, relPath);
      const targetDir = import_path2.default.extname(targetPath) !== "" ? import_path2.default.dirname(targetPath) : targetPath;
      await import_vortex_api9.fs.ensureDirWritableAsync(targetDir);
      (0, import_vortex_api9.log)("debug", "importing config file from", { source: file.filePath, destination: targetPath, modId: file.candidates[0] });
      await import_vortex_api9.fs.copyAsync(file.filePath, targetPath, { overwrite: true });
      await import_vortex_api9.fs.removeAsync(file.filePath);
    } catch (err) {
      api.showErrorNotification("Failed to write mod config", err);
    }
  }
  api.dismissNotification(NOTIF_ACTIVITY_CONFIG_MOD);
  setConfigModAttribute(api, configMod.mod.id, Array.from(new Set(newConfigAttributes)));
}
async function ensureConfigMod(api) {
  const state = api.getState();
  const mods = import_vortex_api9.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  const modInstalled = Object.values(mods).find((iter) => iter.type === MOD_TYPE_CONFIG);
  if (modInstalled !== void 0) {
    return Promise.resolve(modInstalled);
  } else {
    const profile = import_vortex_api9.selectors.activeProfile(state);
    const modName = configModName(profile.name);
    const mod = await createConfigMod(api, modName, profile);
    api.store.dispatch(import_vortex_api9.actions.setModEnabled(profile.id, mod.id, true));
    return Promise.resolve(mod);
  }
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
      // Meaning of life
      version: "1.0.0",
      variant: sanitizeProfileName(profile.name.replace(RGX_INVALID_CHARS_WINDOWS, "_")),
      installTime: /* @__PURE__ */ new Date(),
      source: "user-generated"
    },
    installationPath: modName,
    type: MOD_TYPE_CONFIG
  };
  return new Promise((resolve, reject) => {
    api.events.emit("create-mod", profile.gameId, mod, async (error) => {
      if (error !== null) {
        return reject(error);
      }
      return resolve(mod);
    });
  });
}
async function onWillEnableMods(api, profileId, modIds, enabled, options) {
  const state = api.getState();
  const profile = import_vortex_api9.selectors.profileById(state, profileId);
  if (profile?.gameId !== GAME_ID) {
    return;
  }
  if (enabled) {
    await onSyncModConfigurations(api, true);
    return;
  }
  const configMod = await initialize(api);
  if (!configMod) {
    return;
  }
  if (modIds.includes(configMod.mod.id)) {
    await onRevertFiles(api, profileId);
    return;
  }
  if (options?.installed || options?.willBeReplaced) {
    return Promise.resolve();
  }
  const attrib = extractConfigModAttributes(state, configMod.mod.id);
  const relevant = modIds.filter((id) => attrib.includes(id));
  if (relevant.length === 0) {
    return;
  }
  const installPath = import_vortex_api9.selectors.installPathForGame(state, GAME_ID);
  if (enabled) {
    await onSyncModConfigurations(api);
    return;
  }
  const mods = import_vortex_api9.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  for (const id of relevant) {
    const mod = mods[id];
    if (!mod?.installationPath) {
      continue;
    }
    const modPath = import_path2.default.join(installPath, mod.installationPath);
    const files = await walkPath(modPath, { skipLinks: true, skipHidden: true, skipInaccessible: true });
    const manifestFile = files.find((file) => import_path2.default.basename(file.filePath) === MOD_MANIFEST);
    if (manifestFile === void 0) {
      continue;
    }
    const relPath = import_path2.default.relative(modPath, import_path2.default.dirname(manifestFile.filePath));
    const modConfigFilePath = import_path2.default.join(configMod.configModPath, relPath, MOD_CONFIG);
    await import_vortex_api9.fs.copyAsync(modConfigFilePath, import_path2.default.join(modPath, relPath, MOD_CONFIG), { overwrite: true }).catch((err) => null);
    try {
      await applyToModConfig(api, () => deleteFolder(import_path2.default.dirname(modConfigFilePath)));
    } catch (err) {
      api.showErrorNotification("Failed to write mod config", err);
      return;
    }
  }
  removeConfigModAttributes(api, configMod.mod, relevant);
}
async function applyToModConfig(api, cb) {
  try {
    const configMod = await initialize(api);
    await api.emitAndAwait("deploy-single-mod", GAME_ID, configMod.mod.id, false);
    await cb();
    await api.emitAndAwait("deploy-single-mod", GAME_ID, configMod.mod.id, true);
  } catch (err) {
    api.showErrorNotification("Failed to write mod config", err);
  }
}
async function onRevertFiles(api, profileId) {
  const state = api.getState();
  const profile = import_vortex_api9.selectors.profileById(state, profileId);
  if (profile?.gameId !== GAME_ID) {
    return;
  }
  const configMod = await initialize(api);
  if (!configMod) {
    return;
  }
  const attrib = extractConfigModAttributes(state, configMod.mod.id);
  if (attrib.length === 0) {
    return;
  }
  await onWillEnableMods(api, profileId, attrib, false);
  return;
}
async function onAddedFiles(api, profileId, files) {
  const state = api.store.getState();
  const profile = import_vortex_api9.selectors.profileById(state, profileId);
  if (profile?.gameId !== GAME_ID) {
    return;
  }
  const smapiTool = findSMAPITool(api);
  if (smapiTool === void 0) {
    return;
  }
  const isSMAPIFile = (file) => {
    const segments = file.filePath.toLowerCase().split(import_path2.default.sep).filter((seg) => !!seg);
    return segments.includes("smapi_internal");
  };
  const mergeConfigs = import_vortex_api9.util.getSafe(state, ["settings", "SDV", "mergeConfigs", profile.id], false);
  const result = files.reduce((accum, file) => {
    if (mergeConfigs && !isSMAPIFile(file) && import_path2.default.basename(file.filePath).toLowerCase() === MOD_CONFIG) {
      accum.configs.push(file);
    } else {
      accum.regulars.push(file);
    }
    return accum;
  }, { configs: [], regulars: [] });
  return Promise.all([
    addConfigFiles(api, profileId, result.configs),
    addRegularFiles(api, profileId, result.regulars)
  ]);
}
function extractConfigModAttributes(state, configModId) {
  return import_vortex_api9.util.getSafe(state, ["persistent", "mods", GAME_ID, configModId, "attributes", "configMod"], []);
}
function setConfigModAttribute(api, configModId, attributes) {
  api.store.dispatch(import_vortex_api9.actions.setModAttribute(GAME_ID, configModId, "configMod", attributes));
}
function removeConfigModAttributes(api, configMod, attributes) {
  const existing = extractConfigModAttributes(api.getState(), configMod.id);
  const newAttributes = existing.filter((attr) => !attributes.includes(attr));
  setConfigModAttribute(api, configMod.id, newAttributes);
}
async function addConfigFiles(api, profileId, files) {
  if (files.length === 0) {
    return Promise.resolve();
  }
  api.sendNotification({
    type: "activity",
    id: NOTIF_ACTIVITY_CONFIG_MOD,
    title: "Importing config files...",
    message: "Starting up..."
  });
  return addModConfig(api, files, void 0);
}
async function addRegularFiles(api, profileId, files) {
  if (files.length === 0) {
    return Promise.resolve();
  }
  const state = api.getState();
  const game = import_vortex_api9.util.getGame(GAME_ID);
  const discovery = import_vortex_api9.selectors.discoveryByGame(state, GAME_ID);
  const modPaths = game.getModPaths(discovery.path);
  const installPath = import_vortex_api9.selectors.installPathForGame(state, GAME_ID);
  for (const entry of files) {
    if (entry.candidates.length === 1) {
      const mod = import_vortex_api9.util.getSafe(
        state.persistent.mods,
        [GAME_ID, entry.candidates[0]],
        void 0
      );
      if (!isModCandidateValid(mod, entry)) {
        return Promise.resolve();
      }
      const from = modPaths[mod.type ?? ""];
      if (from === void 0) {
        (0, import_vortex_api9.log)("error", "failed to resolve mod path for mod type", mod.type);
        return Promise.resolve();
      }
      const relPath = import_path2.default.relative(from, entry.filePath);
      const targetPath = import_path2.default.join(installPath, mod.id, relPath);
      try {
        await import_vortex_api9.fs.ensureDirWritableAsync(import_path2.default.dirname(targetPath));
        await import_vortex_api9.fs.copyAsync(entry.filePath, targetPath);
        await import_vortex_api9.fs.removeAsync(entry.filePath);
      } catch (err) {
        if (!err.message.includes("are the same file")) {
          (0, import_vortex_api9.log)("error", "failed to re-import added file to mod", err.message);
        }
      }
    }
  }
}
var isModCandidateValid = (mod, entry) => {
  if (mod?.id === void 0 || mod.type === "sdvrootfolder") {
    return false;
  }
  if (mod.type !== "SMAPI") {
    return true;
  }
  const segments = entry.filePath.toLowerCase().split(import_path2.default.sep).filter((seg) => !!seg);
  const modsSegIdx = segments.indexOf("mods");
  const modFolderName = modsSegIdx !== -1 && segments.length > modsSegIdx + 1 ? segments[modsSegIdx + 1] : void 0;
  let bundledMods = import_vortex_api9.util.getSafe(mod, ["attributes", "smapiBundledMods"], []);
  bundledMods = bundledMods.length > 0 ? bundledMods : getBundledMods();
  if (segments.includes("content")) {
    return false;
  }
  return modFolderName !== void 0 && bundledMods.includes(modFolderName);
};

// extensions/games/game-stardewvalley/index.ts
var path3 = require("path");
var { clipboard } = require("electron");
var rjson = require("relaxed-json");
var { SevenZip } = import_vortex_api10.util;
var { deploySMAPI: deploySMAPI2, downloadSMAPI: downloadSMAPI2, findSMAPIMod: findSMAPIMod3 } = (init_SMAPI(), __toCommonJS(SMAPI_exports));
var { GAME_ID: GAME_ID2, _SMAPI_BUNDLED_MODS: _SMAPI_BUNDLED_MODS2, getBundledMods: getBundledMods2, MOD_TYPE_CONFIG: MOD_TYPE_CONFIG2 } = (init_common(), __toCommonJS(common_exports));
var MANIFEST_FILE = "manifest.json";
var PTRN_CONTENT = path3.sep + "Content" + path3.sep;
var SMAPI_EXE = "StardewModdingAPI.exe";
var SMAPI_DLL = "SMAPI.Installer.dll";
var SMAPI_DATA = ["windows-install.dat", "install.dat"];
function toBlue(func) {
  return (...args) => import_bluebird.default.resolve(func(...args));
}
var StardewValley = class {
  /*********
  ** Vortex API
  *********/
  /**
   * Construct an instance.
   * @param {IExtensionContext} context -- The Vortex extension context.
   */
  constructor(context) {
    this.id = GAME_ID2;
    this.name = "Stardew Valley";
    this.logo = "gameart.jpg";
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
        logo: "smapi.png",
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
    this.shell = process.platform === "win32";
    /**
     * Asynchronously find the game install path.
     *
     * This function should return quickly and, if it returns a value, it should definitively be the
     * valid game path. Usually this function will query the path from the registry or from steam.
     * This function may return a promise and it should do that if it's doing I/O.
     *
     * This may be left undefined but then the tool/game can only be discovered by searching the disk
     * which is slow and only happens manually.
     */
    this.queryPath = toBlue(async () => {
      const game = await import_vortex_api10.util.GameStoreHelper.findByAppId(["413150", "1453375253", "ConcernedApe.StardewValleyPC"]);
      if (game)
        return game.gamePath;
      for (const defaultPath of this.defaultPaths) {
        if (await this.getPathExistsAsync(defaultPath))
          return defaultPath;
      }
    });
    /**
     * Optional setup function. If this game requires some form of setup before it can be modded (like
     * creating a directory, changing a registry key, ...) do it here. It will be called every time
     * before the game mode is activated.
     * @param {IDiscoveryResult} discovery -- basic info about the game being loaded.
     */
    this.setup = toBlue(async (discovery) => {
      try {
        await import_vortex_api10.fs.ensureDirWritableAsync(path3.join(discovery.path, defaultModsRelPath()));
      } catch (err) {
        return Promise.reject(err);
      }
      const smapiPath = path3.join(discovery.path, SMAPI_EXE);
      const smapiFound = await this.getPathExistsAsync(smapiPath);
      if (!smapiFound) {
        this.recommendSmapi();
      }
      const state = this.context.api.getState();
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
  /**
   * Get the path of the tool executable relative to the tool base path, i.e. binaries/UT3.exe or
   * TESV.exe. This is a function so that you can return different things based on the operating
   * system for example but be aware that it will be evaluated at application start and only once,
   * so the return value can not depend on things that change at runtime.
   */
  executable() {
    return process.platform == "win32" ? "Stardew Valley.exe" : "StardewValley";
  }
  /**
   * Get the default directory where mods for this game should be stored.
   * 
   * If this returns a relative path then the path is treated as relative to the game installation
   * directory. Simply return a dot ( () => '.' ) if mods are installed directly into the game
   * directory.
   */
  queryModPath() {
    return defaultModsRelPath();
  }
  recommendSmapi() {
    const smapiMod = findSMAPIMod3(this.context.api);
    const title = smapiMod ? "SMAPI is not deployed" : "SMAPI is not installed";
    const actionTitle = smapiMod ? "Deploy" : "Get SMAPI";
    const action = () => (smapiMod ? deploySMAPI2(this.context.api) : downloadSMAPI2(this.context.api)).then(() => this.context.api.dismissNotification("smapi-missing"));
    this.context.api.sendNotification({
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
  /*********
  ** Internal methods
  *********/
  /**
   * Asynchronously check whether a file or directory path exists.
   * @param {string} path - The file or directory path.
   */
  async getPathExistsAsync(path4) {
    try {
      await import_vortex_api10.fs.statAsync(path4);
      return true;
    } catch (err) {
      return false;
    }
  }
  /**
   * Asynchronously read a registry key value.
   * @param {string} hive - The registry hive to access. This should be a constant like Registry.HKLM.
   * @param {string} key - The registry key.
   * @param {string} name - The name of the value to read.
   */
  async readRegistryKeyAsync(hive, key, name) {
    try {
      const instPath = winapi.RegGetValue(hive, key, name);
      if (!instPath) {
        throw new Error("empty registry key");
      }
      return Promise.resolve(instPath.value);
    } catch (err) {
      return Promise.resolve(void 0);
    }
  }
};
function testRootFolder(files, gameId) {
  const filtered = files.filter((file) => file.endsWith(path3.sep)).map((file) => path3.join("fakeDir", file));
  const contentDir = filtered.find((file) => file.endsWith(PTRN_CONTENT));
  const supported = gameId === GAME_ID2 && contentDir !== void 0;
  return import_bluebird.default.resolve({ supported, requiredFiles: [] });
}
function installRootFolder(files, destinationPath) {
  const contentFile = files.find((file) => path3.join("fakeDir", file).endsWith(PTRN_CONTENT));
  const idx = contentFile.indexOf(PTRN_CONTENT) + 1;
  const rootDir = path3.basename(contentFile.substring(0, idx));
  const filtered = files.filter((file) => !file.endsWith(path3.sep) && file.indexOf(rootDir) !== -1 && path3.extname(file) !== ".txt");
  const instructions = filtered.map((file) => {
    return {
      type: "copy",
      source: file,
      destination: file.substr(idx)
    };
  });
  return import_bluebird.default.resolve({ instructions });
}
function isValidManifest(filePath) {
  const segments = filePath.toLowerCase().split(path3.sep);
  const isManifestFile = segments[segments.length - 1] === MANIFEST_FILE;
  const isLocale = segments.includes("locale");
  return isManifestFile && !isLocale;
}
function testSupported(files, gameId) {
  const supported = gameId === GAME_ID2 && files.find(isValidManifest) !== void 0 && files.find((file) => {
    const testFile = path3.join("fakeDir", file);
    return testFile.endsWith(PTRN_CONTENT);
  }) === void 0;
  return import_bluebird.default.resolve({ supported, requiredFiles: [] });
}
async function install(api, dependencyManager, files, destinationPath) {
  const manifestFiles = files.filter(isValidManifest);
  let parseError;
  await dependencyManager.scanManifests(true);
  let mods = await Promise.all(manifestFiles.map(async (manifestFile) => {
    const rootFolder = path3.dirname(manifestFile);
    const rootSegments = rootFolder.toLowerCase().split(path3.sep);
    const manifestIndex = manifestFile.toLowerCase().indexOf(MANIFEST_FILE);
    const filterFunc = (file) => {
      const isFile = !file.endsWith(path3.sep) && path3.extname(path3.basename(file)) !== "";
      const fileSegments = file.toLowerCase().split(path3.sep);
      const isInRootFolder = rootSegments.length > 0 ? fileSegments?.[rootSegments.length - 1] === rootSegments[rootSegments.length - 1] : true;
      return isInRootFolder && isFile;
    };
    try {
      const manifest = await parseManifest(path3.join(destinationPath, manifestFile));
      const modFiles = files.filter(filterFunc);
      return {
        manifest,
        rootFolder,
        manifestIndex,
        modFiles
      };
    } catch (err) {
      (0, import_vortex_api10.log)("warn", "Failed to parse manifest", { manifestFile, error: err.message });
      parseError = err;
      return void 0;
    }
  }));
  mods = mods.filter((x) => x !== void 0);
  if (mods.length === 0) {
    api.showErrorNotification(
      `The mod manifest is invalid and can't be read. You can try to install the mod anyway via right-click -> "Unpack (as-is)"`,
      parseError,
      {
        allowReport: false
      }
    );
  }
  return import_bluebird.default.map(mods, (mod) => {
    const modName = mod.rootFolder !== "." ? mod.rootFolder : mod.manifest.Name ?? mod.rootFolder;
    if (modName === void 0) {
      return [];
    }
    const dependencies = mod.manifest.Dependencies || [];
    const instructions = [];
    for (const file of mod.modFiles) {
      const destination = path3.join(modName, file.substr(mod.manifestIndex));
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
    const instructions = [].concat(data).reduce((accum, iter) => accum.concat(iter), []);
    return Promise.resolve({ instructions });
  });
}
function isSMAPIModType(instructions) {
  const smapiData = instructions.find((inst) => inst.type === "copy" && inst.source.endsWith(SMAPI_EXE));
  return import_bluebird.default.resolve(smapiData !== void 0);
}
function testSMAPI(files, gameId) {
  const supported = gameId === GAME_ID2 && files.find((file) => path3.basename(file) === SMAPI_DLL) !== void 0;
  return import_bluebird.default.resolve({
    supported,
    requiredFiles: []
  });
}
async function installSMAPI(getDiscoveryPath, files, destinationPath) {
  const folder = process.platform === "win32" ? "windows" : process.platform === "linux" ? "linux" : "macos";
  const fileHasCorrectPlatform = (file) => {
    const segments = file.split(path3.sep).map((seg) => seg.toLowerCase());
    return segments.includes(folder);
  };
  const dataFile = files.find((file) => {
    const isCorrectPlatform = fileHasCorrectPlatform(file);
    return isCorrectPlatform && SMAPI_DATA.includes(path3.basename(file).toLowerCase());
  });
  if (dataFile === void 0) {
    return Promise.reject(new import_vortex_api10.util.DataInvalid("Failed to find the SMAPI data files - download appears to be corrupted; please re-download SMAPI and try again"));
  }
  let data = "";
  try {
    data = await import_vortex_api10.fs.readFileAsync(path3.join(getDiscoveryPath(), "Stardew Valley.deps.json"), { encoding: "utf8" });
  } catch (err) {
    (0, import_vortex_api10.log)("error", "failed to parse SDV dependencies", err);
  }
  const updatedFiles = [];
  const szip = new SevenZip();
  await szip.extractFull(path3.join(destinationPath, dataFile), destinationPath);
  await import_vortex_api10.util.walk(destinationPath, (iter, stats) => {
    const relPath = path3.relative(destinationPath, iter);
    if (!files.includes(relPath) && stats.isFile() && !files.includes(relPath + path3.sep)) updatedFiles.push(relPath);
    const segments = relPath.toLocaleLowerCase().split(path3.sep);
    const modsFolderIdx = segments.indexOf("mods");
    if (modsFolderIdx !== -1 && segments.length > modsFolderIdx + 1) {
      _SMAPI_BUNDLED_MODS2.push(segments[modsFolderIdx + 1]);
    }
    return import_bluebird.default.resolve();
  });
  const smapiExe = updatedFiles.find((file) => file.toLowerCase().endsWith(SMAPI_EXE.toLowerCase()));
  if (smapiExe === void 0) {
    return Promise.reject(new import_vortex_api10.util.DataInvalid(`Failed to extract ${SMAPI_EXE} - download appears to be corrupted; please re-download SMAPI and try again`));
  }
  const idx = smapiExe.indexOf(path3.basename(smapiExe));
  const instructions = updatedFiles.map((file) => {
    return {
      type: "copy",
      source: file,
      destination: path3.join(file.substr(idx))
    };
  });
  instructions.push({
    type: "attribute",
    key: "smapiBundledMods",
    value: getBundledMods2()
  });
  instructions.push({
    type: "generatefile",
    data,
    destination: "StardewModdingAPI.deps.json"
  });
  return Promise.resolve({ instructions });
}
async function showSMAPILog(api, basePath, logFile) {
  const logData = await import_vortex_api10.fs.readFileAsync(path3.join(basePath, logFile), { encoding: "utf-8" });
  await api.showDialog("info", "SMAPI Log", {
    text: 'Your SMAPI log is displayed below. To share it, click "Copy & Share" which will copy it to your clipboard and open the SMAPI log sharing website. Next, paste your code into the text box and press "save & parse log". You can now share a link to this page with others so they can see your log file.\n\n' + logData
  }, [{
    label: "Copy & Share log",
    action: () => {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/^.+T([^\.]+).+/, "$1");
      clipboard.writeText(`[${timestamp} INFO Vortex] Log exported by Vortex ${import_vortex_api10.util.getApplication().version}.
` + logData);
      return import_vortex_api10.util.opn("https://smapi.io/log").catch((err) => void 0);
    }
  }, { label: "Close", action: () => void 0 }]);
}
async function onShowSMAPILog(api) {
  const basePath = path3.join(import_vortex_api10.util.getVortexPath("appData"), "stardewvalley", "errorlogs");
  try {
    await showSMAPILog(api, basePath, "SMAPI-crash.txt");
  } catch (err) {
    try {
      await showSMAPILog(api, basePath, "SMAPI-latest.txt");
    } catch (err2) {
      api.sendNotification({ type: "info", title: "No SMAPI logs found.", message: "", displayMS: 5e3 });
    }
  }
}
function getModManifests(modPath) {
  const manifests = [];
  if (modPath === void 0) {
    return Promise.resolve([]);
  }
  return (0, import_turbowalk3.default)(modPath, async (entries) => {
    for (const entry of entries) {
      if (path3.basename(entry.filePath) === "manifest.json") {
        manifests.push(entry.filePath);
      }
    }
  }, { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true }).then(() => manifests);
}
function updateConflictInfo(api, smapi, gameId, modId) {
  const mod = api.getState().persistent.mods[gameId][modId];
  if (mod === void 0) {
    return Promise.resolve();
  }
  const now = Date.now();
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
    const ver = mod.attributes?.manifestVersion ?? semver3.coerce(mod.attributes?.version)?.version;
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
    const worstStatus = results.sort((lhs, rhs) => compatibilityPrio(lhs) - compatibilityPrio(rhs));
    if (worstStatus.length > 0) {
      api.store.dispatch(import_vortex_api10.actions.setModAttributes(gameId, modId, {
        lastSMAPIQuery: now,
        compatibilityStatus: worstStatus[0].metadata.compatibilityStatus,
        compatibilityMessage: worstStatus[0].metadata.compatibilitySummary,
        compatibilityUpdate: worstStatus[0].suggestedUpdate?.version
      }));
    } else {
      (0, import_vortex_api10.log)("debug", "no manifest");
      api.store.dispatch(import_vortex_api10.actions.setModAttribute(gameId, modId, "lastSMAPIQuery", now));
    }
  }).catch((err) => {
    (0, import_vortex_api10.log)("warn", "error reading manifest", err.message);
    api.store.dispatch(import_vortex_api10.actions.setModAttribute(gameId, modId, "lastSMAPIQuery", now));
  });
}
function init(context) {
  let dependencyManager;
  const getDiscoveryPath = () => {
    const state = context.api.store.getState();
    const discovery = import_vortex_api10.util.getSafe(state, ["settings", "gameMode", "discovered", GAME_ID2], void 0);
    if (discovery === void 0 || discovery.path === void 0) {
      (0, import_vortex_api10.log)("error", "stardewvalley was not discovered");
      return void 0;
    }
    return discovery.path;
  };
  const getSMAPIPath = (game) => {
    const state = context.api.store.getState();
    const discovery = state.settings.gameMode.discovered[game.id];
    return discovery.path;
  };
  const manifestExtractor = toBlue(
    async (modInfo, modPath) => {
      if (import_vortex_api10.selectors.activeGameId(context.api.getState()) !== GAME_ID2) {
        return Promise.resolve({});
      }
      const manifests = await getModManifests(modPath);
      const parsedManifests = (await Promise.all(manifests.map(
        async (manifest) => {
          try {
            return await parseManifest(manifest);
          } catch (err) {
            (0, import_vortex_api10.log)("warn", "Failed to parse manifest", { manifestFile: manifest, error: err.message });
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
        if (modInfo.download.modInfo?.nexus?.ids?.modId !== 2400) {
          result["customFileName"] = refManifest.Name;
        }
        if (typeof refManifest.Version === "string") {
          result["manifestVersion"] = refManifest.Version;
        }
      }
      return Promise.resolve(result);
    }
  );
  context.registerGame(new StardewValley(context));
  context.registerReducer(["settings", "SDV"], reducers_default);
  context.registerSettings("Mods", Settings_default, () => ({
    onMergeConfigToggle: async (profileId, enabled) => {
      if (!enabled) {
        await onRevertFiles(context.api, profileId);
        context.api.sendNotification({ type: "info", message: "Mod configs returned to their respective mods", displayMS: 5e3 });
      }
      context.api.store.dispatch(setMergeConfigs(profileId, enabled));
      return Promise.resolve();
    }
  }), () => import_vortex_api10.selectors.activeGameId(context.api.getState()) === GAME_ID2, 150);
  context.registerInstaller("smapi-installer", 30, testSMAPI, (files, dest) => import_bluebird.default.resolve(installSMAPI(getDiscoveryPath, files, dest)));
  context.registerInstaller("sdvrootfolder", 50, testRootFolder, installRootFolder);
  context.registerInstaller(
    "stardew-valley-installer",
    50,
    testSupported,
    (files, destinationPath) => import_bluebird.default.resolve(install(context.api, dependencyManager, files, destinationPath))
  );
  context.registerModType("SMAPI", 30, (gameId) => gameId === GAME_ID2, getSMAPIPath, isSMAPIModType);
  context.registerModType(
    MOD_TYPE_CONFIG2,
    30,
    (gameId) => gameId === GAME_ID2,
    () => path3.join(getDiscoveryPath(), defaultModsRelPath()),
    () => import_bluebird.default.resolve(false)
  );
  context.registerModType(
    "sdvrootfolder",
    25,
    (gameId) => gameId === GAME_ID2,
    () => getDiscoveryPath(),
    (instructions) => {
      const copyInstructions = instructions.filter((instr) => instr.type === "copy");
      const hasManifest = copyInstructions.find((instr) => instr.destination.endsWith(MANIFEST_FILE));
      const hasModsFolder = copyInstructions.find((instr) => instr.destination.startsWith(defaultModsRelPath() + path3.sep)) !== void 0;
      const hasContentFolder = copyInstructions.find((instr) => instr.destination.startsWith("Content" + path3.sep)) !== void 0;
      return hasManifest ? import_bluebird.default.resolve(hasContentFolder && hasModsFolder) : import_bluebird.default.resolve(hasContentFolder);
    }
  );
  registerConfigMod(context);
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
      const state = context.api.store.getState();
      const gameMode = import_vortex_api10.selectors.activeGameId(state);
      return gameMode === GAME_ID2;
    }
  );
  context.registerAttributeExtractor(25, manifestExtractor);
  context.registerTableAttribute("mods", {
    id: "sdv-compatibility",
    position: 100,
    condition: () => import_vortex_api10.selectors.activeGameId(context.api.getState()) === GAME_ID2,
    placement: "table",
    calc: (mod) => mod.attributes?.compatibilityStatus,
    customRenderer: (mod, detailCell, t) => {
      return import_react3.default.createElement(
        CompatibilityIcon_default,
        { t, mod, detailCell },
        []
      );
    },
    name: "Compatibility",
    isDefaultVisible: true,
    edit: {}
  });
  context.registerTest(
    "sdv-incompatible-mods",
    "gamemode-activated",
    () => import_bluebird.default.resolve(testSMAPIOutdated(context.api, dependencyManager))
  );
  context.once(() => {
    const proxy = new smapiProxy_default(context.api);
    context.api.setStylesheet("sdv", path3.join(__dirname, "sdvstyle.scss"));
    context.api.addMetaServer("smapi.io", {
      url: "",
      loopbackCB: (query) => {
        return import_bluebird.default.resolve(proxy.find(query)).catch((err) => {
          (0, import_vortex_api10.log)("error", "failed to look up smapi meta info", err.message);
          return import_bluebird.default.resolve([]);
        });
      },
      cacheDurationSec: 86400,
      priority: 25
    });
    dependencyManager = new DependencyManager(context.api);
    context.api.onAsync("added-files", (profileId, files) => onAddedFiles(context.api, profileId, files));
    context.api.onAsync("will-enable-mods", (profileId, modIds, enabled, options) => onWillEnableMods(context.api, profileId, modIds, enabled, options));
    context.api.onAsync("did-deploy", async (profileId) => {
      const state = context.api.getState();
      const profile = import_vortex_api10.selectors.profileById(state, profileId);
      if (profile?.gameId !== GAME_ID2) {
        return Promise.resolve();
      }
      const smapiMod = findSMAPIMod3(context.api);
      const primaryTool = import_vortex_api10.util.getSafe(state, ["settings", "interface", "primaryTool", GAME_ID2], void 0);
      if (smapiMod && primaryTool === void 0) {
        context.api.store.dispatch(import_vortex_api10.actions.setPrimaryTool(GAME_ID2, "smapi"));
      }
      return Promise.resolve();
    });
    context.api.onAsync("did-purge", async (profileId) => {
      const state = context.api.getState();
      const profile = import_vortex_api10.selectors.profileById(state, profileId);
      if (profile?.gameId !== GAME_ID2) {
        return Promise.resolve();
      }
      const smapiMod = findSMAPIMod3(context.api);
      const primaryTool = import_vortex_api10.util.getSafe(state, ["settings", "interface", "primaryTool", GAME_ID2], void 0);
      if (smapiMod && primaryTool === "smapi") {
        context.api.store.dispatch(import_vortex_api10.actions.setPrimaryTool(GAME_ID2, void 0));
      }
      return Promise.resolve();
    });
    context.api.events.on("did-install-mod", (gameId, archiveId, modId) => {
      if (gameId !== GAME_ID2) {
        return;
      }
      updateConflictInfo(context.api, proxy, gameId, modId).then(() => (0, import_vortex_api10.log)("debug", "added compatibility info", { modId })).catch((err) => (0, import_vortex_api10.log)("error", "failed to add compatibility info", { modId, error: err.message }));
    });
    context.api.events.on("gamemode-activated", (gameMode) => {
      if (gameMode !== GAME_ID2) {
        return;
      }
      const state = context.api.getState();
      (0, import_vortex_api10.log)("debug", "updating SDV compatibility info");
      Promise.all(Object.keys(state.persistent.mods[gameMode] ?? {}).map((modId) => updateConflictInfo(context.api, proxy, gameMode, modId))).then(() => {
        (0, import_vortex_api10.log)("debug", "done updating compatibility info");
      }).catch((err) => {
        (0, import_vortex_api10.log)("error", "failed to update conflict info", err.message);
      });
    });
  });
}
var index_default = init;
//# sourceMappingURL=index.js.map
