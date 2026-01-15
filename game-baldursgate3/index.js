var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __privateWrapper = (obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
});

// extensions/games/game-baldursgate3/index.tsx
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_bluebird2 = __toESM(require("bluebird"));
var path9 = __toESM(require("path"));
var React3 = __toESM(require("react"));
var import_vortex_api10 = require("vortex-api");

// extensions/games/game-baldursgate3/common.ts
var import_path = __toESM(require("path"));
var DEFAULT_MOD_SETTINGS_V8 = `<?xml version="1.0" encoding="UTF-8"?>
<save>
    <version major="4" minor="8" revision="0" build="10"/>
    <region id="ModuleSettings">
        <node id="root">
            <children>
                <node id="Mods">
                    <children>
                        <node id="ModuleShortDesc">
                            <attribute id="Folder" type="LSString" value="GustavX"/>
                            <attribute id="MD5" type="LSString" value=""/>
                            <attribute id="Name" type="LSString" value="GustavX"/>
                            <attribute id="PublishHandle" type="uint64" value="0"/>
                            <attribute id="UUID" type="guid" value="cb555efe-2d9e-131f-8195-a89329d218ea"/>
                            <attribute id="Version64" type="int64" value="36028797018963968"/>
                        </node>
                    </children>
                </node>
            </children>
        </node>
    </region>
</save>`;
var DEFAULT_MOD_SETTINGS_V7 = `<?xml version="1.0" encoding="UTF-8"?>
<save>
  <version major="4" minor="7" revision="1" build="200"/>
  <region id="ModuleSettings">
    <node id="root">
      <children>
        <node id="Mods">
          <children>
            <node id="ModuleShortDesc">
              <attribute id="Folder" type="LSString" value="GustavDev"/>
              <attribute id="MD5" type="LSString" value=""/>
              <attribute id="Name" type="LSString" value="GustavDev"/>
              <attribute id="PublishHandle" type="uint64" value="0"/>
              <attribute id="UUID" type="guid" value="28ac9ce2-2aba-8cda-b3b5-6e922f71b6b8"/>
              <attribute id="Version64" type="int64" value="36028797018963968"/>
            </node>
          </children>
        </node>
      </children>
    </node>
  </region>
</save>`;
var DEFAULT_MOD_SETTINGS_V6 = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<save>
  <version major="4" minor="0" revision="10" build="100"/>
  <region id="ModuleSettings">
    <node id="root">
      <children>
        <node id="ModOrder">
          <children/>
        </node>
        <node id="Mods">
          <children>
            <node id="ModuleShortDesc">
              <attribute id="Folder" type="LSString" value="GustavDev"/>
              <attribute id="MD5" type="LSString" value=""/>
              <attribute id="Name" type="LSString" value="GustavDev"/>
              <attribute id="UUID" type="FixedString" value="28ac9ce2-2aba-8cda-b3b5-6e922f71b6b8"/>
              <attribute id="Version64" type="int64" value="36028797018963968"/>
            </node>
          </children>
        </node>
      </children>
    </node>
  </region>
</save>`;
var GAME_ID = "baldursgate3";
var DEBUG = false;
var LSLIB_URL = "https://github.com/Norbyte/lslib";
var LO_FILE_NAME = "loadOrder.json";
var IGNORE_PATTERNS = [
  import_path.default.join("**", "info.json")
];
var MOD_TYPE_LSLIB = "bg3-lslib-divine-tool";
var MOD_TYPE_BG3SE = "bg3-bg3se";
var MOD_TYPE_REPLACER = "bg3-replacer";
var MOD_TYPE_LOOSE = "bg3-loose";
var ORIGINAL_FILES = /* @__PURE__ */ new Set([
  "assets.pak",
  "assets.pak",
  "effects.pak",
  "engine.pak",
  "engineshaders.pak",
  "game.pak",
  "gameplatform.pak",
  "gustav.pak",
  "gustav_textures.pak",
  "icons.pak",
  "lowtex.pak",
  "materials.pak",
  "minimaps.pak",
  "models.pak",
  "shared.pak",
  "sharedsoundbanks.pak",
  "sharedsounds.pak",
  "textures.pak",
  "virtualtextures.pak"
]);
var LSLIB_FILES = /* @__PURE__ */ new Set([
  "divine.exe",
  "lslib.dll"
]);
var NOTIF_IMPORT_ACTIVITY = "bg3-loadorder-import-activity";

// extensions/games/game-baldursgate3/githubDownloader.ts
var https = __toESM(require("https"));
var _ = __toESM(require("lodash"));
var semver = __toESM(require("semver"));
var url = __toESM(require("url"));
var import_vortex_api = require("vortex-api");
var GITHUB_URL = "https://api.github.com/repos/Norbyte/lslib";
function query(baseUrl, request2) {
  return new Promise((resolve, reject) => {
    const getRequest = getRequestOptions(`${baseUrl}/${request2}`);
    https.get(getRequest, (res) => {
      res.setEncoding("utf-8");
      const msgHeaders = res.headers;
      const callsRemaining = parseInt(import_vortex_api.util.getSafe(msgHeaders, ["x-ratelimit-remaining"], "0"), 10);
      if (res.statusCode === 403 && callsRemaining === 0) {
        const resetDate = parseInt(import_vortex_api.util.getSafe(msgHeaders, ["x-ratelimit-reset"], "0"), 10);
        (0, import_vortex_api.log)(
          "info",
          "GitHub rate limit exceeded",
          { reset_at: new Date(resetDate).toString() }
        );
        return reject(new import_vortex_api.util.ProcessCanceled("GitHub rate limit exceeded"));
      }
      let output = "";
      res.on("data", (data) => output += data).on("end", () => {
        try {
          return resolve(JSON.parse(output));
        } catch (parseErr) {
          return reject(parseErr);
        }
      });
    }).on("error", (err) => {
      return reject(err);
    }).end();
  });
}
function getRequestOptions(link) {
  const relUrl = url.parse(link);
  return {
    ..._.pick(relUrl, ["port", "hostname", "path"]),
    headers: {
      "User-Agent": "Vortex"
    }
  };
}
async function downloadConsent(api) {
  return api.showDialog("error", "Divine tool is missing", {
    bbcode: api.translate(`Baldur's Gate 3's modding pattern in most (if not all) cases will require a 3rd party tool named "{{name}}" to manipulate game files.[br][/br][br][/br]Vortex can download and install this tool for you as a mod entry. Please ensure that the tool is always enabled and deployed on the mods page.[br][/br][br][/br]Please note that some Anti-Virus software may flag this tool as malicious due to the nature of the tool (unpacks .pak files). We suggest you ensure that your security software is configured to allow this tool to install.`, { replace: { name: "LSLib" } })
  }, [
    { label: "Cancel" },
    { label: "Download" }
  ]).then((result) => result.action === "Cancel" ? Promise.reject(new import_vortex_api.util.UserCanceled()) : Promise.resolve());
}
async function notifyUpdate(api, latest, current) {
  const gameId = import_vortex_api.selectors.activeGameId(api.store.getState());
  const t = api.translate;
  return new Promise((resolve, reject) => {
    api.sendNotification({
      type: "info",
      id: `divine-update`,
      noDismiss: true,
      allowSuppress: true,
      title: "Update for {{name}}",
      message: "Latest: {{latest}}, Installed: {{current}}",
      replace: {
        latest,
        current
      },
      actions: [
        {
          title: "More",
          action: (dismiss) => {
            api.showDialog("info", "{{name}} Update", {
              text: "Vortex has detected a newer version of {{name}} ({{latest}}) available to download from {{website}}. You currently have version {{current}} installed.\nVortex can download and attempt to install the new update for you.",
              parameters: {
                name: "LSLib/Divine Tool",
                website: LSLIB_URL,
                latest,
                current
              }
            }, [
              {
                label: "Download",
                action: () => {
                  resolve();
                  dismiss();
                }
              }
            ]);
          }
        },
        {
          title: "Dismiss",
          action: (dismiss) => {
            resolve();
            dismiss();
          }
        }
      ]
    });
  });
}
async function getLatestReleases(currentVersion) {
  if (GITHUB_URL) {
    return query(GITHUB_URL, "releases").then((releases) => {
      if (!Array.isArray(releases)) {
        return Promise.reject(new import_vortex_api.util.DataInvalid("expected array of github releases"));
      }
      const current = releases.filter((rel) => {
        const tagName = import_vortex_api.util.getSafe(rel, ["tag_name"], void 0);
        const isPreRelease = import_vortex_api.util.getSafe(rel, ["prerelease"], false);
        const version = semver.valid(tagName);
        return !isPreRelease && version !== null && (currentVersion === void 0 || semver.gte(version, currentVersion));
      }).sort((lhs, rhs) => semver.compare(rhs.tag_name, lhs.tag_name));
      return Promise.resolve(current);
    });
  }
}
async function startDownload(api, downloadLink) {
  const redirectionURL = await new Promise((resolve, reject) => {
    https.request(getRequestOptions(downloadLink), (res) => {
      return resolve(res.headers["location"]);
    }).on("error", (err) => reject(err)).end();
  });
  const dlInfo = {
    game: GAME_ID,
    name: "LSLib/Divine Tool"
  };
  api.events.emit(
    "start-download",
    [redirectionURL],
    dlInfo,
    void 0,
    (error, id) => {
      if (error !== null) {
        if (error.name === "AlreadyDownloaded" && error.downloadId !== void 0) {
          id = error.downloadId;
        } else {
          api.showErrorNotification(
            "Download failed",
            error,
            { allowReport: false }
          );
          return Promise.resolve();
        }
      }
      api.events.emit("start-install-download", id, true, (err, modId) => {
        if (err !== null) {
          api.showErrorNotification(
            "Failed to install LSLib",
            err,
            { allowReport: false }
          );
        }
        const state = api.getState();
        const profileId = import_vortex_api.selectors.lastActiveProfileForGame(state, GAME_ID);
        api.store.dispatch(import_vortex_api.actions.setModEnabled(profileId, modId, true));
        return Promise.resolve();
      });
    },
    "ask"
  );
}
async function resolveDownloadLink(currentReleases) {
  const archives = currentReleases[0].assets.filter((asset) => asset.name.match(/(ExportTool-v[0-9]+.[0-9]+.[0-9]+.zip)/i));
  const downloadLink = archives[0]?.browser_download_url;
  return downloadLink === void 0 ? Promise.reject(new import_vortex_api.util.DataInvalid("Failed to resolve browser download url")) : Promise.resolve(downloadLink);
}
async function checkForUpdates(api, currentVersion) {
  return getLatestReleases(currentVersion).then(async (currentReleases) => {
    if (currentReleases[0] === void 0) {
      (0, import_vortex_api.log)("error", "Unable to update LSLib", "Failed to find any releases");
      return Promise.resolve(currentVersion);
    }
    const mostRecentVersion = currentReleases[0].tag_name.slice(1);
    const downloadLink = await resolveDownloadLink(currentReleases);
    if (semver.valid(mostRecentVersion) === null) {
      return Promise.resolve(currentVersion);
    } else {
      if (semver.gt(mostRecentVersion, currentVersion)) {
        return notifyUpdate(api, mostRecentVersion, currentVersion).then(() => startDownload(api, downloadLink)).then(() => Promise.resolve(mostRecentVersion));
      } else {
        return Promise.resolve(currentVersion);
      }
    }
  }).catch((err) => {
    if (err instanceof import_vortex_api.util.UserCanceled || err instanceof import_vortex_api.util.ProcessCanceled) {
      return Promise.resolve(currentVersion);
    }
    api.showErrorNotification("Unable to update LSLib", err);
    return Promise.resolve(currentVersion);
  });
}
async function downloadDivine(api) {
  const state = api.store.getState();
  const gameId = import_vortex_api.selectors.activeGameId(state);
  return getLatestReleases(void 0).then(async (currentReleases) => {
    const downloadLink = await resolveDownloadLink(currentReleases);
    return downloadConsent(api).then(() => startDownload(api, downloadLink));
  }).catch((err) => {
    if (err instanceof import_vortex_api.util.UserCanceled || err instanceof import_vortex_api.util.ProcessCanceled) {
      return Promise.resolve();
    } else {
      api.showErrorNotification("Unable to download/install LSLib", err);
      return Promise.resolve();
    }
  });
}

// extensions/games/game-baldursgate3/Settings.tsx
var import_react = __toESM(require("react"));
var import_react_bootstrap = require("react-bootstrap");
var import_react_i18next = require("react-i18next");
var import_react_redux = require("react-redux");
var import_vortex_api2 = require("vortex-api");

// extensions/games/game-baldursgate3/actions.ts
var import_redux_act = require("redux-act");
var setAutoExportLoadOrder = (0, import_redux_act.createAction)("BG3_SETTINGS_AUTO_EXPORT", (enabled) => enabled);
var setMigration = (0, import_redux_act.createAction)("BG3_SET_MIGRATION", (enabled) => enabled);
var setPlayerProfile = (0, import_redux_act.createAction)("BG3_SET_PLAYERPROFILE", (name) => name);
var settingsWritten = (0, import_redux_act.createAction)("BG3_SETTINGS_WRITTEN", (profile, time, count) => ({ profile, time, count }));
var setBG3ExtensionVersion = (0, import_redux_act.createAction)("BG3_SET_EXTENSION_VERSION", (version) => ({ version }));

// extensions/games/game-baldursgate3/Settings.tsx
function Settings() {
  const store = (0, import_react_redux.useStore)();
  const autoExportLoadOrder = (0, import_react_redux.useSelector)((state) => state.settings["baldursgate3"]?.autoExportLoadOrder);
  const setUseAutoExportLoadOrderToGame = import_react.default.useCallback((enabled) => {
    console.log(`setAutoExportLoadOrder=${enabled}`);
    store.dispatch(setAutoExportLoadOrder(enabled));
  }, []);
  const { t } = (0, import_react_i18next.useTranslation)();
  return /* @__PURE__ */ import_react.default.createElement("form", null, /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.FormGroup, { controlId: "default-enable" }, /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.Panel, null, /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.Panel.Body, null, /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.ControlLabel, null, t("Baldur's Gate 3")), /* @__PURE__ */ import_react.default.createElement(
    import_vortex_api2.Toggle,
    {
      checked: autoExportLoadOrder,
      onToggle: setUseAutoExportLoadOrderToGame
    },
    t("Auto export load order")
  ), /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.HelpBlock, null, t(`If enabled, when Vortex saves it's load order, it will also update the games load order. 
              If disabled, and you wish the game to use your load order, then this will need to be completed 
              manually using the Export to Game button on the load order screen`))))));
}
var Settings_default = Settings;

// extensions/games/game-baldursgate3/reducers.ts
var import_vortex_api3 = require("vortex-api");
var reducer = {
  reducers: {
    [setMigration]: (state, payload) => import_vortex_api3.util.setSafe(state, ["migration"], payload),
    [setAutoExportLoadOrder]: (state, payload) => import_vortex_api3.util.setSafe(state, ["autoExportLoadOrder"], payload),
    [setPlayerProfile]: (state, payload) => import_vortex_api3.util.setSafe(state, ["playerProfile"], payload),
    [setBG3ExtensionVersion]: (state, payload) => import_vortex_api3.util.setSafe(state, ["extensionVersion"], payload.version),
    [settingsWritten]: (state, payload) => {
      const { profile, time, count } = payload;
      return import_vortex_api3.util.setSafe(state, ["settingsWritten", profile], { time, count });
    }
  },
  defaults: {
    migration: true,
    autoExportLoadOrder: true,
    playerProfile: "global",
    settingsWritten: {},
    extensionVersion: "0.0.0"
  }
};
var reducers_default = reducer;

// extensions/games/game-baldursgate3/migrations.tsx
var semver4 = __toESM(require("semver"));
var import_vortex_api8 = require("vortex-api");

// extensions/games/game-baldursgate3/loadOrder.ts
var import_vortex_api7 = require("vortex-api");
var import_path2 = __toESM(require("path"));
var semver3 = __toESM(require("semver"));
var import_bluebird = __toESM(require("bluebird"));
var import_xml2js2 = require("xml2js");

// extensions/games/game-baldursgate3/divineWrapper.ts
var path3 = __toESM(require("path"));
var import_vortex_api5 = require("vortex-api");

// extensions/games/game-baldursgate3/util.ts
var path2 = __toESM(require("path"));
var semver2 = __toESM(require("semver"));
var import_shortid = require("shortid");
var import_turbowalk = __toESM(require("turbowalk"));
var import_vortex_api4 = require("vortex-api");
var import_xml2js = require("xml2js");
function getGamePath(api) {
  const state = api.getState();
  return state.settings.gameMode.discovered?.[GAME_ID]?.path;
}
function getGameDataPath(api) {
  const state = api.getState();
  const gamePath = state.settings.gameMode.discovered?.[GAME_ID]?.path;
  if (gamePath !== void 0) {
    return path2.join(gamePath, "Data");
  } else {
    return void 0;
  }
}
function documentsPath() {
  return path2.join(import_vortex_api4.util.getVortexPath("localAppData"), "Larian Studios", "Baldur's Gate 3");
}
function modsPath() {
  return path2.join(documentsPath(), "Mods");
}
function profilesPath() {
  return path2.join(documentsPath(), "PlayerProfiles");
}
async function globalProfilePath(api) {
  const bg3ProfileId = await getActivePlayerProfile(api);
  return path2.join(documentsPath(), bg3ProfileId);
}
var getPlayerProfiles = (() => {
  let cached = [];
  try {
    cached = import_vortex_api4.fs.readdirSync(profilesPath()).filter((name) => path2.extname(name) === "" && name !== "Default");
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
  return () => cached;
})();
function gameSupportsProfile(gameVersion) {
  return semver2.lt(semver2.coerce(gameVersion), "4.1.206");
}
async function getOwnGameVersion(state) {
  const discovery = import_vortex_api4.selectors.discoveryByGame(state, GAME_ID);
  return await import_vortex_api4.util.getGame(GAME_ID).getInstalledVersion(discovery);
}
async function getActivePlayerProfile(api) {
  return gameSupportsProfile(await getOwnGameVersion(api.getState())) ? api.store.getState().settings.baldursgate3?.playerProfile || "global" : "Public";
}
function parseModNode(node) {
  const name = findNode(node.attribute, "Name").$.value;
  return {
    id: name,
    name,
    data: findNode(node.attribute, "UUID").$.value
  };
}
var resolveMeta = (metadata) => {
  return metadata !== void 0 ? typeof metadata === "string" ? metadata : JSON.stringify(metadata) : void 0;
};
function logError(message, metadata) {
  const meta = resolveMeta(metadata);
  (0, import_vortex_api4.log)("debug", message, meta);
}
function logDebug(message, metadata) {
  if (DEBUG) {
    const meta = resolveMeta(metadata);
    (0, import_vortex_api4.log)("debug", message, meta);
  }
}
function forceRefresh(api) {
  const state = api.getState();
  const profileId = import_vortex_api4.selectors.lastActiveProfileForGame(state, GAME_ID);
  const action = {
    type: "SET_FB_FORCE_UPDATE",
    payload: {
      profileId
    }
  };
  api.store.dispatch(action);
}
function findNode(nodes, id) {
  return nodes?.find((iter) => iter.$.id === id) ?? void 0;
}
function getLatestInstalledLSLibVer(api) {
  const state = api.getState();
  const mods = import_vortex_api4.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  return Object.keys(mods).reduce((prev, id) => {
    if (mods[id].type === "bg3-lslib-divine-tool") {
      const arcId = mods[id].archiveId;
      const dl = import_vortex_api4.util.getSafe(
        state,
        ["persistent", "downloads", "files", arcId],
        void 0
      );
      const storedVer = import_vortex_api4.util.getSafe(mods[id], ["attributes", "version"], "0.0.0");
      try {
        if (semver2.gt(storedVer, prev)) {
          prev = storedVer;
        }
      } catch (err) {
        (0, import_vortex_api4.log)("warn", "invalid version stored for lslib mod", { id, version: storedVer });
      }
      if (dl !== void 0) {
        const fileName = path2.basename(dl.localPath, path2.extname(dl.localPath));
        const idx = fileName.indexOf("-v");
        try {
          const ver = semver2.coerce(fileName.slice(idx + 2)).version;
          if (semver2.valid(ver) && ver !== storedVer) {
            api.store.dispatch(import_vortex_api4.actions.setModAttribute(GAME_ID, id, "version", ver));
            prev = ver;
          }
        } catch (err) {
          api.store.dispatch(import_vortex_api4.actions.setModAttribute(GAME_ID, id, "version", "1.0.0"));
          prev = "1.0.0";
        }
      }
    }
    return prev;
  }, "0.0.0");
}
var _FORMAT = null;
var PATCH_8 = "4.67.58";
var PATCH_7 = "4.58.49";
var PATCH_6 = "4.50.22";
async function getDefaultModSettingsFormat(api) {
  if (_FORMAT !== null) {
    return _FORMAT;
  }
  _FORMAT = "v8";
  try {
    const state = api.getState();
    const gameVersion = await getOwnGameVersion(state);
    const coerced = gameVersion ? semver2.coerce(gameVersion) : PATCH_8;
    if (semver2.gte(coerced, PATCH_8)) {
      _FORMAT = "v8";
    } else if (semver2.gte(coerced, PATCH_7)) {
      _FORMAT = "v7";
    } else if (semver2.gte(coerced, PATCH_6)) {
      _FORMAT = "v6";
    } else {
      _FORMAT = "pre-v6";
    }
  } catch (err) {
    (0, import_vortex_api4.log)("warn", "failed to get game version", err);
  }
  return _FORMAT;
}
async function getDefaultModSettings(api) {
  if (_FORMAT === null) {
    _FORMAT = await getDefaultModSettingsFormat(api);
  }
  return {
    "v8": DEFAULT_MOD_SETTINGS_V8,
    "v7": DEFAULT_MOD_SETTINGS_V7,
    "v6": DEFAULT_MOD_SETTINGS_V6,
    "pre-v6": DEFAULT_MOD_SETTINGS_V6
  }[_FORMAT];
}
async function convertToV8(someXml) {
  const v7Xml = await convertV6toV7(someXml);
  const v7Json = await (0, import_xml2js.parseStringPromise)(v7Xml);
  v7Json.save.version[0].$.major = "4";
  v7Json.save.version[0].$.minor = "8";
  v7Json.save.version[0].$.revision = "0";
  v7Json.save.version[0].$.build = "10";
  const moduleSettingsChildren = v7Json.save.region[0].node[0].children[0].node;
  const modsNode = moduleSettingsChildren.find((n) => n.$.id === "Mods");
  if (modsNode) {
    var gustavEntry = modsNode.children[0].node.find((n) => n.attribute.some((attr) => attr.$.id === "Name" && attr.$.value === "GustavDev"));
    if (gustavEntry) {
      gustavEntry.attribute = [
        { $: { id: "Folder", type: "LSString", value: "GustavX" } },
        { $: { id: "MD5", type: "LSString", value: "" } },
        { $: { id: "Name", type: "LSString", value: "GustavX" } },
        { $: { id: "PublishHandle", type: "uint64", value: "0" } },
        { $: { id: "UUID", type: "guid", value: "cb555efe-2d9e-131f-8195-a89329d218ea" } },
        { $: { id: "Version64", type: "int64", value: "36028797018963968" } }
      ];
    }
  }
  const builder = new import_xml2js.Builder();
  const v8Xml = builder.buildObject(v7Json);
  return v8Xml;
}
async function convertV6toV7(v6Xml) {
  const v6Json = await (0, import_xml2js.parseStringPromise)(v6Xml);
  v6Json.save.version[0].$.major = "4";
  v6Json.save.version[0].$.minor = "7";
  v6Json.save.version[0].$.revision = "1";
  v6Json.save.version[0].$.build = "3";
  const moduleSettingsChildren = v6Json.save.region[0].node[0].children[0].node;
  const modOrderIndex = moduleSettingsChildren.findIndex((n) => n.$.id === "ModOrder");
  if (modOrderIndex !== -1) {
    moduleSettingsChildren.splice(modOrderIndex, 1);
  }
  const modsNode = moduleSettingsChildren.find((n) => n.$.id === "Mods");
  if (modsNode) {
    for (let i = 0; i < modsNode.children[0].node.length; i++) {
      const moduleShortDescNode = modsNode.children[0].node[i];
      if (moduleShortDescNode) {
        const uuidAttribute = moduleShortDescNode.attribute.find((attr) => attr.$.id === "UUID");
        if (uuidAttribute) {
          uuidAttribute.$.type = "guid";
        }
        const publishHandleAtt = moduleShortDescNode.attribute.find((attr) => attr.$.id === "PublishHandle");
        if (publishHandleAtt === void 0) {
          moduleShortDescNode.attribute.push({
            $: { id: "publishHandle", type: "uint64", value: "0" }
          });
        }
      }
    }
  }
  const builder = new import_xml2js.Builder();
  const v7Xml = builder.buildObject(v6Json);
  return v7Xml;
}
function getLatestLSLibMod(api) {
  const state = api.getState();
  const mods = state.persistent.mods[GAME_ID];
  if (mods === void 0) {
    (0, import_vortex_api4.log)("warn", "LSLib is not installed");
    return void 0;
  }
  const lsLib = Object.keys(mods).reduce((prev, id) => {
    if (mods[id].type === MOD_TYPE_LSLIB) {
      const latestVer = import_vortex_api4.util.getSafe(prev, ["attributes", "version"], "0.0.0");
      const currentVer = import_vortex_api4.util.getSafe(mods[id], ["attributes", "version"], "0.0.0");
      try {
        if (semver2.gt(currentVer, latestVer)) {
          prev = mods[id];
        }
      } catch (err) {
        (0, import_vortex_api4.log)("warn", "invalid mod version", { modId: id, version: currentVer });
      }
    }
    return prev;
  }, void 0);
  if (lsLib === void 0) {
    (0, import_vortex_api4.log)("warn", "LSLib is not installed");
    return void 0;
  }
  return lsLib;
}
async function extractPakInfoImpl(api, pakPath, mod, isListed) {
  const meta = await extractMeta(api, pakPath, mod);
  const config = findNode(meta?.save?.region, "Config");
  const configRoot = findNode(config?.node, "root");
  const moduleInfo = findNode(configRoot?.children?.[0]?.node, "ModuleInfo");
  const attr = (name, fallback) => findNode(moduleInfo?.attribute, name)?.$?.value ?? fallback();
  const genName = path2.basename(pakPath, path2.extname(pakPath));
  return {
    author: attr("Author", () => "Unknown"),
    description: attr("Description", () => "Missing"),
    folder: attr("Folder", () => genName),
    md5: attr("MD5", () => ""),
    name: attr("Name", () => genName),
    type: attr("Type", () => "Adventure"),
    uuid: attr("UUID", () => require("uuid").v4()),
    version: attr("Version64", () => "1"),
    publishHandle: attr("PublishHandle", () => "0"),
    isListed
  };
}
async function extractMeta(api, pakPath, mod) {
  const metaPath = path2.join(import_vortex_api4.util.getVortexPath("temp"), "lsmeta", (0, import_shortid.generate)());
  await import_vortex_api4.fs.ensureDirAsync(metaPath);
  await extractPak(api, pakPath, metaPath, "*/meta.lsx");
  try {
    let metaLSXPath = path2.join(metaPath, "meta.lsx");
    await (0, import_turbowalk.default)(metaPath, (entries) => {
      const temp = entries.find((e) => path2.basename(e.filePath).toLowerCase() === "meta.lsx");
      if (temp !== void 0) {
        metaLSXPath = temp.filePath;
      }
    });
    const dat = await import_vortex_api4.fs.readFileAsync(metaLSXPath);
    const meta = await (0, import_xml2js.parseStringPromise)(dat);
    await import_vortex_api4.fs.removeAsync(metaPath);
    return meta;
  } catch (err) {
    await import_vortex_api4.fs.removeAsync(metaPath);
    if (err.code === "ENOENT") {
      return Promise.resolve(void 0);
    } else if (err.message.includes("Column") && err.message.includes("Line")) {
      api.sendNotification({
        type: "warning",
        message: 'The meta.lsx file in "{{modName}}" is invalid, please report this to the author',
        actions: [{
          title: "More",
          action: () => {
            api.showDialog("error", "Invalid meta.lsx file", {
              message: err.message
            }, [{ label: "Close" }]);
          }
        }],
        replace: {
          modName: import_vortex_api4.util.renderModName(mod)
        }
      });
      return Promise.resolve(void 0);
    } else {
      throw err;
    }
  }
}
var storedLO = [];
async function parseLSXFile(lsxPath) {
  const dat = await import_vortex_api4.fs.readFileAsync(lsxPath, { encoding: "utf8" });
  return (0, import_xml2js.parseStringPromise)(dat);
}
async function readModSettings(api) {
  const bg3profile = await getActivePlayerProfile(api);
  const playerProfiles = getPlayerProfiles();
  if (playerProfiles.length === 0) {
    storedLO = [];
    const settingsPath2 = path2.join(profilesPath(), "Public", "modsettings.lsx");
    return parseLSXFile(settingsPath2);
  }
  const globalProfile = await globalProfilePath(api);
  const settingsPath = bg3profile !== "global" ? path2.join(profilesPath(), bg3profile, "modsettings.lsx") : path2.join(globalProfile, "modsettings.lsx");
  return parseLSXFile(settingsPath);
}
async function readStoredLO(api) {
  const modSettings = await readModSettings(api);
  const config = findNode(modSettings?.save?.region, "ModuleSettings");
  const configRoot = findNode(config?.node, "root");
  const modOrderRoot = findNode(configRoot?.children?.[0]?.node, "ModOrder");
  const modsRoot = findNode(configRoot?.children?.[0]?.node, "Mods");
  const modOrderNodes = modOrderRoot?.children?.[0]?.node ?? [];
  const modNodes = modsRoot?.children?.[0]?.node ?? [];
  const modOrder = modOrderNodes.map((node) => findNode(node.attribute, "UUID").$?.value);
  const state = api.store.getState();
  const vProfile = import_vortex_api4.selectors.activeProfile(state);
  const mods = import_vortex_api4.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  const enabled = Object.keys(mods).filter((id) => import_vortex_api4.util.getSafe(vProfile, ["modState", id, "enabled"], false));
  const bg3profile = state.settings.baldursgate3?.playerProfile;
  if (enabled.length > 0 && modNodes.length === 1) {
    const lastWrite = state.settings.baldursgate3?.settingsWritten?.[bg3profile];
    if (lastWrite !== void 0 && lastWrite.count > 1) {
      api.showDialog("info", '"modsettings.lsx" file was reset', {
        text: "The game reset the list of active mods and ran without them.\nThis happens when an invalid or incompatible mod is installed. The game will not load any mods if one of them is incompatible, unfortunately there is no easy way to find out which one caused the problem."
      }, [
        { label: "Continue" }
      ]);
    }
  }
  storedLO = modNodes.map((node) => parseModNode(node)).filter((entry) => !entry.id.startsWith("Gustav")).sort((lhs, rhs) => modOrder.findIndex((i) => i === lhs.data) - modOrder.findIndex((i) => i === rhs.data));
}

// extensions/games/game-baldursgate3/divineWrapper.ts
var nodeUtil = __toESM(require("util"));
var child_process = __toESM(require("child_process"));
var exec2 = nodeUtil.promisify(child_process.exec);
var concurrencyLimiter = new import_vortex_api5.util.ConcurrencyLimiter(5, () => true);
var TIMEOUT_MS = 1e4;
var DivineExecMissing = class extends Error {
  constructor() {
    super("Divine executable is missing");
    this.name = "DivineExecMissing";
  }
};
var DivineMissingDotNet = class extends Error {
  constructor() {
    super("LSLib requires .NET 8 Desktop Runtime to be installed.");
    this.name = "DivineMissingDotNet";
  }
};
var execOpts = {
  timeout: TIMEOUT_MS
};
async function runDivine(api, action, divineOpts) {
  return new Promise((resolve, reject) => concurrencyLimiter.do(async () => {
    try {
      const result = await divine(api, action, divineOpts, execOpts);
      return resolve(result);
    } catch (err) {
      return reject(err);
    }
  }));
}
async function divine(api, action, divineOpts, execOpts2) {
  return new Promise(async (resolve, reject) => {
    const state = api.getState();
    const stagingFolder = import_vortex_api5.selectors.installPathForGame(state, GAME_ID);
    const lsLib = getLatestLSLibMod(api);
    if (lsLib === void 0) {
      const err = new Error("LSLib/Divine tool is missing");
      err["attachLogOnReport"] = false;
      return reject(err);
    }
    const exe = path3.join(stagingFolder, lsLib.installationPath, "tools", "divine.exe");
    const args = [
      "--action",
      action,
      "--source",
      `"${divineOpts.source}"`,
      "--game",
      "bg3"
    ];
    if (divineOpts.loglevel !== void 0) {
      args.push("--loglevel", divineOpts.loglevel);
    } else {
      args.push("--loglevel", "off");
    }
    if (divineOpts.destination !== void 0) {
      args.push("--destination", `"${divineOpts.destination}"`);
    }
    if (divineOpts.expression !== void 0) {
      args.push("--expression", `"${divineOpts.expression}"`);
    }
    try {
      const command = `"${exe}" ${args.join(" ")}`;
      const { stdout, stderr } = await exec2(command, execOpts2);
      if (!!stderr) {
        return reject(new Error(`divine.exe failed: ${stderr}`));
      }
      if (!stdout && action !== "list-package") {
        return resolve({ stdout: "", returnCode: 2 });
      }
      const stdoutStr = typeof stdout === "string" ? stdout : stdout?.toString?.() ?? "";
      if (["error", "fatal"].some((x) => stdoutStr.toLowerCase().startsWith(x))) {
        return reject(new Error(`divine.exe failed: ${stdoutStr}`));
      } else {
        return resolve({ stdout: stdoutStr, returnCode: 0 });
      }
    } catch (err) {
      if (err.code === "ENOENT") {
        return reject(new DivineExecMissing());
      }
      if (err.message.includes("You must install or update .NET")) {
        return reject(new DivineMissingDotNet());
      }
      const error = new Error(`divine.exe failed: ${err.message}`);
      error["attachLogOnReport"] = true;
      return reject(error);
    }
  });
}
async function extractPak(api, pakPath, destPath, pattern) {
  return runDivine(
    api,
    "extract-package",
    { source: pakPath, destination: destPath, expression: pattern }
  );
}
async function listPackage(api, pakPath) {
  let res;
  try {
    res = await runDivine(api, "list-package", { source: pakPath, loglevel: "off" });
  } catch (error) {
    logError(`listPackage caught error: `, { error });
    if (error instanceof DivineMissingDotNet) {
      (0, import_vortex_api5.log)("error", "Missing .NET", error.message);
      api.dismissNotification("bg3-reading-paks-activity");
      api.showErrorNotification(
        "LSLib requires .NET 8",
        "LSLib requires .NET 8 Desktop Runtime to be installed.[br][/br][br][/br][list=1][*]Download and Install [url=https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/runtime-desktop-8.0.3-windows-x64-installer].NET 8.0 Desktop Runtime from Microsoft[/url][*]Close Vortex[*]Restart Computer[*]Open Vortex[/list]",
        { id: "bg3-dotnet-error", allowReport: false, isBBCode: true }
      );
    }
  }
  const lines = (res?.stdout || "").split("\n").map((line) => line.trim()).filter((line) => line.length !== 0);
  return lines;
}

// extensions/games/game-baldursgate3/cache.ts
var path4 = __toESM(require("path"));
var import_vortex_api6 = require("vortex-api");

// node_modules/lru-cache/dist/esm/index.js
var perf = typeof performance === "object" && performance && typeof performance.now === "function" ? performance : Date;
var warned = /* @__PURE__ */ new Set();
var PROCESS = typeof process === "object" && !!process ? process : {};
var emitWarning = (msg, type, code, fn) => {
  typeof PROCESS.emitWarning === "function" ? PROCESS.emitWarning(msg, type, code, fn) : console.error(`[${code}] ${type}: ${msg}`);
};
var AC = globalThis.AbortController;
var AS = globalThis.AbortSignal;
if (typeof AC === "undefined") {
  AS = class AbortSignal {
    constructor() {
      __publicField(this, "onabort");
      __publicField(this, "_onabort", []);
      __publicField(this, "reason");
      __publicField(this, "aborted", false);
    }
    addEventListener(_2, fn) {
      this._onabort.push(fn);
    }
  };
  AC = class AbortController {
    constructor() {
      __publicField(this, "signal", new AS());
      warnACPolyfill();
    }
    abort(reason) {
      if (this.signal.aborted)
        return;
      this.signal.reason = reason;
      this.signal.aborted = true;
      for (const fn of this.signal._onabort) {
        fn(reason);
      }
      this.signal.onabort?.(reason);
    }
  };
  let printACPolyfillWarning = PROCESS.env?.LRU_CACHE_IGNORE_AC_WARNING !== "1";
  const warnACPolyfill = () => {
    if (!printACPolyfillWarning)
      return;
    printACPolyfillWarning = false;
    emitWarning("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.", "NO_ABORT_CONTROLLER", "ENOTSUP", warnACPolyfill);
  };
}
var shouldWarn = (code) => !warned.has(code);
var TYPE = Symbol("type");
var isPosInt = (n) => n && n === Math.floor(n) && n > 0 && isFinite(n);
var getUintArray = (max) => !isPosInt(max) ? null : max <= Math.pow(2, 8) ? Uint8Array : max <= Math.pow(2, 16) ? Uint16Array : max <= Math.pow(2, 32) ? Uint32Array : max <= Number.MAX_SAFE_INTEGER ? ZeroArray : null;
var ZeroArray = class extends Array {
  constructor(size) {
    super(size);
    this.fill(0);
  }
};
var _constructing;
var _Stack = class _Stack {
  constructor(max, HeapCls) {
    __publicField(this, "heap");
    __publicField(this, "length");
    if (!__privateGet(_Stack, _constructing)) {
      throw new TypeError("instantiate Stack using Stack.create(n)");
    }
    this.heap = new HeapCls(max);
    this.length = 0;
  }
  static create(max) {
    const HeapCls = getUintArray(max);
    if (!HeapCls)
      return [];
    __privateSet(_Stack, _constructing, true);
    const s = new _Stack(max, HeapCls);
    __privateSet(_Stack, _constructing, false);
    return s;
  }
  push(n) {
    this.heap[this.length++] = n;
  }
  pop() {
    return this.heap[--this.length];
  }
};
_constructing = new WeakMap();
// private constructor
__privateAdd(_Stack, _constructing, false);
var Stack = _Stack;
var _a, _b, _max, _maxSize, _dispose, _disposeAfter, _fetchMethod, _memoMethod, _size, _calculatedSize, _keyMap, _keyList, _valList, _next, _prev, _head, _tail, _free, _disposed, _sizes, _starts, _ttls, _hasDispose, _hasFetchMethod, _hasDisposeAfter, _LRUCache_instances, initializeTTLTracking_fn, _updateItemAge, _statusTTL, _setItemTTL, _isStale, initializeSizeTracking_fn, _removeItemSize, _addItemSize, _requireSize, indexes_fn, rindexes_fn, isValidIndex_fn, evict_fn, backgroundFetch_fn, isBackgroundFetch_fn, connect_fn, moveToTail_fn, delete_fn, clear_fn;
var _LRUCache = class _LRUCache {
  constructor(options) {
    __privateAdd(this, _LRUCache_instances);
    // options that cannot be changed without disaster
    __privateAdd(this, _max);
    __privateAdd(this, _maxSize);
    __privateAdd(this, _dispose);
    __privateAdd(this, _disposeAfter);
    __privateAdd(this, _fetchMethod);
    __privateAdd(this, _memoMethod);
    /**
     * {@link LRUCache.OptionsBase.ttl}
     */
    __publicField(this, "ttl");
    /**
     * {@link LRUCache.OptionsBase.ttlResolution}
     */
    __publicField(this, "ttlResolution");
    /**
     * {@link LRUCache.OptionsBase.ttlAutopurge}
     */
    __publicField(this, "ttlAutopurge");
    /**
     * {@link LRUCache.OptionsBase.updateAgeOnGet}
     */
    __publicField(this, "updateAgeOnGet");
    /**
     * {@link LRUCache.OptionsBase.updateAgeOnHas}
     */
    __publicField(this, "updateAgeOnHas");
    /**
     * {@link LRUCache.OptionsBase.allowStale}
     */
    __publicField(this, "allowStale");
    /**
     * {@link LRUCache.OptionsBase.noDisposeOnSet}
     */
    __publicField(this, "noDisposeOnSet");
    /**
     * {@link LRUCache.OptionsBase.noUpdateTTL}
     */
    __publicField(this, "noUpdateTTL");
    /**
     * {@link LRUCache.OptionsBase.maxEntrySize}
     */
    __publicField(this, "maxEntrySize");
    /**
     * {@link LRUCache.OptionsBase.sizeCalculation}
     */
    __publicField(this, "sizeCalculation");
    /**
     * {@link LRUCache.OptionsBase.noDeleteOnFetchRejection}
     */
    __publicField(this, "noDeleteOnFetchRejection");
    /**
     * {@link LRUCache.OptionsBase.noDeleteOnStaleGet}
     */
    __publicField(this, "noDeleteOnStaleGet");
    /**
     * {@link LRUCache.OptionsBase.allowStaleOnFetchAbort}
     */
    __publicField(this, "allowStaleOnFetchAbort");
    /**
     * {@link LRUCache.OptionsBase.allowStaleOnFetchRejection}
     */
    __publicField(this, "allowStaleOnFetchRejection");
    /**
     * {@link LRUCache.OptionsBase.ignoreFetchAbort}
     */
    __publicField(this, "ignoreFetchAbort");
    // computed properties
    __privateAdd(this, _size);
    __privateAdd(this, _calculatedSize);
    __privateAdd(this, _keyMap);
    __privateAdd(this, _keyList);
    __privateAdd(this, _valList);
    __privateAdd(this, _next);
    __privateAdd(this, _prev);
    __privateAdd(this, _head);
    __privateAdd(this, _tail);
    __privateAdd(this, _free);
    __privateAdd(this, _disposed);
    __privateAdd(this, _sizes);
    __privateAdd(this, _starts);
    __privateAdd(this, _ttls);
    __privateAdd(this, _hasDispose);
    __privateAdd(this, _hasFetchMethod);
    __privateAdd(this, _hasDisposeAfter);
    // conditionally set private methods related to TTL
    __privateAdd(this, _updateItemAge, () => {
    });
    __privateAdd(this, _statusTTL, () => {
    });
    __privateAdd(this, _setItemTTL, () => {
    });
    /* c8 ignore stop */
    __privateAdd(this, _isStale, () => false);
    __privateAdd(this, _removeItemSize, (_i) => {
    });
    __privateAdd(this, _addItemSize, (_i, _s, _st) => {
    });
    __privateAdd(this, _requireSize, (_k, _v, size, sizeCalculation) => {
      if (size || sizeCalculation) {
        throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
      }
      return 0;
    });
    /**
     * A String value that is used in the creation of the default string
     * description of an object. Called by the built-in method
     * `Object.prototype.toString`.
     */
    __publicField(this, _a, "LRUCache");
    const { max = 0, ttl, ttlResolution = 1, ttlAutopurge, updateAgeOnGet, updateAgeOnHas, allowStale, dispose, disposeAfter, noDisposeOnSet, noUpdateTTL, maxSize = 0, maxEntrySize = 0, sizeCalculation, fetchMethod, memoMethod, noDeleteOnFetchRejection, noDeleteOnStaleGet, allowStaleOnFetchRejection, allowStaleOnFetchAbort, ignoreFetchAbort } = options;
    if (max !== 0 && !isPosInt(max)) {
      throw new TypeError("max option must be a nonnegative integer");
    }
    const UintArray = max ? getUintArray(max) : Array;
    if (!UintArray) {
      throw new Error("invalid max value: " + max);
    }
    __privateSet(this, _max, max);
    __privateSet(this, _maxSize, maxSize);
    this.maxEntrySize = maxEntrySize || __privateGet(this, _maxSize);
    this.sizeCalculation = sizeCalculation;
    if (this.sizeCalculation) {
      if (!__privateGet(this, _maxSize) && !this.maxEntrySize) {
        throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
      }
      if (typeof this.sizeCalculation !== "function") {
        throw new TypeError("sizeCalculation set to non-function");
      }
    }
    if (memoMethod !== void 0 && typeof memoMethod !== "function") {
      throw new TypeError("memoMethod must be a function if defined");
    }
    __privateSet(this, _memoMethod, memoMethod);
    if (fetchMethod !== void 0 && typeof fetchMethod !== "function") {
      throw new TypeError("fetchMethod must be a function if specified");
    }
    __privateSet(this, _fetchMethod, fetchMethod);
    __privateSet(this, _hasFetchMethod, !!fetchMethod);
    __privateSet(this, _keyMap, /* @__PURE__ */ new Map());
    __privateSet(this, _keyList, new Array(max).fill(void 0));
    __privateSet(this, _valList, new Array(max).fill(void 0));
    __privateSet(this, _next, new UintArray(max));
    __privateSet(this, _prev, new UintArray(max));
    __privateSet(this, _head, 0);
    __privateSet(this, _tail, 0);
    __privateSet(this, _free, Stack.create(max));
    __privateSet(this, _size, 0);
    __privateSet(this, _calculatedSize, 0);
    if (typeof dispose === "function") {
      __privateSet(this, _dispose, dispose);
    }
    if (typeof disposeAfter === "function") {
      __privateSet(this, _disposeAfter, disposeAfter);
      __privateSet(this, _disposed, []);
    } else {
      __privateSet(this, _disposeAfter, void 0);
      __privateSet(this, _disposed, void 0);
    }
    __privateSet(this, _hasDispose, !!__privateGet(this, _dispose));
    __privateSet(this, _hasDisposeAfter, !!__privateGet(this, _disposeAfter));
    this.noDisposeOnSet = !!noDisposeOnSet;
    this.noUpdateTTL = !!noUpdateTTL;
    this.noDeleteOnFetchRejection = !!noDeleteOnFetchRejection;
    this.allowStaleOnFetchRejection = !!allowStaleOnFetchRejection;
    this.allowStaleOnFetchAbort = !!allowStaleOnFetchAbort;
    this.ignoreFetchAbort = !!ignoreFetchAbort;
    if (this.maxEntrySize !== 0) {
      if (__privateGet(this, _maxSize) !== 0) {
        if (!isPosInt(__privateGet(this, _maxSize))) {
          throw new TypeError("maxSize must be a positive integer if specified");
        }
      }
      if (!isPosInt(this.maxEntrySize)) {
        throw new TypeError("maxEntrySize must be a positive integer if specified");
      }
      __privateMethod(this, _LRUCache_instances, initializeSizeTracking_fn).call(this);
    }
    this.allowStale = !!allowStale;
    this.noDeleteOnStaleGet = !!noDeleteOnStaleGet;
    this.updateAgeOnGet = !!updateAgeOnGet;
    this.updateAgeOnHas = !!updateAgeOnHas;
    this.ttlResolution = isPosInt(ttlResolution) || ttlResolution === 0 ? ttlResolution : 1;
    this.ttlAutopurge = !!ttlAutopurge;
    this.ttl = ttl || 0;
    if (this.ttl) {
      if (!isPosInt(this.ttl)) {
        throw new TypeError("ttl must be a positive integer if specified");
      }
      __privateMethod(this, _LRUCache_instances, initializeTTLTracking_fn).call(this);
    }
    if (__privateGet(this, _max) === 0 && this.ttl === 0 && __privateGet(this, _maxSize) === 0) {
      throw new TypeError("At least one of max, maxSize, or ttl is required");
    }
    if (!this.ttlAutopurge && !__privateGet(this, _max) && !__privateGet(this, _maxSize)) {
      const code = "LRU_CACHE_UNBOUNDED";
      if (shouldWarn(code)) {
        warned.add(code);
        const msg = "TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.";
        emitWarning(msg, "UnboundedCacheWarning", code, _LRUCache);
      }
    }
  }
  /**
   * Do not call this method unless you need to inspect the
   * inner workings of the cache.  If anything returned by this
   * object is modified in any way, strange breakage may occur.
   *
   * These fields are private for a reason!
   *
   * @internal
   */
  static unsafeExposeInternals(c) {
    return {
      // properties
      starts: __privateGet(c, _starts),
      ttls: __privateGet(c, _ttls),
      sizes: __privateGet(c, _sizes),
      keyMap: __privateGet(c, _keyMap),
      keyList: __privateGet(c, _keyList),
      valList: __privateGet(c, _valList),
      next: __privateGet(c, _next),
      prev: __privateGet(c, _prev),
      get head() {
        return __privateGet(c, _head);
      },
      get tail() {
        return __privateGet(c, _tail);
      },
      free: __privateGet(c, _free),
      // methods
      isBackgroundFetch: (p) => {
        var _a2;
        return __privateMethod(_a2 = c, _LRUCache_instances, isBackgroundFetch_fn).call(_a2, p);
      },
      backgroundFetch: (k, index, options, context) => {
        var _a2;
        return __privateMethod(_a2 = c, _LRUCache_instances, backgroundFetch_fn).call(_a2, k, index, options, context);
      },
      moveToTail: (index) => {
        var _a2;
        return __privateMethod(_a2 = c, _LRUCache_instances, moveToTail_fn).call(_a2, index);
      },
      indexes: (options) => {
        var _a2;
        return __privateMethod(_a2 = c, _LRUCache_instances, indexes_fn).call(_a2, options);
      },
      rindexes: (options) => {
        var _a2;
        return __privateMethod(_a2 = c, _LRUCache_instances, rindexes_fn).call(_a2, options);
      },
      isStale: (index) => {
        var _a2;
        return __privateGet(_a2 = c, _isStale).call(_a2, index);
      }
    };
  }
  // Protected read-only members
  /**
   * {@link LRUCache.OptionsBase.max} (read-only)
   */
  get max() {
    return __privateGet(this, _max);
  }
  /**
   * {@link LRUCache.OptionsBase.maxSize} (read-only)
   */
  get maxSize() {
    return __privateGet(this, _maxSize);
  }
  /**
   * The total computed size of items in the cache (read-only)
   */
  get calculatedSize() {
    return __privateGet(this, _calculatedSize);
  }
  /**
   * The number of items stored in the cache (read-only)
   */
  get size() {
    return __privateGet(this, _size);
  }
  /**
   * {@link LRUCache.OptionsBase.fetchMethod} (read-only)
   */
  get fetchMethod() {
    return __privateGet(this, _fetchMethod);
  }
  get memoMethod() {
    return __privateGet(this, _memoMethod);
  }
  /**
   * {@link LRUCache.OptionsBase.dispose} (read-only)
   */
  get dispose() {
    return __privateGet(this, _dispose);
  }
  /**
   * {@link LRUCache.OptionsBase.disposeAfter} (read-only)
   */
  get disposeAfter() {
    return __privateGet(this, _disposeAfter);
  }
  /**
   * Return the number of ms left in the item's TTL. If item is not in cache,
   * returns `0`. Returns `Infinity` if item is in cache without a defined TTL.
   */
  getRemainingTTL(key) {
    return __privateGet(this, _keyMap).has(key) ? Infinity : 0;
  }
  /**
   * Return a generator yielding `[key, value]` pairs,
   * in order from most recently used to least recently used.
   */
  *entries() {
    for (const i of __privateMethod(this, _LRUCache_instances, indexes_fn).call(this)) {
      if (__privateGet(this, _valList)[i] !== void 0 && __privateGet(this, _keyList)[i] !== void 0 && !__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, __privateGet(this, _valList)[i])) {
        yield [__privateGet(this, _keyList)[i], __privateGet(this, _valList)[i]];
      }
    }
  }
  /**
   * Inverse order version of {@link LRUCache.entries}
   *
   * Return a generator yielding `[key, value]` pairs,
   * in order from least recently used to most recently used.
   */
  *rentries() {
    for (const i of __privateMethod(this, _LRUCache_instances, rindexes_fn).call(this)) {
      if (__privateGet(this, _valList)[i] !== void 0 && __privateGet(this, _keyList)[i] !== void 0 && !__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, __privateGet(this, _valList)[i])) {
        yield [__privateGet(this, _keyList)[i], __privateGet(this, _valList)[i]];
      }
    }
  }
  /**
   * Return a generator yielding the keys in the cache,
   * in order from most recently used to least recently used.
   */
  *keys() {
    for (const i of __privateMethod(this, _LRUCache_instances, indexes_fn).call(this)) {
      const k = __privateGet(this, _keyList)[i];
      if (k !== void 0 && !__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, __privateGet(this, _valList)[i])) {
        yield k;
      }
    }
  }
  /**
   * Inverse order version of {@link LRUCache.keys}
   *
   * Return a generator yielding the keys in the cache,
   * in order from least recently used to most recently used.
   */
  *rkeys() {
    for (const i of __privateMethod(this, _LRUCache_instances, rindexes_fn).call(this)) {
      const k = __privateGet(this, _keyList)[i];
      if (k !== void 0 && !__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, __privateGet(this, _valList)[i])) {
        yield k;
      }
    }
  }
  /**
   * Return a generator yielding the values in the cache,
   * in order from most recently used to least recently used.
   */
  *values() {
    for (const i of __privateMethod(this, _LRUCache_instances, indexes_fn).call(this)) {
      const v = __privateGet(this, _valList)[i];
      if (v !== void 0 && !__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, __privateGet(this, _valList)[i])) {
        yield __privateGet(this, _valList)[i];
      }
    }
  }
  /**
   * Inverse order version of {@link LRUCache.values}
   *
   * Return a generator yielding the values in the cache,
   * in order from least recently used to most recently used.
   */
  *rvalues() {
    for (const i of __privateMethod(this, _LRUCache_instances, rindexes_fn).call(this)) {
      const v = __privateGet(this, _valList)[i];
      if (v !== void 0 && !__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, __privateGet(this, _valList)[i])) {
        yield __privateGet(this, _valList)[i];
      }
    }
  }
  /**
   * Iterating over the cache itself yields the same results as
   * {@link LRUCache.entries}
   */
  [(_b = Symbol.iterator, _a = Symbol.toStringTag, _b)]() {
    return this.entries();
  }
  /**
   * Find a value for which the supplied fn method returns a truthy value,
   * similar to `Array.find()`. fn is called as `fn(value, key, cache)`.
   */
  find(fn, getOptions = {}) {
    for (const i of __privateMethod(this, _LRUCache_instances, indexes_fn).call(this)) {
      const v = __privateGet(this, _valList)[i];
      const value = __privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v) ? v.__staleWhileFetching : v;
      if (value === void 0)
        continue;
      if (fn(value, __privateGet(this, _keyList)[i], this)) {
        return this.get(__privateGet(this, _keyList)[i], getOptions);
      }
    }
  }
  /**
   * Call the supplied function on each item in the cache, in order from most
   * recently used to least recently used.
   *
   * `fn` is called as `fn(value, key, cache)`.
   *
   * If `thisp` is provided, function will be called in the `this`-context of
   * the provided object, or the cache if no `thisp` object is provided.
   *
   * Does not update age or recenty of use, or iterate over stale values.
   */
  forEach(fn, thisp = this) {
    for (const i of __privateMethod(this, _LRUCache_instances, indexes_fn).call(this)) {
      const v = __privateGet(this, _valList)[i];
      const value = __privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v) ? v.__staleWhileFetching : v;
      if (value === void 0)
        continue;
      fn.call(thisp, value, __privateGet(this, _keyList)[i], this);
    }
  }
  /**
   * The same as {@link LRUCache.forEach} but items are iterated over in
   * reverse order.  (ie, less recently used items are iterated over first.)
   */
  rforEach(fn, thisp = this) {
    for (const i of __privateMethod(this, _LRUCache_instances, rindexes_fn).call(this)) {
      const v = __privateGet(this, _valList)[i];
      const value = __privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v) ? v.__staleWhileFetching : v;
      if (value === void 0)
        continue;
      fn.call(thisp, value, __privateGet(this, _keyList)[i], this);
    }
  }
  /**
   * Delete any stale entries. Returns true if anything was removed,
   * false otherwise.
   */
  purgeStale() {
    let deleted = false;
    for (const i of __privateMethod(this, _LRUCache_instances, rindexes_fn).call(this, { allowStale: true })) {
      if (__privateGet(this, _isStale).call(this, i)) {
        __privateMethod(this, _LRUCache_instances, delete_fn).call(this, __privateGet(this, _keyList)[i], "expire");
        deleted = true;
      }
    }
    return deleted;
  }
  /**
   * Get the extended info about a given entry, to get its value, size, and
   * TTL info simultaneously. Returns `undefined` if the key is not present.
   *
   * Unlike {@link LRUCache#dump}, which is designed to be portable and survive
   * serialization, the `start` value is always the current timestamp, and the
   * `ttl` is a calculated remaining time to live (negative if expired).
   *
   * Always returns stale values, if their info is found in the cache, so be
   * sure to check for expirations (ie, a negative {@link LRUCache.Entry#ttl})
   * if relevant.
   */
  info(key) {
    const i = __privateGet(this, _keyMap).get(key);
    if (i === void 0)
      return void 0;
    const v = __privateGet(this, _valList)[i];
    const value = __privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v) ? v.__staleWhileFetching : v;
    if (value === void 0)
      return void 0;
    const entry = { value };
    if (__privateGet(this, _ttls) && __privateGet(this, _starts)) {
      const ttl = __privateGet(this, _ttls)[i];
      const start = __privateGet(this, _starts)[i];
      if (ttl && start) {
        const remain = ttl - (perf.now() - start);
        entry.ttl = remain;
        entry.start = Date.now();
      }
    }
    if (__privateGet(this, _sizes)) {
      entry.size = __privateGet(this, _sizes)[i];
    }
    return entry;
  }
  /**
   * Return an array of [key, {@link LRUCache.Entry}] tuples which can be
   * passed to {@link LRLUCache#load}.
   *
   * The `start` fields are calculated relative to a portable `Date.now()`
   * timestamp, even if `performance.now()` is available.
   *
   * Stale entries are always included in the `dump`, even if
   * {@link LRUCache.OptionsBase.allowStale} is false.
   *
   * Note: this returns an actual array, not a generator, so it can be more
   * easily passed around.
   */
  dump() {
    const arr = [];
    for (const i of __privateMethod(this, _LRUCache_instances, indexes_fn).call(this, { allowStale: true })) {
      const key = __privateGet(this, _keyList)[i];
      const v = __privateGet(this, _valList)[i];
      const value = __privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v) ? v.__staleWhileFetching : v;
      if (value === void 0 || key === void 0)
        continue;
      const entry = { value };
      if (__privateGet(this, _ttls) && __privateGet(this, _starts)) {
        entry.ttl = __privateGet(this, _ttls)[i];
        const age = perf.now() - __privateGet(this, _starts)[i];
        entry.start = Math.floor(Date.now() - age);
      }
      if (__privateGet(this, _sizes)) {
        entry.size = __privateGet(this, _sizes)[i];
      }
      arr.unshift([key, entry]);
    }
    return arr;
  }
  /**
   * Reset the cache and load in the items in entries in the order listed.
   *
   * The shape of the resulting cache may be different if the same options are
   * not used in both caches.
   *
   * The `start` fields are assumed to be calculated relative to a portable
   * `Date.now()` timestamp, even if `performance.now()` is available.
   */
  load(arr) {
    this.clear();
    for (const [key, entry] of arr) {
      if (entry.start) {
        const age = Date.now() - entry.start;
        entry.start = perf.now() - age;
      }
      this.set(key, entry.value, entry);
    }
  }
  /**
   * Add a value to the cache.
   *
   * Note: if `undefined` is specified as a value, this is an alias for
   * {@link LRUCache#delete}
   *
   * Fields on the {@link LRUCache.SetOptions} options param will override
   * their corresponding values in the constructor options for the scope
   * of this single `set()` operation.
   *
   * If `start` is provided, then that will set the effective start
   * time for the TTL calculation. Note that this must be a previous
   * value of `performance.now()` if supported, or a previous value of
   * `Date.now()` if not.
   *
   * Options object may also include `size`, which will prevent
   * calling the `sizeCalculation` function and just use the specified
   * number if it is a positive integer, and `noDisposeOnSet` which
   * will prevent calling a `dispose` function in the case of
   * overwrites.
   *
   * If the `size` (or return value of `sizeCalculation`) for a given
   * entry is greater than `maxEntrySize`, then the item will not be
   * added to the cache.
   *
   * Will update the recency of the entry.
   *
   * If the value is `undefined`, then this is an alias for
   * `cache.delete(key)`. `undefined` is never stored in the cache.
   */
  set(k, v, setOptions = {}) {
    var _a2, _b2, _c;
    if (v === void 0) {
      this.delete(k);
      return this;
    }
    const { ttl = this.ttl, start, noDisposeOnSet = this.noDisposeOnSet, sizeCalculation = this.sizeCalculation, status } = setOptions;
    let { noUpdateTTL = this.noUpdateTTL } = setOptions;
    const size = __privateGet(this, _requireSize).call(this, k, v, setOptions.size || 0, sizeCalculation);
    if (this.maxEntrySize && size > this.maxEntrySize) {
      if (status) {
        status.set = "miss";
        status.maxEntrySizeExceeded = true;
      }
      __privateMethod(this, _LRUCache_instances, delete_fn).call(this, k, "set");
      return this;
    }
    let index = __privateGet(this, _size) === 0 ? void 0 : __privateGet(this, _keyMap).get(k);
    if (index === void 0) {
      index = __privateGet(this, _size) === 0 ? __privateGet(this, _tail) : __privateGet(this, _free).length !== 0 ? __privateGet(this, _free).pop() : __privateGet(this, _size) === __privateGet(this, _max) ? __privateMethod(this, _LRUCache_instances, evict_fn).call(this, false) : __privateGet(this, _size);
      __privateGet(this, _keyList)[index] = k;
      __privateGet(this, _valList)[index] = v;
      __privateGet(this, _keyMap).set(k, index);
      __privateGet(this, _next)[__privateGet(this, _tail)] = index;
      __privateGet(this, _prev)[index] = __privateGet(this, _tail);
      __privateSet(this, _tail, index);
      __privateWrapper(this, _size)._++;
      __privateGet(this, _addItemSize).call(this, index, size, status);
      if (status)
        status.set = "add";
      noUpdateTTL = false;
    } else {
      __privateMethod(this, _LRUCache_instances, moveToTail_fn).call(this, index);
      const oldVal = __privateGet(this, _valList)[index];
      if (v !== oldVal) {
        if (__privateGet(this, _hasFetchMethod) && __privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, oldVal)) {
          oldVal.__abortController.abort(new Error("replaced"));
          const { __staleWhileFetching: s } = oldVal;
          if (s !== void 0 && !noDisposeOnSet) {
            if (__privateGet(this, _hasDispose)) {
              (_a2 = __privateGet(this, _dispose)) == null ? void 0 : _a2.call(this, s, k, "set");
            }
            if (__privateGet(this, _hasDisposeAfter)) {
              __privateGet(this, _disposed)?.push([s, k, "set"]);
            }
          }
        } else if (!noDisposeOnSet) {
          if (__privateGet(this, _hasDispose)) {
            (_b2 = __privateGet(this, _dispose)) == null ? void 0 : _b2.call(this, oldVal, k, "set");
          }
          if (__privateGet(this, _hasDisposeAfter)) {
            __privateGet(this, _disposed)?.push([oldVal, k, "set"]);
          }
        }
        __privateGet(this, _removeItemSize).call(this, index);
        __privateGet(this, _addItemSize).call(this, index, size, status);
        __privateGet(this, _valList)[index] = v;
        if (status) {
          status.set = "replace";
          const oldValue = oldVal && __privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, oldVal) ? oldVal.__staleWhileFetching : oldVal;
          if (oldValue !== void 0)
            status.oldValue = oldValue;
        }
      } else if (status) {
        status.set = "update";
      }
    }
    if (ttl !== 0 && !__privateGet(this, _ttls)) {
      __privateMethod(this, _LRUCache_instances, initializeTTLTracking_fn).call(this);
    }
    if (__privateGet(this, _ttls)) {
      if (!noUpdateTTL) {
        __privateGet(this, _setItemTTL).call(this, index, ttl, start);
      }
      if (status)
        __privateGet(this, _statusTTL).call(this, status, index);
    }
    if (!noDisposeOnSet && __privateGet(this, _hasDisposeAfter) && __privateGet(this, _disposed)) {
      const dt = __privateGet(this, _disposed);
      let task;
      while (task = dt?.shift()) {
        (_c = __privateGet(this, _disposeAfter)) == null ? void 0 : _c.call(this, ...task);
      }
    }
    return this;
  }
  /**
   * Evict the least recently used item, returning its value or
   * `undefined` if cache is empty.
   */
  pop() {
    var _a2;
    try {
      while (__privateGet(this, _size)) {
        const val = __privateGet(this, _valList)[__privateGet(this, _head)];
        __privateMethod(this, _LRUCache_instances, evict_fn).call(this, true);
        if (__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, val)) {
          if (val.__staleWhileFetching) {
            return val.__staleWhileFetching;
          }
        } else if (val !== void 0) {
          return val;
        }
      }
    } finally {
      if (__privateGet(this, _hasDisposeAfter) && __privateGet(this, _disposed)) {
        const dt = __privateGet(this, _disposed);
        let task;
        while (task = dt?.shift()) {
          (_a2 = __privateGet(this, _disposeAfter)) == null ? void 0 : _a2.call(this, ...task);
        }
      }
    }
  }
  /**
   * Check if a key is in the cache, without updating the recency of use.
   * Will return false if the item is stale, even though it is technically
   * in the cache.
   *
   * Check if a key is in the cache, without updating the recency of
   * use. Age is updated if {@link LRUCache.OptionsBase.updateAgeOnHas} is set
   * to `true` in either the options or the constructor.
   *
   * Will return `false` if the item is stale, even though it is technically in
   * the cache. The difference can be determined (if it matters) by using a
   * `status` argument, and inspecting the `has` field.
   *
   * Will not update item age unless
   * {@link LRUCache.OptionsBase.updateAgeOnHas} is set.
   */
  has(k, hasOptions = {}) {
    const { updateAgeOnHas = this.updateAgeOnHas, status } = hasOptions;
    const index = __privateGet(this, _keyMap).get(k);
    if (index !== void 0) {
      const v = __privateGet(this, _valList)[index];
      if (__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v) && v.__staleWhileFetching === void 0) {
        return false;
      }
      if (!__privateGet(this, _isStale).call(this, index)) {
        if (updateAgeOnHas) {
          __privateGet(this, _updateItemAge).call(this, index);
        }
        if (status) {
          status.has = "hit";
          __privateGet(this, _statusTTL).call(this, status, index);
        }
        return true;
      } else if (status) {
        status.has = "stale";
        __privateGet(this, _statusTTL).call(this, status, index);
      }
    } else if (status) {
      status.has = "miss";
    }
    return false;
  }
  /**
   * Like {@link LRUCache#get} but doesn't update recency or delete stale
   * items.
   *
   * Returns `undefined` if the item is stale, unless
   * {@link LRUCache.OptionsBase.allowStale} is set.
   */
  peek(k, peekOptions = {}) {
    const { allowStale = this.allowStale } = peekOptions;
    const index = __privateGet(this, _keyMap).get(k);
    if (index === void 0 || !allowStale && __privateGet(this, _isStale).call(this, index)) {
      return;
    }
    const v = __privateGet(this, _valList)[index];
    return __privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v) ? v.__staleWhileFetching : v;
  }
  async fetch(k, fetchOptions = {}) {
    const {
      // get options
      allowStale = this.allowStale,
      updateAgeOnGet = this.updateAgeOnGet,
      noDeleteOnStaleGet = this.noDeleteOnStaleGet,
      // set options
      ttl = this.ttl,
      noDisposeOnSet = this.noDisposeOnSet,
      size = 0,
      sizeCalculation = this.sizeCalculation,
      noUpdateTTL = this.noUpdateTTL,
      // fetch exclusive options
      noDeleteOnFetchRejection = this.noDeleteOnFetchRejection,
      allowStaleOnFetchRejection = this.allowStaleOnFetchRejection,
      ignoreFetchAbort = this.ignoreFetchAbort,
      allowStaleOnFetchAbort = this.allowStaleOnFetchAbort,
      context,
      forceRefresh: forceRefresh2 = false,
      status,
      signal
    } = fetchOptions;
    if (!__privateGet(this, _hasFetchMethod)) {
      if (status)
        status.fetch = "get";
      return this.get(k, {
        allowStale,
        updateAgeOnGet,
        noDeleteOnStaleGet,
        status
      });
    }
    const options = {
      allowStale,
      updateAgeOnGet,
      noDeleteOnStaleGet,
      ttl,
      noDisposeOnSet,
      size,
      sizeCalculation,
      noUpdateTTL,
      noDeleteOnFetchRejection,
      allowStaleOnFetchRejection,
      allowStaleOnFetchAbort,
      ignoreFetchAbort,
      status,
      signal
    };
    let index = __privateGet(this, _keyMap).get(k);
    if (index === void 0) {
      if (status)
        status.fetch = "miss";
      const p = __privateMethod(this, _LRUCache_instances, backgroundFetch_fn).call(this, k, index, options, context);
      return p.__returned = p;
    } else {
      const v = __privateGet(this, _valList)[index];
      if (__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v)) {
        const stale = allowStale && v.__staleWhileFetching !== void 0;
        if (status) {
          status.fetch = "inflight";
          if (stale)
            status.returnedStale = true;
        }
        return stale ? v.__staleWhileFetching : v.__returned = v;
      }
      const isStale = __privateGet(this, _isStale).call(this, index);
      if (!forceRefresh2 && !isStale) {
        if (status)
          status.fetch = "hit";
        __privateMethod(this, _LRUCache_instances, moveToTail_fn).call(this, index);
        if (updateAgeOnGet) {
          __privateGet(this, _updateItemAge).call(this, index);
        }
        if (status)
          __privateGet(this, _statusTTL).call(this, status, index);
        return v;
      }
      const p = __privateMethod(this, _LRUCache_instances, backgroundFetch_fn).call(this, k, index, options, context);
      const hasStale = p.__staleWhileFetching !== void 0;
      const staleVal = hasStale && allowStale;
      if (status) {
        status.fetch = isStale ? "stale" : "refresh";
        if (staleVal && isStale)
          status.returnedStale = true;
      }
      return staleVal ? p.__staleWhileFetching : p.__returned = p;
    }
  }
  async forceFetch(k, fetchOptions = {}) {
    const v = await this.fetch(k, fetchOptions);
    if (v === void 0)
      throw new Error("fetch() returned undefined");
    return v;
  }
  memo(k, memoOptions = {}) {
    const memoMethod = __privateGet(this, _memoMethod);
    if (!memoMethod) {
      throw new Error("no memoMethod provided to constructor");
    }
    const { context, forceRefresh: forceRefresh2, ...options } = memoOptions;
    const v = this.get(k, options);
    if (!forceRefresh2 && v !== void 0)
      return v;
    const vv = memoMethod(k, v, {
      options,
      context
    });
    this.set(k, vv, options);
    return vv;
  }
  /**
   * Return a value from the cache. Will update the recency of the cache
   * entry found.
   *
   * If the key is not found, get() will return `undefined`.
   */
  get(k, getOptions = {}) {
    const { allowStale = this.allowStale, updateAgeOnGet = this.updateAgeOnGet, noDeleteOnStaleGet = this.noDeleteOnStaleGet, status } = getOptions;
    const index = __privateGet(this, _keyMap).get(k);
    if (index !== void 0) {
      const value = __privateGet(this, _valList)[index];
      const fetching = __privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, value);
      if (status)
        __privateGet(this, _statusTTL).call(this, status, index);
      if (__privateGet(this, _isStale).call(this, index)) {
        if (status)
          status.get = "stale";
        if (!fetching) {
          if (!noDeleteOnStaleGet) {
            __privateMethod(this, _LRUCache_instances, delete_fn).call(this, k, "expire");
          }
          if (status && allowStale)
            status.returnedStale = true;
          return allowStale ? value : void 0;
        } else {
          if (status && allowStale && value.__staleWhileFetching !== void 0) {
            status.returnedStale = true;
          }
          return allowStale ? value.__staleWhileFetching : void 0;
        }
      } else {
        if (status)
          status.get = "hit";
        if (fetching) {
          return value.__staleWhileFetching;
        }
        __privateMethod(this, _LRUCache_instances, moveToTail_fn).call(this, index);
        if (updateAgeOnGet) {
          __privateGet(this, _updateItemAge).call(this, index);
        }
        return value;
      }
    } else if (status) {
      status.get = "miss";
    }
  }
  /**
   * Deletes a key out of the cache.
   *
   * Returns true if the key was deleted, false otherwise.
   */
  delete(k) {
    return __privateMethod(this, _LRUCache_instances, delete_fn).call(this, k, "delete");
  }
  /**
   * Clear the cache entirely, throwing away all values.
   */
  clear() {
    return __privateMethod(this, _LRUCache_instances, clear_fn).call(this, "delete");
  }
};
_max = new WeakMap();
_maxSize = new WeakMap();
_dispose = new WeakMap();
_disposeAfter = new WeakMap();
_fetchMethod = new WeakMap();
_memoMethod = new WeakMap();
_size = new WeakMap();
_calculatedSize = new WeakMap();
_keyMap = new WeakMap();
_keyList = new WeakMap();
_valList = new WeakMap();
_next = new WeakMap();
_prev = new WeakMap();
_head = new WeakMap();
_tail = new WeakMap();
_free = new WeakMap();
_disposed = new WeakMap();
_sizes = new WeakMap();
_starts = new WeakMap();
_ttls = new WeakMap();
_hasDispose = new WeakMap();
_hasFetchMethod = new WeakMap();
_hasDisposeAfter = new WeakMap();
_LRUCache_instances = new WeakSet();
initializeTTLTracking_fn = function() {
  const ttls = new ZeroArray(__privateGet(this, _max));
  const starts = new ZeroArray(__privateGet(this, _max));
  __privateSet(this, _ttls, ttls);
  __privateSet(this, _starts, starts);
  __privateSet(this, _setItemTTL, (index, ttl, start = perf.now()) => {
    starts[index] = ttl !== 0 ? start : 0;
    ttls[index] = ttl;
    if (ttl !== 0 && this.ttlAutopurge) {
      const t = setTimeout(() => {
        if (__privateGet(this, _isStale).call(this, index)) {
          __privateMethod(this, _LRUCache_instances, delete_fn).call(this, __privateGet(this, _keyList)[index], "expire");
        }
      }, ttl + 1);
      if (t.unref) {
        t.unref();
      }
    }
  });
  __privateSet(this, _updateItemAge, (index) => {
    starts[index] = ttls[index] !== 0 ? perf.now() : 0;
  });
  __privateSet(this, _statusTTL, (status, index) => {
    if (ttls[index]) {
      const ttl = ttls[index];
      const start = starts[index];
      if (!ttl || !start)
        return;
      status.ttl = ttl;
      status.start = start;
      status.now = cachedNow || getNow();
      const age = status.now - start;
      status.remainingTTL = ttl - age;
    }
  });
  let cachedNow = 0;
  const getNow = () => {
    const n = perf.now();
    if (this.ttlResolution > 0) {
      cachedNow = n;
      const t = setTimeout(() => cachedNow = 0, this.ttlResolution);
      if (t.unref) {
        t.unref();
      }
    }
    return n;
  };
  this.getRemainingTTL = (key) => {
    const index = __privateGet(this, _keyMap).get(key);
    if (index === void 0) {
      return 0;
    }
    const ttl = ttls[index];
    const start = starts[index];
    if (!ttl || !start) {
      return Infinity;
    }
    const age = (cachedNow || getNow()) - start;
    return ttl - age;
  };
  __privateSet(this, _isStale, (index) => {
    const s = starts[index];
    const t = ttls[index];
    return !!t && !!s && (cachedNow || getNow()) - s > t;
  });
};
_updateItemAge = new WeakMap();
_statusTTL = new WeakMap();
_setItemTTL = new WeakMap();
_isStale = new WeakMap();
initializeSizeTracking_fn = function() {
  const sizes = new ZeroArray(__privateGet(this, _max));
  __privateSet(this, _calculatedSize, 0);
  __privateSet(this, _sizes, sizes);
  __privateSet(this, _removeItemSize, (index) => {
    __privateSet(this, _calculatedSize, __privateGet(this, _calculatedSize) - sizes[index]);
    sizes[index] = 0;
  });
  __privateSet(this, _requireSize, (k, v, size, sizeCalculation) => {
    if (__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v)) {
      return 0;
    }
    if (!isPosInt(size)) {
      if (sizeCalculation) {
        if (typeof sizeCalculation !== "function") {
          throw new TypeError("sizeCalculation must be a function");
        }
        size = sizeCalculation(v, k);
        if (!isPosInt(size)) {
          throw new TypeError("sizeCalculation return invalid (expect positive integer)");
        }
      } else {
        throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
      }
    }
    return size;
  });
  __privateSet(this, _addItemSize, (index, size, status) => {
    sizes[index] = size;
    if (__privateGet(this, _maxSize)) {
      const maxSize = __privateGet(this, _maxSize) - sizes[index];
      while (__privateGet(this, _calculatedSize) > maxSize) {
        __privateMethod(this, _LRUCache_instances, evict_fn).call(this, true);
      }
    }
    __privateSet(this, _calculatedSize, __privateGet(this, _calculatedSize) + sizes[index]);
    if (status) {
      status.entrySize = size;
      status.totalCalculatedSize = __privateGet(this, _calculatedSize);
    }
  });
};
_removeItemSize = new WeakMap();
_addItemSize = new WeakMap();
_requireSize = new WeakMap();
indexes_fn = function* ({ allowStale = this.allowStale } = {}) {
  if (__privateGet(this, _size)) {
    for (let i = __privateGet(this, _tail); true; ) {
      if (!__privateMethod(this, _LRUCache_instances, isValidIndex_fn).call(this, i)) {
        break;
      }
      if (allowStale || !__privateGet(this, _isStale).call(this, i)) {
        yield i;
      }
      if (i === __privateGet(this, _head)) {
        break;
      } else {
        i = __privateGet(this, _prev)[i];
      }
    }
  }
};
rindexes_fn = function* ({ allowStale = this.allowStale } = {}) {
  if (__privateGet(this, _size)) {
    for (let i = __privateGet(this, _head); true; ) {
      if (!__privateMethod(this, _LRUCache_instances, isValidIndex_fn).call(this, i)) {
        break;
      }
      if (allowStale || !__privateGet(this, _isStale).call(this, i)) {
        yield i;
      }
      if (i === __privateGet(this, _tail)) {
        break;
      } else {
        i = __privateGet(this, _next)[i];
      }
    }
  }
};
isValidIndex_fn = function(index) {
  return index !== void 0 && __privateGet(this, _keyMap).get(__privateGet(this, _keyList)[index]) === index;
};
evict_fn = function(free) {
  var _a2;
  const head = __privateGet(this, _head);
  const k = __privateGet(this, _keyList)[head];
  const v = __privateGet(this, _valList)[head];
  if (__privateGet(this, _hasFetchMethod) && __privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v)) {
    v.__abortController.abort(new Error("evicted"));
  } else if (__privateGet(this, _hasDispose) || __privateGet(this, _hasDisposeAfter)) {
    if (__privateGet(this, _hasDispose)) {
      (_a2 = __privateGet(this, _dispose)) == null ? void 0 : _a2.call(this, v, k, "evict");
    }
    if (__privateGet(this, _hasDisposeAfter)) {
      __privateGet(this, _disposed)?.push([v, k, "evict"]);
    }
  }
  __privateGet(this, _removeItemSize).call(this, head);
  if (free) {
    __privateGet(this, _keyList)[head] = void 0;
    __privateGet(this, _valList)[head] = void 0;
    __privateGet(this, _free).push(head);
  }
  if (__privateGet(this, _size) === 1) {
    __privateSet(this, _head, __privateSet(this, _tail, 0));
    __privateGet(this, _free).length = 0;
  } else {
    __privateSet(this, _head, __privateGet(this, _next)[head]);
  }
  __privateGet(this, _keyMap).delete(k);
  __privateWrapper(this, _size)._--;
  return head;
};
backgroundFetch_fn = function(k, index, options, context) {
  const v = index === void 0 ? void 0 : __privateGet(this, _valList)[index];
  if (__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v)) {
    return v;
  }
  const ac = new AC();
  const { signal } = options;
  signal?.addEventListener("abort", () => ac.abort(signal.reason), {
    signal: ac.signal
  });
  const fetchOpts = {
    signal: ac.signal,
    options,
    context
  };
  const cb = (v2, updateCache = false) => {
    const { aborted } = ac.signal;
    const ignoreAbort = options.ignoreFetchAbort && v2 !== void 0;
    if (options.status) {
      if (aborted && !updateCache) {
        options.status.fetchAborted = true;
        options.status.fetchError = ac.signal.reason;
        if (ignoreAbort)
          options.status.fetchAbortIgnored = true;
      } else {
        options.status.fetchResolved = true;
      }
    }
    if (aborted && !ignoreAbort && !updateCache) {
      return fetchFail(ac.signal.reason);
    }
    const bf2 = p;
    if (__privateGet(this, _valList)[index] === p) {
      if (v2 === void 0) {
        if (bf2.__staleWhileFetching) {
          __privateGet(this, _valList)[index] = bf2.__staleWhileFetching;
        } else {
          __privateMethod(this, _LRUCache_instances, delete_fn).call(this, k, "fetch");
        }
      } else {
        if (options.status)
          options.status.fetchUpdated = true;
        this.set(k, v2, fetchOpts.options);
      }
    }
    return v2;
  };
  const eb = (er) => {
    if (options.status) {
      options.status.fetchRejected = true;
      options.status.fetchError = er;
    }
    return fetchFail(er);
  };
  const fetchFail = (er) => {
    const { aborted } = ac.signal;
    const allowStaleAborted = aborted && options.allowStaleOnFetchAbort;
    const allowStale = allowStaleAborted || options.allowStaleOnFetchRejection;
    const noDelete = allowStale || options.noDeleteOnFetchRejection;
    const bf2 = p;
    if (__privateGet(this, _valList)[index] === p) {
      const del = !noDelete || bf2.__staleWhileFetching === void 0;
      if (del) {
        __privateMethod(this, _LRUCache_instances, delete_fn).call(this, k, "fetch");
      } else if (!allowStaleAborted) {
        __privateGet(this, _valList)[index] = bf2.__staleWhileFetching;
      }
    }
    if (allowStale) {
      if (options.status && bf2.__staleWhileFetching !== void 0) {
        options.status.returnedStale = true;
      }
      return bf2.__staleWhileFetching;
    } else if (bf2.__returned === bf2) {
      throw er;
    }
  };
  const pcall = (res, rej) => {
    var _a2;
    const fmp = (_a2 = __privateGet(this, _fetchMethod)) == null ? void 0 : _a2.call(this, k, v, fetchOpts);
    if (fmp && fmp instanceof Promise) {
      fmp.then((v2) => res(v2 === void 0 ? void 0 : v2), rej);
    }
    ac.signal.addEventListener("abort", () => {
      if (!options.ignoreFetchAbort || options.allowStaleOnFetchAbort) {
        res(void 0);
        if (options.allowStaleOnFetchAbort) {
          res = (v2) => cb(v2, true);
        }
      }
    });
  };
  if (options.status)
    options.status.fetchDispatched = true;
  const p = new Promise(pcall).then(cb, eb);
  const bf = Object.assign(p, {
    __abortController: ac,
    __staleWhileFetching: v,
    __returned: void 0
  });
  if (index === void 0) {
    this.set(k, bf, { ...fetchOpts.options, status: void 0 });
    index = __privateGet(this, _keyMap).get(k);
  } else {
    __privateGet(this, _valList)[index] = bf;
  }
  return bf;
};
isBackgroundFetch_fn = function(p) {
  if (!__privateGet(this, _hasFetchMethod))
    return false;
  const b = p;
  return !!b && b instanceof Promise && b.hasOwnProperty("__staleWhileFetching") && b.__abortController instanceof AC;
};
connect_fn = function(p, n) {
  __privateGet(this, _prev)[n] = p;
  __privateGet(this, _next)[p] = n;
};
moveToTail_fn = function(index) {
  if (index !== __privateGet(this, _tail)) {
    if (index === __privateGet(this, _head)) {
      __privateSet(this, _head, __privateGet(this, _next)[index]);
    } else {
      __privateMethod(this, _LRUCache_instances, connect_fn).call(this, __privateGet(this, _prev)[index], __privateGet(this, _next)[index]);
    }
    __privateMethod(this, _LRUCache_instances, connect_fn).call(this, __privateGet(this, _tail), index);
    __privateSet(this, _tail, index);
  }
};
delete_fn = function(k, reason) {
  var _a2, _b2;
  let deleted = false;
  if (__privateGet(this, _size) !== 0) {
    const index = __privateGet(this, _keyMap).get(k);
    if (index !== void 0) {
      deleted = true;
      if (__privateGet(this, _size) === 1) {
        __privateMethod(this, _LRUCache_instances, clear_fn).call(this, reason);
      } else {
        __privateGet(this, _removeItemSize).call(this, index);
        const v = __privateGet(this, _valList)[index];
        if (__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v)) {
          v.__abortController.abort(new Error("deleted"));
        } else if (__privateGet(this, _hasDispose) || __privateGet(this, _hasDisposeAfter)) {
          if (__privateGet(this, _hasDispose)) {
            (_a2 = __privateGet(this, _dispose)) == null ? void 0 : _a2.call(this, v, k, reason);
          }
          if (__privateGet(this, _hasDisposeAfter)) {
            __privateGet(this, _disposed)?.push([v, k, reason]);
          }
        }
        __privateGet(this, _keyMap).delete(k);
        __privateGet(this, _keyList)[index] = void 0;
        __privateGet(this, _valList)[index] = void 0;
        if (index === __privateGet(this, _tail)) {
          __privateSet(this, _tail, __privateGet(this, _prev)[index]);
        } else if (index === __privateGet(this, _head)) {
          __privateSet(this, _head, __privateGet(this, _next)[index]);
        } else {
          const pi = __privateGet(this, _prev)[index];
          __privateGet(this, _next)[pi] = __privateGet(this, _next)[index];
          const ni = __privateGet(this, _next)[index];
          __privateGet(this, _prev)[ni] = __privateGet(this, _prev)[index];
        }
        __privateWrapper(this, _size)._--;
        __privateGet(this, _free).push(index);
      }
    }
  }
  if (__privateGet(this, _hasDisposeAfter) && __privateGet(this, _disposed)?.length) {
    const dt = __privateGet(this, _disposed);
    let task;
    while (task = dt?.shift()) {
      (_b2 = __privateGet(this, _disposeAfter)) == null ? void 0 : _b2.call(this, ...task);
    }
  }
  return deleted;
};
clear_fn = function(reason) {
  var _a2, _b2;
  for (const index of __privateMethod(this, _LRUCache_instances, rindexes_fn).call(this, { allowStale: true })) {
    const v = __privateGet(this, _valList)[index];
    if (__privateMethod(this, _LRUCache_instances, isBackgroundFetch_fn).call(this, v)) {
      v.__abortController.abort(new Error("deleted"));
    } else {
      const k = __privateGet(this, _keyList)[index];
      if (__privateGet(this, _hasDispose)) {
        (_a2 = __privateGet(this, _dispose)) == null ? void 0 : _a2.call(this, v, k, reason);
      }
      if (__privateGet(this, _hasDisposeAfter)) {
        __privateGet(this, _disposed)?.push([v, k, reason]);
      }
    }
  }
  __privateGet(this, _keyMap).clear();
  __privateGet(this, _valList).fill(void 0);
  __privateGet(this, _keyList).fill(void 0);
  if (__privateGet(this, _ttls) && __privateGet(this, _starts)) {
    __privateGet(this, _ttls).fill(0);
    __privateGet(this, _starts).fill(0);
  }
  if (__privateGet(this, _sizes)) {
    __privateGet(this, _sizes).fill(0);
  }
  __privateSet(this, _head, 0);
  __privateSet(this, _tail, 0);
  __privateGet(this, _free).length = 0;
  __privateSet(this, _calculatedSize, 0);
  __privateSet(this, _size, 0);
  if (__privateGet(this, _hasDisposeAfter) && __privateGet(this, _disposed)) {
    const dt = __privateGet(this, _disposed);
    let task;
    while (task = dt?.shift()) {
      (_b2 = __privateGet(this, _disposeAfter)) == null ? void 0 : _b2.call(this, ...task);
    }
  }
};
var LRUCache = _LRUCache;

// extensions/games/game-baldursgate3/cache.ts
var _PakInfoCache = class _PakInfoCache {
  static getInstance(api) {
    if (!_PakInfoCache.instance) {
      _PakInfoCache.instance = new _PakInfoCache(api);
    }
    return _PakInfoCache.instance;
  }
  constructor(api) {
    this.mApi = api;
    this.mCache = new LRUCache({ max: 700 });
    this.load(api);
  }
  async getCacheEntry(api, filePath, mod) {
    const id = this.fileId(filePath);
    const stat = await import_vortex_api6.fs.statAsync(filePath);
    const ctime = stat.ctimeMs;
    const hasChanged = (entry) => {
      return !!mod && !!entry.mod ? mod.attributes?.fileId !== entry.mod.attributes?.fileId : ctime !== entry?.lastModified;
    };
    const cacheEntry = await this.mCache.get(id);
    const packageNotListed = (cacheEntry?.packageList || []).length === 0;
    if (!cacheEntry || hasChanged(cacheEntry) || packageNotListed) {
      const packageList = await listPackage(api, filePath);
      const isListed = this.isLOListed(api, filePath, packageList);
      const info = await extractPakInfoImpl(api, filePath, mod, isListed);
      this.mCache.set(id, {
        fileName: path4.basename(filePath),
        lastModified: ctime,
        info,
        packageList,
        mod,
        isListed
      });
    }
    return this.mCache.get(id);
  }
  reset() {
    this.mCache = new LRUCache({ max: 700 });
    this.save();
  }
  async save() {
    if (!this.mCache) {
      return;
    }
    const state = this.mApi.getState();
    const profileId = import_vortex_api6.selectors.lastActiveProfileForGame(state, GAME_ID);
    const staging = import_vortex_api6.selectors.installPathForGame(state, GAME_ID);
    const cachePath = path4.join(path4.dirname(staging), "cache", profileId + ".json");
    try {
      await import_vortex_api6.fs.ensureDirWritableAsync(path4.dirname(cachePath));
      const cacheData = Array.from(this.mCache.entries());
      await import_vortex_api6.util.writeFileAtomic(cachePath, JSON.stringify(cacheData));
    } catch (err) {
      (0, import_vortex_api6.log)("error", "failed to save cache", err);
      return;
    }
  }
  async load(api) {
    const state = api.getState();
    const profileId = import_vortex_api6.selectors.lastActiveProfileForGame(state, GAME_ID);
    const staging = import_vortex_api6.selectors.installPathForGame(state, GAME_ID);
    const cachePath = path4.join(path4.dirname(staging), "cache", profileId + ".json");
    try {
      await import_vortex_api6.fs.ensureDirWritableAsync(path4.dirname(cachePath));
      const data = await import_vortex_api6.fs.readFileAsync(cachePath, { encoding: "utf8" });
      const cacheData = JSON.parse(data);
      if (Array.isArray(cacheData)) {
        for (const [key, value] of cacheData) {
          this.mCache.set(key, value);
        }
      }
    } catch (err) {
      if (!["ENOENT"].includes(err.code)) {
        (0, import_vortex_api6.log)("error", "failed to load cache", err);
      }
    }
  }
  isLOListed(api, pakPath, packageList) {
    try {
      const containsMetaFile = packageList.find((line) => path4.basename(line.split("	")[0]).toLowerCase() === "meta.lsx") !== void 0 ? true : false;
      return !containsMetaFile;
    } catch (err) {
      api.sendNotification({
        type: "error",
        message: `${path4.basename(pakPath)} couldn't be read correctly. This mod be incorrectly locked/unlocked but will default to unlocked.`
      });
      return false;
    }
  }
  fileId(filePath) {
    return path4.basename(filePath).toUpperCase();
  }
};
_PakInfoCache.instance = null;
var PakInfoCache = _PakInfoCache;

// extensions/games/game-baldursgate3/loadOrder.ts
async function serialize(context, loadOrder, profileId) {
  const props = genProps(context);
  if (props === void 0) {
    return Promise.reject(new import_vortex_api7.util.ProcessCanceled("invalid props"));
  }
  const state = context.api.getState();
  const loFilePath = await ensureLOFile(context, profileId, props);
  logDebug("serialize loadOrder=", loadOrder);
  await import_vortex_api7.fs.removeAsync(loFilePath).catch({ code: "ENOENT" }, () => Promise.resolve());
  await import_vortex_api7.fs.writeFileAsync(loFilePath, JSON.stringify(loadOrder), { encoding: "utf8" });
  const autoExportToGame = state.settings["baldursgate3"].autoExportLoadOrder ?? false;
  logDebug("serialize autoExportToGame=", autoExportToGame);
  if (autoExportToGame)
    await exportToGame(context.api);
  return Promise.resolve();
}
async function deserialize(context) {
  const props = genProps(context);
  if (props?.profile?.gameId !== GAME_ID) {
    return [];
  }
  const paks = await readPAKs(context.api);
  const loFilePath = await ensureLOFile(context);
  const fileData = await import_vortex_api7.fs.readFileAsync(loFilePath, { encoding: "utf8" });
  let loadOrder = [];
  try {
    try {
      loadOrder = JSON.parse(fileData);
    } catch (err) {
      (0, import_vortex_api7.log)("error", "Corrupt load order file", err);
      await new Promise((resolve, reject) => {
        props.api.showDialog("error", "Corrupt load order file", {
          bbcode: props.api.translate("The load order file is in a corrupt state. You can try to fix it yourself or Vortex can regenerate the file for you, but that may result in loss of data (Will only affect load order items you added manually, if any).")
        }, [
          { label: "Cancel", action: () => reject(err) },
          {
            label: "Regenerate File",
            action: async () => {
              await import_vortex_api7.fs.removeAsync(loFilePath).catch({ code: "ENOENT" }, () => Promise.resolve());
              loadOrder = [];
              return resolve();
            }
          }
        ]);
      });
    }
    logDebug("deserialize loadOrder=", loadOrder);
    const filteredLoadOrder = loadOrder.filter((entry) => paks.find((pak) => pak.fileName === entry.id));
    logDebug("deserialize filteredLoadOrder=", filteredLoadOrder);
    const processedPaks = paks.reduce((acc, curr) => {
      acc.valid.push(curr);
      return acc;
    }, { valid: [], invalid: [] });
    logDebug("deserialize processedPaks=", processedPaks);
    const addedMods = processedPaks.valid.filter((pak) => filteredLoadOrder.find((entry) => entry.id === pak.fileName) === void 0);
    logDebug("deserialize addedMods=", addedMods);
    logDebug("deserialize paks=", paks);
    addedMods.forEach((pak) => {
      filteredLoadOrder.push({
        id: pak.fileName,
        modId: pak.mod?.id,
        enabled: true,
        // not using load order for enabling/disabling      
        name: pak.info?.name || import_path2.default.basename(pak.fileName, ".pak"),
        data: pak.info,
        locked: pak.info.isListed
      });
    });
    return filteredLoadOrder.sort((a, b) => +b.locked - +a.locked);
  } catch (err) {
    return Promise.reject(err);
  }
}
async function importFromBG3MM(context) {
  const api = context.api;
  const options = {
    title: api.translate("Please choose a BG3MM .json load order file to import from"),
    filters: [{ name: "BG3MM Load Order", extensions: ["json"] }]
  };
  const selectedPath = await api.selectFile(options);
  logDebug("importFromBG3MM selectedPath=", selectedPath);
  if (selectedPath === void 0) {
    return;
  }
  try {
    const data = await import_vortex_api7.fs.readFileAsync(selectedPath, { encoding: "utf8" });
    const loadOrder = JSON.parse(data);
    logDebug("importFromBG3MM loadOrder=", loadOrder);
    const getIndex = (uuid) => {
      const index = loadOrder.findIndex((entry) => entry.UUID !== void 0 && entry.UUID === uuid);
      return index !== -1 ? index : Infinity;
    };
    const state = api.getState();
    const profileId = import_vortex_api7.selectors.activeProfile(state)?.id;
    const currentLoadOrder = import_vortex_api7.util.getSafe(state, ["persistent", "loadOrder", profileId], []);
    const newLO = [...currentLoadOrder].sort((a, b) => getIndex(a.data?.uuid) - getIndex(b.data?.uuid));
    await serialize(context, newLO, profileId);
  } catch (err) {
    api.showErrorNotification("Failed to import BG3MM load order file", err, { allowReport: false });
  } finally {
    forceRefresh(context.api);
  }
}
async function importModSettingsFile(api) {
  const state = api.getState();
  const profileId = import_vortex_api7.selectors.activeProfile(state)?.id;
  const options = {
    title: api.translate("Please choose a BG3 .lsx file to import from"),
    filters: [{ name: "BG3 Load Order", extensions: ["lsx"] }]
  };
  const selectedPath = await api.selectFile(options);
  logDebug("importModSettingsFile selectedPath=", selectedPath);
  if (selectedPath === void 0)
    return;
  processLsxFile(api, selectedPath);
}
async function importModSettingsGame(api) {
  const bg3ProfileId = await getActivePlayerProfile(api);
  const gameSettingsPath = import_path2.default.join(profilesPath(), bg3ProfileId, "modsettings.lsx");
  logDebug("importModSettingsGame gameSettingsPath=", gameSettingsPath);
  processLsxFile(api, gameSettingsPath);
}
function checkIfDuplicateExists(arr) {
  return new Set(arr).size !== arr.length;
}
async function getNodes(lsxPath) {
  const lsxLoadOrder = await readLsxFile(lsxPath);
  logDebug("processLsxFile lsxPath=", lsxPath);
  const region = findNode(lsxLoadOrder?.save?.region, "ModuleSettings");
  const root = findNode(region?.node, "root");
  const modsNode = findNode(root?.children?.[0]?.node, "Mods");
  const modsOrderNode = findNode(root?.children?.[0]?.node, "ModOrder");
  return { region, root, modsNode, modsOrderNode };
}
async function processLsxFile(api, lsxPath) {
  const state = api.getState();
  const profileId = import_vortex_api7.selectors.activeProfile(state)?.id;
  api.sendNotification({
    id: NOTIF_IMPORT_ACTIVITY,
    title: "Importing LSX File",
    message: lsxPath,
    type: "activity",
    noDismiss: true,
    allowSuppress: false
  });
  try {
    const { modsNode, modsOrderNode } = await getNodes(lsxPath);
    if (modsNode?.children === void 0 || modsNode?.children[0] === "") {
      modsNode.children = [{ node: [] }];
    }
    const format = await getDefaultModSettingsFormat(api);
    let loNode = ["v7", "v8"].includes(format) ? modsNode : modsOrderNode !== void 0 ? modsOrderNode : modsNode;
    let uuidArray = loNode?.children !== void 0 ? loNode.children[0].node.map((loEntry) => loEntry.attribute.find((attr) => attr.$.id === "UUID").$.value) : [];
    logDebug(`processLsxFile uuidArray=`, uuidArray);
    if (checkIfDuplicateExists(uuidArray)) {
      api.sendNotification({
        type: "warning",
        id: "bg3-loadorder-imported-duplicate",
        title: "Duplicate Entries",
        message: "Duplicate UUIDs found in the ModOrder section of the .lsx file being imported. This sometimes can cause issues with the load order."
        //displayMS: 3000
      });
      uuidArray = Array.from(new Set(uuidArray));
    }
    const lsxModNodes = modsNode.children[0].node;
    logDebug(`processLsxFile lsxModNodes=`, lsxModNodes);
    const paks = await readPAKs(api);
    const missing = paks.reduce((acc, curr) => {
      if (curr.mod === void 0) {
        return acc;
      }
      if (lsxModNodes.find((lsxEntry) => lsxEntry.attribute.find((attr) => attr.$.id === "Name" && attr.$.value === curr.info.name)) === void 0)
        acc.push(curr);
      return acc;
    }, []);
    logDebug("processLsxFile - missing pak files that have associated mods =", missing);
    let newLoadOrder = lsxModNodes.reduce((acc, curr) => {
      const pak = paks.find((pak2) => pak2.info.name === curr.attribute.find((attr) => attr.$.id === "Name").$.value);
      if (pak !== void 0) {
        acc.push({
          id: pak.fileName,
          modId: pak?.mod?.id,
          enabled: true,
          name: pak.info?.name || import_path2.default.basename(pak.fileName, ".pak"),
          data: pak.info,
          locked: pak.info.isListed
        });
      }
      return acc;
    }, []);
    logDebug("processLsxFile (before adding missing) newLoadOrder=", newLoadOrder);
    missing.forEach((pak) => {
      newLoadOrder.push({
        id: pak.fileName,
        modId: pak?.mod?.id,
        enabled: true,
        name: pak.info?.name || import_path2.default.basename(pak.fileName, ".pak"),
        data: pak.info,
        locked: pak.info.isListed
      });
    });
    logDebug("processLsxFile (after adding missing) newLoadOrder=", newLoadOrder);
    newLoadOrder.sort((a, b) => +b.locked - +a.locked);
    logDebug("processLsxFile (after sorting) newLoadOrder=", newLoadOrder);
    api.store.dispatch(import_vortex_api7.actions.setFBLoadOrder(profileId, newLoadOrder));
    api.dismissNotification("bg3-loadorder-import-activity");
    api.sendNotification({
      type: "success",
      id: "bg3-loadorder-imported",
      title: "Load Order Imported",
      message: lsxPath,
      displayMS: 3e3
    });
    logDebug("processLsxFile finished");
  } catch (err) {
    api.dismissNotification(NOTIF_IMPORT_ACTIVITY);
    api.showErrorNotification("Failed to import load order", err, {
      allowReport: false
    });
  }
}
async function exportTo(api, filepath) {
  const state = api.getState();
  const profileId = import_vortex_api7.selectors.activeProfile(state)?.id;
  const loadOrder = import_vortex_api7.util.getSafe(api.getState(), ["persistent", "loadOrder", profileId], []);
  logDebug("exportTo loadOrder=", loadOrder);
  try {
    const modSettings = await readModSettings2(api);
    const modSettingsFormat = await getDefaultModSettingsFormat(api);
    const region = findNode(modSettings?.save?.region, "ModuleSettings");
    const root = findNode(region?.node, "root");
    const modsNode = findNode(root?.children?.[0]?.node, "Mods");
    if (modsNode.children === void 0 || modsNode.children[0] === "") {
      modsNode.children = [{ node: [] }];
    }
    const descriptionNodes = modsNode?.children?.[0]?.node?.filter?.((iter) => iter.attribute.find((attr) => attr.$.id === "Name" && attr.$.value.startsWith("Gustav"))) ?? [];
    const filteredPaks = loadOrder.filter((entry) => !!entry.data?.uuid && entry.enabled && !entry.data?.isListed);
    logDebug("exportTo filteredPaks=", filteredPaks);
    for (const entry of filteredPaks) {
      const attributeOrder = ["Folder", "MD5", "Name", "PublishHandle", "UUID", "Version64", "Version"];
      const attributes = ["v7", "v8"].includes(modSettingsFormat) ? [
        { $: { id: "Folder", type: "LSString", value: entry.data.folder } },
        { $: { id: "Name", type: "LSString", value: entry.data.name } },
        { $: { id: "PublishHandle", type: "uint64", value: 0 } },
        { $: { id: "Version64", type: "int64", value: entry.data.version } },
        { $: { id: "UUID", type: "guid", value: entry.data.uuid } }
      ] : [
        { $: { id: "Folder", type: "LSWString", value: entry.data.folder } },
        { $: { id: "Name", type: "FixedString", value: entry.data.name } },
        { $: { id: "UUID", type: "FixedString", value: entry.data.uuid } },
        { $: { id: "Version", type: "int32", value: entry.data.version } }
      ];
      descriptionNodes.push({
        $: { id: "ModuleShortDesc" },
        attribute: [].concat(attributes, [{ $: { id: "MD5", type: "LSString", value: entry.data.md5 } }]).sort((a, b) => attributeOrder.indexOf(a.$.id) - attributeOrder.indexOf(b.$.id))
      });
    }
    const loadOrderNodes = filteredPaks.map((entry) => ({
      $: { id: "Module" },
      attribute: [
        { $: { id: "UUID", type: "FixedString", value: entry.data.uuid } }
      ]
    }));
    modsNode.children[0].node = descriptionNodes;
    if (!["v7", "v8"].includes(modSettingsFormat)) {
      let modOrderNode = findNode(root?.children?.[0]?.node, "ModOrder");
      let insertNode = false;
      if (!modOrderNode) {
        insertNode = true;
        modOrderNode = { $: { id: "ModOrder" }, children: [{ node: [] }] };
      }
      if (modOrderNode.children === void 0 || modOrderNode.children[0] === "") {
        modOrderNode.children = [{ node: [] }];
      }
      modOrderNode.children[0].node = loadOrderNodes;
      if (insertNode && !!root?.children?.[0]?.node) {
        root?.children?.[0]?.node.splice(0, 0, modOrderNode);
      }
    }
    writeModSettings(api, modSettings, filepath);
    api.sendNotification({
      type: "success",
      id: "bg3-loadorder-exported",
      title: "Load Order Exported",
      message: filepath,
      displayMS: 3e3
    });
  } catch (err) {
    api.showErrorNotification("Failed to write load order", err, {
      allowReport: false,
      message: "Please run the game at least once and create a profile in-game"
    });
  }
}
async function exportToFile(api) {
  let selectedPath;
  if (api.saveFile !== void 0) {
    const options = {
      title: api.translate("Please choose a BG3 .lsx file to export to"),
      filters: [{ name: "BG3 Load Order", extensions: ["lsx"] }]
    };
    selectedPath = await api.saveFile(options);
  } else {
    const options = {
      title: api.translate("Please choose a BG3 .lsx file to export to"),
      filters: [{ name: "BG3 Load Order", extensions: ["lsx"] }],
      create: true
    };
    selectedPath = await api.selectFile(options);
  }
  logDebug(`exportToFile ${selectedPath}`);
  if (selectedPath === void 0)
    return;
  exportTo(api, selectedPath);
}
async function exportToGame(api) {
  const bg3ProfileId = await getActivePlayerProfile(api);
  const settingsPath = import_path2.default.join(profilesPath(), bg3ProfileId, "modsettings.lsx");
  logDebug(`exportToGame ${settingsPath}`);
  exportTo(api, settingsPath);
}
async function readModSettings2(api) {
  const bg3ProfileId = await getActivePlayerProfile(api);
  const settingsPath = import_path2.default.join(profilesPath(), bg3ProfileId, "modsettings.lsx");
  const dat = await import_vortex_api7.fs.readFileAsync(settingsPath, { encoding: "utf8" });
  logDebug("readModSettings", dat);
  return (0, import_xml2js2.parseStringPromise)(dat);
}
async function readLsxFile(lsxPath) {
  const dat = await import_vortex_api7.fs.readFileAsync(lsxPath);
  logDebug("lsxPath", dat);
  return (0, import_xml2js2.parseStringPromise)(dat);
}
async function writeModSettings(api, data, filepath) {
  const format = await getDefaultModSettingsFormat(api);
  const builder = ["v7", "v8"].includes(format) ? new import_xml2js2.Builder({ renderOpts: { pretty: true, indent: "    " } }) : new import_xml2js2.Builder();
  const xml = builder.buildObject(data);
  try {
    await import_vortex_api7.fs.ensureDirWritableAsync(import_path2.default.dirname(filepath));
    await import_vortex_api7.fs.writeFileAsync(filepath, xml);
  } catch (err) {
    api.showErrorNotification("Failed to write mod settings", err);
    return;
  }
}
async function validate(prev, current) {
  return void 0;
}
async function readPAKs(api) {
  const state = api.getState();
  const lsLib = getLatestLSLibMod2(api);
  if (lsLib === void 0) {
    return [];
  }
  const paks = await readPAKList(api);
  let manifest;
  try {
    manifest = await import_vortex_api7.util.getManifest(api, "", GAME_ID);
  } catch (err) {
    const allowReport = !["EPERM"].includes(err.code);
    api.showErrorNotification("Failed to read deployment manifest", err, { allowReport });
    return [];
  }
  api.sendNotification({
    type: "activity",
    id: "bg3-reading-paks-activity",
    message: "Reading PAK files. This might take a while..."
  });
  const cache = PakInfoCache.getInstance(api);
  const res = await Promise.all(paks.map(async (fileName, idx) => {
    return import_vortex_api7.util.withErrorContext("reading pak", fileName, () => {
      const func = async () => {
        try {
          const manifestEntry = manifest.files.find((entry) => entry.relPath === fileName);
          const mod = manifestEntry !== void 0 ? state.persistent.mods[GAME_ID]?.[manifestEntry.source] : void 0;
          const pakPath = import_path2.default.join(modsPath(), fileName);
          return cache.getCacheEntry(api, pakPath, mod);
        } catch (err) {
          if (err instanceof DivineExecMissing) {
            const message = "The installed copy of LSLib/Divine is corrupted - please delete the existing LSLib mod entry and re-install it. Make sure to disable or add any necessary exceptions to your security software to ensure it does not interfere with Vortex/LSLib file operations.";
            api.showErrorNotification(
              "Divine executable is missing",
              message,
              { allowReport: false }
            );
            return void 0;
          }
          if (err.code !== "ENOENT") {
            api.showErrorNotification('Failed to read pak. Please make sure you are using the latest version of LSLib by using the "Re-install LSLib/Divine" toolbar button on the Mods page.', err, {
              allowReport: false,
              message: fileName
            });
          }
          return void 0;
        }
      };
      return import_bluebird.default.resolve(func());
    });
  }));
  api.dismissNotification("bg3-reading-paks-activity");
  return res.filter((iter) => iter !== void 0);
}
async function readPAKList(api) {
  let paks;
  try {
    paks = (await import_vortex_api7.fs.readdirAsync(modsPath())).filter((fileName) => import_path2.default.extname(fileName).toLowerCase() === ".pak");
  } catch (err) {
    if (err.code === "ENOENT") {
      try {
        await import_vortex_api7.fs.ensureDirWritableAsync(modsPath(), () => Promise.resolve());
      } catch (err2) {
      }
    } else {
      api.showErrorNotification("Failed to read mods directory", err, {
        id: "bg3-failed-read-mods",
        message: modsPath()
      });
    }
    paks = [];
  }
  return paks;
}
function getLatestLSLibMod2(api) {
  const state = api.getState();
  const mods = state.persistent.mods[GAME_ID];
  if (mods === void 0) {
    (0, import_vortex_api7.log)("warn", "LSLib is not installed");
    return void 0;
  }
  const lsLib = Object.keys(mods).reduce((prev, id) => {
    if (mods[id].type === "bg3-lslib-divine-tool") {
      const latestVer = import_vortex_api7.util.getSafe(prev, ["attributes", "version"], "0.0.0");
      const currentVer = import_vortex_api7.util.getSafe(mods[id], ["attributes", "version"], "0.0.0");
      try {
        if (semver3.gt(currentVer, latestVer)) {
          prev = mods[id];
        }
      } catch (err) {
        (0, import_vortex_api7.log)("warn", "invalid mod version", { modId: id, version: currentVer });
      }
    }
    return prev;
  }, void 0);
  if (lsLib === void 0) {
    (0, import_vortex_api7.log)("warn", "LSLib is not installed");
    return void 0;
  }
  return lsLib;
}
function genProps(context, profileId) {
  const api = context.api;
  const state = api.getState();
  const profile = profileId !== void 0 ? import_vortex_api7.selectors.profileById(state, profileId) : import_vortex_api7.selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return void 0;
  }
  const discovery = import_vortex_api7.util.getSafe(
    state,
    ["settings", "gameMode", "discovered", GAME_ID],
    void 0
  );
  if (discovery?.path === void 0) {
    return void 0;
  }
  const mods = import_vortex_api7.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  return { api, state, profile, mods, discovery };
}
async function ensureLOFile(context, profileId, props) {
  if (props === void 0) {
    props = genProps(context, profileId);
  }
  if (props === void 0) {
    return Promise.reject(new import_vortex_api7.util.ProcessCanceled("failed to generate game props"));
  }
  const targetPath = loadOrderFilePath(props.profile.id);
  try {
    try {
      await import_vortex_api7.fs.statAsync(targetPath);
    } catch (err) {
      await import_vortex_api7.fs.writeFileAsync(targetPath, JSON.stringify([]), { encoding: "utf8" });
    }
  } catch (err) {
    return Promise.reject(err);
  }
  return targetPath;
}
function loadOrderFilePath(profileId) {
  return import_path2.default.join(import_vortex_api7.util.getVortexPath("userData"), GAME_ID, profileId + "_" + LO_FILE_NAME);
}

// extensions/games/game-baldursgate3/migrations.tsx
var import_path3 = __toESM(require("path"));
async function migrate(api) {
  const bg3ProfileId = await getActivePlayerProfile(api);
  const settingsPath = import_path3.default.join(profilesPath(), bg3ProfileId, "modsettings.lsx");
  const backupPath = settingsPath + ".backup";
  const currentVersion = import_vortex_api8.util.getSafe(api.getState(), ["settings", "baldursgate3", "extensionVersion"], "0.0.0");
  try {
    await import_vortex_api8.fs.statAsync(backupPath);
  } catch (err) {
    logDebug(`${backupPath} doesn't exist.`);
    try {
      await import_vortex_api8.fs.statAsync(settingsPath);
      await import_vortex_api8.fs.copyAsync(settingsPath, backupPath, { overwrite: true });
      logDebug(`backup created`);
      await importModSettingsGame(api);
    } catch (err2) {
      logDebug(`${settingsPath} doesn't exist`);
    }
  } finally {
    await migrate15(api, currentVersion);
  }
}
async function migrate15(api, oldVersion) {
  const newVersion = "1.5.0";
  if (!DEBUG && semver4.gte(oldVersion, newVersion)) {
    logDebug("skipping migration");
    return Promise.resolve();
  }
  await importModSettingsGame(api);
  const t = api.translate;
  const batched = [setBG3ExtensionVersion(newVersion)];
  api.sendNotification({
    id: "bg3-patch7-info",
    type: "info",
    message: "Baldur's Gate 3 patch 7",
    allowSuppress: true,
    actions: [{
      title: "More",
      action: (dismiss) => {
        api.showDialog("info", "Baldur's Gate 3 patch 7", {
          bbcode: t(`As of Baldur's Gate 3 patch 7, the "ModFixer" mod is no longer required. Please feel free to disable it.{{bl}}Additional information about patch 7 troubleshooting can be found here: [url]{{url}}[/url]{{bl}}Please note - if you switch between different game versions/patches - make sure to purge your mods and run the game at least once so that the game can regenerate your "modsettings.lsx" file.`, { replace: {
            bl: "[br][/br][br][/br]",
            url: "https://wiki.bg3.community/en/Tutorials/patch7-troubleshooting"
          } })
        }, [{ label: "Close", action: () => {
          batched.push(import_vortex_api8.actions.suppressNotification("bg3-patch7-info", true));
          dismiss();
        } }]);
      }
    }]
  });
  import_vortex_api8.util.batchDispatch(api.store, batched);
}

// extensions/games/game-baldursgate3/installers.ts
var import_exe_version = __toESM(require("exe-version"));
var path7 = __toESM(require("path"));
var semver5 = __toESM(require("semver"));
async function testLSLib(files, gameId) {
  if (gameId !== GAME_ID) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }
  const matchedFiles = files.filter((file) => LSLIB_FILES.has(path7.basename(file).toLowerCase()));
  return Promise.resolve({
    supported: matchedFiles.length >= 2,
    requiredFiles: []
  });
}
async function testModFixer(files, gameId) {
  const notSupported = { supported: false, requiredFiles: [] };
  if (gameId !== GAME_ID) {
    return Promise.resolve(notSupported);
  }
  const lowered = files.map((file) => file.toLowerCase());
  const hasModFixerPak = lowered.find((file) => path7.basename(file) === "modfixer.pak") !== void 0;
  if (!hasModFixerPak) {
    return Promise.resolve(notSupported);
  }
  return Promise.resolve({
    supported: true,
    requiredFiles: []
  });
}
async function testEngineInjector(files, gameId) {
  const notSupported = { supported: false, requiredFiles: [] };
  if (gameId !== GAME_ID) {
    return Promise.resolve(notSupported);
  }
  const lowered = files.map((file) => file.toLowerCase());
  const hasBinFolder = lowered.find((file) => file.indexOf("bin" + path7.sep) !== -1) !== void 0;
  if (!hasBinFolder) {
    return Promise.resolve(notSupported);
  }
  return Promise.resolve({
    supported: true,
    requiredFiles: []
  });
}
async function installBG3SE(files) {
  logDebug("installBG3SE files:", files);
  files = files.filter((f) => path7.extname(f) !== "" && !f.endsWith(path7.sep));
  files = files.filter((f) => path7.extname(f) === ".dll");
  const instructions = files.reduce((accum, filePath) => {
    accum.push({
      type: "copy",
      source: filePath,
      destination: path7.basename(filePath)
    });
    return accum;
  }, []);
  logDebug("installBG3SE instructions:", instructions);
  return Promise.resolve({ instructions });
}
async function installModFixer(files) {
  logDebug("installModFixer files:", files);
  files = files.filter((f) => path7.extname(f) !== "" && !f.endsWith(path7.sep));
  files = files.filter((f) => path7.extname(f) === ".pak");
  const modFixerAttribute = { type: "attribute", key: "modFixer", value: true };
  const instructions = files.reduce((accum, filePath) => {
    accum.push({
      type: "copy",
      source: filePath,
      destination: path7.basename(filePath)
    });
    return accum;
  }, [modFixerAttribute]);
  logDebug("installModFixer instructions:", instructions);
  return Promise.resolve({ instructions });
}
async function installEngineInjector(files) {
  logDebug("installEngineInjector files:", files);
  files = files.filter((f) => path7.extname(f) !== "" && !f.endsWith(path7.sep));
  const modtypeAttr = { type: "setmodtype", value: "dinput" };
  const instructions = files.reduce((accum, filePath) => {
    const binIndex = filePath.toLowerCase().indexOf("bin" + path7.sep);
    if (binIndex !== -1) {
      logDebug(filePath.substring(binIndex));
      accum.push({
        type: "copy",
        source: filePath,
        destination: filePath.substring(binIndex)
      });
    }
    return accum;
  }, [modtypeAttr]);
  logDebug("installEngineInjector instructions:", instructions);
  return Promise.resolve({ instructions });
}
async function installLSLib(files, destinationPath) {
  const exe = files.find((file) => path7.basename(file.toLowerCase()) === "divine.exe");
  const exePath = path7.join(destinationPath, exe);
  let ver = await (0, import_exe_version.default)(exePath);
  ver = ver.split(".").slice(0, 3).join(".");
  const fileName = path7.basename(destinationPath, path7.extname(destinationPath));
  const idx = fileName.indexOf("-v");
  const fileNameVer = fileName.slice(idx + 2);
  if (semver5.valid(fileNameVer) && ver !== fileNameVer) {
    ver = fileNameVer;
  }
  const versionAttr = { type: "attribute", key: "version", value: ver };
  const modtypeAttr = { type: "setmodtype", value: "bg3-lslib-divine-tool" };
  const instructions = files.reduce((accum, filePath) => {
    if (filePath.toLowerCase().split(path7.sep).indexOf("tools") !== -1 && !filePath.endsWith(path7.sep)) {
      accum.push({
        type: "copy",
        source: filePath,
        destination: path7.join("tools", path7.basename(filePath))
      });
    }
    return accum;
  }, [modtypeAttr, versionAttr]);
  return Promise.resolve({ instructions });
}
async function testBG3SE(files, gameId) {
  if (gameId !== GAME_ID) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }
  const hasDWriteDll = files.find((file) => path7.basename(file).toLowerCase() === "dwrite.dll") !== void 0;
  return Promise.resolve({
    supported: hasDWriteDll,
    requiredFiles: []
  });
}
function testReplacer(files, gameId) {
  if (gameId !== GAME_ID) {
    return Promise.resolve({ supported: false, requiredFiles: [] });
  }
  const paks = files.filter((file) => path7.extname(file).toLowerCase() === ".pak");
  const hasGenOrPublicFolder = ["generated", "public"].some((segment) => files.find((file) => file.toLowerCase().indexOf(segment + path7.sep) !== -1) !== void 0);
  return Promise.resolve({
    supported: hasGenOrPublicFolder || paks.length === 0,
    requiredFiles: []
  });
}
async function installReplacer(files) {
  const directories = Array.from(new Set(files.map((file) => path7.dirname(file).toUpperCase())));
  let dataPath = void 0;
  const genOrPublic = directories.find((dir) => ["PUBLIC", "GENERATED"].includes(path7.basename(dir)));
  if (genOrPublic !== void 0) {
    dataPath = path7.dirname(genOrPublic);
  }
  if (dataPath === void 0) {
    dataPath = directories.find((dir) => path7.basename(dir) === "DATA");
  }
  const instructions = dataPath !== void 0 ? files.reduce((prev, filePath) => {
    if (filePath.endsWith(path7.sep)) {
      return prev;
    }
    const relPath = path7.relative(dataPath, filePath);
    if (!relPath.startsWith("..")) {
      prev.push({
        type: "copy",
        source: filePath,
        destination: relPath
      });
    }
    return prev;
  }, []) : files.map((filePath) => ({
    type: "copy",
    source: filePath,
    destination: filePath
  }));
  return Promise.resolve({
    instructions
  });
}

// extensions/games/game-baldursgate3/modTypes.ts
var path8 = __toESM(require("path"));
async function isLSLib(files) {
  const origFile = files.find((iter) => iter.type === "copy" && LSLIB_FILES.has(path8.basename(iter.destination).toLowerCase()));
  return origFile !== void 0 ? Promise.resolve(true) : Promise.resolve(false);
}
async function isBG3SE(files) {
  const origFile = files.find((iter) => iter.type === "copy" && path8.basename(iter.destination).toLowerCase() === "dwrite.dll");
  return origFile !== void 0 ? Promise.resolve(true) : Promise.resolve(false);
}
async function isLoose(instructions) {
  const copyInstructions = instructions.filter((instr) => instr.type === "copy");
  const hasDataFolder = copyInstructions.find((instr) => instr.source.indexOf("Data" + path8.sep) !== -1) !== void 0;
  const hasGenOrPublicFolder = copyInstructions.find(
    (instr) => instr.source.indexOf("Generated" + path8.sep) !== -1 || instr.source.indexOf("Public" + path8.sep) !== -1
  ) !== void 0;
  logDebug("isLoose", { instructions, hasDataFolder: hasDataFolder || hasGenOrPublicFolder });
  return Promise.resolve(hasDataFolder || hasGenOrPublicFolder);
}
async function isReplacer(api, files) {
  const origFile = files.find((iter) => iter.type === "copy" && ORIGINAL_FILES.has(iter.destination.toLowerCase()));
  const paks = files.filter((iter) => iter.type === "copy" && path8.extname(iter.destination).toLowerCase() === ".pak");
  logDebug("isReplacer", { origFile, paks });
  if (origFile !== void 0) {
    return api.showDialog("question", "Mod looks like a replacer", {
      bbcode: `The mod you just installed looks like a "replacer", meaning it is intended to replace one of the files shipped with the game.<br/>You should be aware that such a replacer includes a copy of some game data from a specific version of the game and may therefore break as soon as the game gets updated.<br/>Even if doesn't break, it may revert bugfixes that the game developers have made.<br/><br/>Therefore [color="red"]please take extra care to keep this mod updated[/color] and remove it when it no longer matches the game version.`
    }, [
      { label: "Install as Mod (will likely not work)" },
      { label: "Install as Replacer", default: true }
    ]).then((result) => result.action === "Install as Replacer");
  } else {
    return Promise.resolve(false);
  }
}

// extensions/games/game-baldursgate3/InfoPanel.tsx
var React2 = __toESM(require("react"));
var import_vortex_api9 = require("vortex-api");
var import_react_bootstrap2 = require("react-bootstrap");
var import_react_redux2 = require("react-redux");
function InfoPanelWrap(props) {
  const {
    api,
    getOwnGameVersion: getOwnGameVersion2,
    readStoredLO: readStoredLO2,
    installLSLib: installLSLib2,
    getLatestLSLibMod: getLatestLSLibMod3
  } = props;
  const currentProfile = (0, import_react_redux2.useSelector)((state) => state.settings["baldursgate3"]?.playerProfile);
  const [gameVersion, setGameVersion] = React2.useState();
  React2.useEffect(() => {
    (async () => {
      if (!gameVersion) {
        setGameVersion(await getOwnGameVersion2(api.getState()));
      }
    })();
  }, [gameVersion, setGameVersion]);
  const onSetProfile = React2.useCallback((profileName) => {
    const impl = async () => {
      api.store.dispatch(setPlayerProfile(profileName));
      try {
        await readStoredLO2(api);
      } catch (err) {
        api.showErrorNotification("Failed to read load order", err, {
          message: "Please run the game before you start modding",
          allowReport: false
        });
      }
      forceRefresh(api);
    };
    impl();
  }, [api]);
  const isLsLibInstalled = React2.useCallback(() => {
    return getLatestLSLibMod3(api) !== void 0;
  }, [api]);
  const onInstallLSLib = React2.useCallback(() => {
    installLSLib2(api, GAME_ID);
  }, [api]);
  if (!gameVersion) {
    return null;
  }
  return /* @__PURE__ */ React2.createElement(
    InfoPanel,
    {
      t: api.translate,
      gameVersion,
      currentProfile,
      onSetPlayerProfile: onSetProfile,
      isLsLibInstalled,
      onInstallLSLib
    }
  );
}
function InfoPanel(props) {
  const { t, onInstallLSLib, isLsLibInstalled } = props;
  return isLsLibInstalled() ? /* @__PURE__ */ React2.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "12px", marginRight: "16px" } }, /* @__PURE__ */ React2.createElement(import_react_bootstrap2.Alert, { bsStyle: "warning", style: { display: "flex", flexDirection: "column", gap: "8px" } }, /* @__PURE__ */ React2.createElement("div", null, t("To successfully switch between different game versions/patches please follow these steps:"), /* @__PURE__ */ React2.createElement("ul", null, /* @__PURE__ */ React2.createElement("li", null, t("Purge your mods")), /* @__PURE__ */ React2.createElement("li", null, t("Run the game so that the modsettings.lsx file gets reset to the default values")), /* @__PURE__ */ React2.createElement("li", null, t("Close the game")), /* @__PURE__ */ React2.createElement("li", null, t("Deploy your mods")), /* @__PURE__ */ React2.createElement("li", null, t("Run the game again - your load order will be maintained"))))), /* @__PURE__ */ React2.createElement("div", null, t(`A backup is made of the game's modsettings.lsx file before anything is changed.
        This can be found at %APPDATA%\\Local\\Larian Studios\\Baldur's Gate 3\\PlayerProfiles\\Public\\modsettings.lsx.backup`)), /* @__PURE__ */ React2.createElement("div", null, t(`Drag and Drop PAK files to reorder how the game loads them. Please note, some mods contain multiple PAK files.`)), /* @__PURE__ */ React2.createElement("div", null, t(`Mod descriptions from mod authors may have information to determine the best order.`)), /* @__PURE__ */ React2.createElement("div", null, t(`Some mods may be locked in this list because they are loaded differently by the game and can therefore not be load-ordered by mod managers. 
        If you need to disable such a mod, please do so in Vortex's Mods page.`)), /* @__PURE__ */ React2.createElement("h4", { style: { margin: 0 } }, t("Import and Export")), /* @__PURE__ */ React2.createElement("div", null, t(`Import is an experimental tool to help migration from a game load order (.lsx file) to Vortex. It works by importing the game's modsettings file
        and attempts to match up mods that have been installed by Vortex.`)), /* @__PURE__ */ React2.createElement("div", null, t(`Export can be used to manually update the game's modsettings.lsx file if 'Settings > Mods > Auto export load order' isn't set to do this automatically. 
        It can also be used to export to a different file as a backup.`)), /* @__PURE__ */ React2.createElement("h4", { style: { margin: 0 } }, t("Import from Baldur's Gate 3 Mod Manager")), /* @__PURE__ */ React2.createElement("div", null, t("Vortex can sort your load order based on a BG3MM .json load order file. Any mods that are not installed through Vortex will be ignored.")), /* @__PURE__ */ React2.createElement("div", null, t("Please note that any mods that are not present in the BG3MM load order file will be placed at the bottom of the load order."))) : /* @__PURE__ */ React2.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } }, /* @__PURE__ */ React2.createElement("h4", { style: { margin: 0 } }, t("LSLib is not installed")), /* @__PURE__ */ React2.createElement("div", null, t("To take full advantage of Vortex's Baldurs Gate 3 modding capabilities such as managing the order in which mods are loaded into the game; Vortex requires a 3rd party tool called LSLib.")), /* @__PURE__ */ React2.createElement("div", null, t("Please install the library using the buttons below to manage your load order.")), /* @__PURE__ */ React2.createElement(
    import_vortex_api9.tooltip.Button,
    {
      tooltip: "Install LSLib",
      onClick: onInstallLSLib
    },
    t("Install LSLib")
  ));
}

// extensions/games/game-baldursgate3/index.tsx
var STOP_PATTERNS = ["[^/]*\\.pak$"];
var GOG_ID = "1456460669";
var STEAM_ID = "1086940";
function toWordExp(input) {
  return "(^|/)" + input + "(/|$)";
}
function findGame() {
  return import_vortex_api10.util.GameStoreHelper.findByAppId([GOG_ID, STEAM_ID]).then((game) => game.gamePath);
}
async function ensureGlobalProfile(api, discovery) {
  if (discovery?.path) {
    const profilePath = await globalProfilePath(api);
    try {
      await import_vortex_api10.fs.ensureDirWritableAsync(profilePath);
      const modSettingsFilePath = path9.join(profilePath, "modsettings.lsx");
      try {
        await import_vortex_api10.fs.statAsync(modSettingsFilePath);
      } catch (err) {
        const defaultModSettings = await getDefaultModSettings(api);
        await import_vortex_api10.fs.writeFileAsync(modSettingsFilePath, defaultModSettings, { encoding: "utf8" });
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
async function prepareForModding(api, discovery) {
  const mp = modsPath();
  const format = await getDefaultModSettingsFormat(api);
  if (!["v7", "v8"].includes(format)) {
    showFullReleaseModFixerRecommendation(api);
  }
  return import_vortex_api10.fs.statAsync(mp).catch(() => import_vortex_api10.fs.ensureDirWritableAsync(mp, () => import_bluebird2.default.resolve())).finally(() => ensureGlobalProfile(api, discovery));
}
function showFullReleaseModFixerRecommendation(api) {
  const mods = api.store.getState().persistent?.mods?.baldursgate3;
  if (mods !== void 0) {
    const modArray = mods ? Object.values(mods) : [];
    logDebug("modArray", modArray);
    const modFixerInstalled = modArray.filter((mod) => !!mod?.attributes?.modFixer).length != 0;
    logDebug("modFixerInstalled", modFixerInstalled);
    if (modFixerInstalled) {
      return;
    }
  }
  api.sendNotification({
    type: "warning",
    title: "Recommended Mod",
    message: "Most mods require this mod.",
    id: "bg3-recommended-mod",
    allowSuppress: true,
    actions: [
      {
        title: "More",
        action: (dismiss) => {
          api.showDialog("question", "Recommended Mods", {
            text: `We recommend installing "Baldur's Gate 3 Mod Fixer" to be able to mod Baldur's Gate 3.

This can be downloaded from Nexus Mods and installed using Vortex by pressing "Open Nexus Mods`
          }, [
            { label: "Dismiss" },
            { label: "Open Nexus Mods", default: true }
          ]).then((result) => {
            dismiss();
            if (result.action === "Open Nexus Mods") {
              import_vortex_api10.util.opn("https://www.nexusmods.com/baldursgate3/mods/141?tab=description").catch(() => null);
            } else if (result.action === "Cancel") {
            }
            return Promise.resolve();
          });
        }
      }
    ]
  });
}
async function onCheckModVersion(api, gameId, mods) {
  const profile = import_vortex_api10.selectors.activeProfile(api.getState());
  if (profile.gameId !== GAME_ID || gameId !== GAME_ID) {
    return;
  }
  const latestVer = getLatestInstalledLSLibVer(api);
  if (latestVer === "0.0.0") {
    return;
  }
  const newestVer = await checkForUpdates(api, latestVer);
  if (!newestVer || newestVer === latestVer) {
    return;
  }
}
async function onGameModeActivated(api, gameId) {
  if (gameId !== GAME_ID) {
    PakInfoCache.getInstance(api).save();
    return;
  }
  try {
    await migrate(api);
    const bg3ProfileId = await getActivePlayerProfile(api);
    const gameSettingsPath = path9.join(profilesPath(), bg3ProfileId, "modsettings.lsx");
    let nodes = await getNodes(gameSettingsPath);
    const { modsNode, modsOrderNode } = nodes;
    if (modsNode.children === void 0 || modsNode.children[0] === "") {
      modsNode.children = [{ node: [] }];
    }
    const format = await getDefaultModSettingsFormat(api);
    if (modsOrderNode === void 0 && ["v7", "v8"].includes(format)) {
      const convFunc = format === "v7" ? convertV6toV7 : convertToV8;
      const data = await import_vortex_api10.fs.readFileAsync(gameSettingsPath, { encoding: "utf8" });
      const newData = await convFunc(data);
      await import_vortex_api10.fs.removeAsync(gameSettingsPath).catch((err) => Promise.resolve());
      await import_vortex_api10.fs.writeFileAsync(gameSettingsPath, newData, { encoding: "utf8" });
    }
  } catch (err) {
    api.showErrorNotification(
      "Failed to migrate",
      err,
      {
        //message: 'Please run the game before you start modding',
        allowReport: false
      }
    );
  }
  try {
    await readStoredLO(api);
    PakInfoCache.getInstance(api);
  } catch (err) {
    api.showErrorNotification(
      "Failed to read load order",
      err,
      {
        message: "Please run the game before you start modding",
        allowReport: false
      }
    );
  }
  const latestVer = getLatestInstalledLSLibVer(api);
  if (latestVer === "0.0.0") {
    await downloadDivine(api);
  }
}
function main(context) {
  context.registerReducer(["settings", "baldursgate3"], reducers_default);
  context.registerGame({
    id: GAME_ID,
    name: "Baldur's Gate 3",
    mergeMods: true,
    queryPath: findGame,
    supportedTools: [
      {
        id: "exevulkan",
        name: "Baldur's Gate 3 (Vulkan)",
        executable: () => "bin/bg3.exe",
        requiredFiles: [
          "bin/bg3.exe"
        ],
        relative: true
      }
    ],
    queryModPath: modsPath,
    logo: "gameart.jpg",
    executable: () => "bin/bg3_dx11.exe",
    setup: (discovery) => prepareForModding(context.api, discovery),
    requiredFiles: [
      "bin/bg3_dx11.exe"
    ],
    environment: {
      SteamAPPId: STEAM_ID
    },
    details: {
      steamAppId: +STEAM_ID,
      stopPatterns: STOP_PATTERNS.map(toWordExp),
      ignoreConflicts: IGNORE_PATTERNS,
      ignoreDeploy: IGNORE_PATTERNS
    }
  });
  context.registerAction("mod-icons", 300, "settings", {}, "Re-install LSLib/Divine", () => {
    const state = context.api.getState();
    const mods = import_vortex_api10.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
    const lslibs = Object.keys(mods).filter((mod) => mods[mod].type === "bg3-lslib-divine-tool");
    context.api.events.emit("remove-mods", GAME_ID, lslibs, (err) => {
      if (err !== null) {
        context.api.showErrorNotification(
          "Failed to reinstall lslib",
          "Please re-install manually",
          { allowReport: false }
        );
        return;
      }
      downloadDivine(context.api);
    });
  }, () => {
    const state = context.api.store.getState();
    const gameMode = import_vortex_api10.selectors.activeGameId(state);
    return gameMode === GAME_ID;
  });
  context.registerInstaller("bg3-lslib-divine-tool", 15, testLSLib, installLSLib);
  context.registerInstaller("bg3-bg3se", 15, testBG3SE, installBG3SE);
  context.registerInstaller("bg3-engine-injector", 20, testEngineInjector, installEngineInjector);
  context.registerInstaller("bg3-replacer", 25, testReplacer, installReplacer);
  context.registerInstaller("bg3-modfixer", 25, testModFixer, installModFixer);
  context.registerModType(
    MOD_TYPE_LSLIB,
    15,
    (gameId) => gameId === GAME_ID,
    () => void 0,
    isLSLib,
    { name: "BG3 LSLib", noConflicts: true }
  );
  context.registerModType(
    MOD_TYPE_BG3SE,
    15,
    (gameId) => gameId === GAME_ID,
    () => path9.join(getGamePath(context.api), "bin"),
    isBG3SE,
    { name: "BG3 BG3SE" }
  );
  context.registerModType(
    MOD_TYPE_LOOSE,
    20,
    (gameId) => gameId === GAME_ID,
    () => getGameDataPath(context.api),
    isLoose,
    { name: "BG3 Loose" }
  );
  context.registerModType(
    MOD_TYPE_REPLACER,
    25,
    (gameId) => gameId === GAME_ID,
    () => getGameDataPath(context.api),
    (instructions) => isReplacer(context.api, instructions),
    { name: "BG3 Replacer" }
  );
  context.registerLoadOrder({
    clearStateOnPurge: false,
    gameId: GAME_ID,
    deserializeLoadOrder: () => deserialize(context),
    serializeLoadOrder: (loadOrder, prev) => serialize(context, loadOrder),
    validate,
    toggleableEntries: false,
    usageInstructions: (() => /* @__PURE__ */ React3.createElement(
      InfoPanelWrap,
      {
        api: context.api,
        getOwnGameVersion,
        readStoredLO,
        installLSLib: onGameModeActivated,
        getLatestLSLibMod
      }
    ))
  });
  const isBG3 = () => {
    const state = context.api.getState();
    const activeGame = import_vortex_api10.selectors.activeGameId(state);
    return activeGame === GAME_ID;
  };
  context.registerAction("fb-load-order-icons", 150, "changelog", {}, "Export to Game", () => {
    exportToGame(context.api);
  }, isBG3);
  context.registerAction("fb-load-order-icons", 151, "changelog", {}, "Export to File...", () => {
    exportToFile(context.api);
  }, isBG3);
  context.registerAction("fb-load-order-icons", 160, "import", {}, "Import from Game", () => {
    importModSettingsGame(context.api);
  }, isBG3);
  context.registerAction("fb-load-order-icons", 161, "import", {}, "Import from File...", () => {
    importModSettingsFile(context.api);
  }, isBG3);
  context.registerAction("fb-load-order-icons", 170, "import", {}, "Import from BG3MM...", () => {
    importFromBG3MM(context);
  }, isBG3);
  context.registerAction("fb-load-order-icons", 190, "open-ext", {}, "Open Load Order File", () => {
    getActivePlayerProfile(context.api).then((bg3ProfileId) => {
      const gameSettingsPath = path9.join(profilesPath(), bg3ProfileId, "modsettings.lsx");
      import_vortex_api10.util.opn(gameSettingsPath).catch(() => null);
    });
  }, isBG3);
  context.registerSettings("Mods", Settings_default, void 0, isBG3, 150);
  context.once(() => {
    context.api.onStateChange(
      ["session", "base", "toolsRunning"],
      (prev, current) => {
        const gameMode = import_vortex_api10.selectors.activeGameId(context.api.getState());
        if (gameMode === GAME_ID && Object.keys(current).length === 0) {
          readStoredLO(context.api).catch((err) => {
            context.api.showErrorNotification("Failed to read load order", err, {
              message: "Please run the game before you start modding",
              allowReport: false
            });
          });
        }
      }
    );
    context.api.onAsync("did-deploy", async (profileId, deployment) => {
      const profile = import_vortex_api10.selectors.profileById(context.api.getState(), profileId);
      if (profile?.gameId === GAME_ID) {
        forceRefresh(context.api);
      }
      await PakInfoCache.getInstance(context.api).save();
      return Promise.resolve();
    });
    context.api.events.on(
      "check-mods-version",
      (gameId, mods) => onCheckModVersion(context.api, gameId, mods)
    );
    context.api.events.on(
      "gamemode-activated",
      async (gameMode) => onGameModeActivated(context.api, gameMode)
    );
  });
  return true;
}
var index_default = main;
//# sourceMappingURL=index.js.map
