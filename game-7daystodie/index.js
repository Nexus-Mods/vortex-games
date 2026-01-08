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

// extensions/games/game-7daystodie/index.tsx
var import_path5 = __toESM(require("path"));
var import_react_redux2 = require("react-redux");
var import_vortex_api7 = require("vortex-api");
var React2 = __toESM(require("react"));

// extensions/games/game-7daystodie/actions.ts
var import_redux_act = require("redux-act");
var setPrefixOffset = (0, import_redux_act.createAction)(
  "7DTD_SET_PREFIX_OFFSET",
  (profile, offset) => ({ profile, offset })
);
var setUDF = (0, import_redux_act.createAction)(
  "7DTD_SET_UDF",
  (udf) => ({ udf })
);
var setPreviousLO = (0, import_redux_act.createAction)(
  "7DTD_SET_PREVIOUS_LO",
  (profile, previousLO) => ({ profile, previousLO })
);

// extensions/games/game-7daystodie/reducers.ts
var import_vortex_api = require("vortex-api");
var reducer = {
  reducers: {
    [setPrefixOffset]: (state, payload) => {
      const { profile, offset } = payload;
      return import_vortex_api.util.setSafe(state, ["prefixOffset", profile], offset);
    },
    [setUDF]: (state, payload) => {
      const { udf } = payload;
      return import_vortex_api.util.setSafe(state, ["udf"], udf);
    },
    [setPreviousLO]: (state, payload) => {
      const { profile, previousLO } = payload;
      return import_vortex_api.util.setSafe(state, ["previousLO", profile], previousLO);
    }
  },
  defaults: {}
};

// extensions/games/game-7daystodie/common.ts
var import_vortex_api2 = require("vortex-api");
var import_path = __toESM(require("path"));
var MOD_INFO = "modinfo.xml";
var GAME_ID = "7daystodie";
var LO_FILE_NAME = "loadOrder.json";
var I18N_NAMESPACE = `game-${GAME_ID}`;
var INVALID_LO_MOD_TYPES = ["collection", "7dtd-root-mod"];
function launcherSettingsFilePath() {
  return import_path.default.join(import_vortex_api2.util.getVortexPath("appData"), "7DaysToDie", "launchersettings.json");
}
function loadOrderFilePath(profileId) {
  return import_path.default.join(import_vortex_api2.util.getVortexPath("appData"), "7DaysToDie", profileId + "_" + LO_FILE_NAME);
}
function modsRelPath() {
  return "Mods";
}
function gameExecutable() {
  return "7DaysToDie.exe";
}
var DEFAULT_LAUNCHER_SETTINGS = {
  ShowLauncher: false,
  DefaultRunConfig: {
    ExclusiveMode: false,
    Renderer: "dx11",
    UseGamesparks: true,
    UseEAC: true,
    UseNativeInput: false,
    AdditionalParameters: ""
  }
};

// extensions/games/game-7daystodie/loadOrder.ts
var _ = __toESM(require("lodash"));
var import_vortex_api4 = require("vortex-api");

// extensions/games/game-7daystodie/util.ts
var import_bluebird = __toESM(require("bluebird"));
var import_path2 = __toESM(require("path"));
var import_turbowalk = __toESM(require("turbowalk"));
var import_vortex_api3 = require("vortex-api");
var import_xml2js = require("xml2js");
var PARSER = new import_xml2js.Parser({ explicitRoot: false });
async function purge(api) {
  return new Promise((resolve, reject) => api.events.emit("purge-mods", false, (err) => err ? reject(err) : resolve()));
}
var relaunchExt = (api) => {
  return api.showDialog("info", "Restart Required", {
    text: "The extension requires a restart to complete the UDF setup. The extension will now exit - please re-activate it via the games page or dashboard."
  }, [{ label: "Restart Extension" }]).then(async () => {
    try {
      await purge(api);
      const batched = [
        import_vortex_api3.actions.setDeploymentNecessary(GAME_ID, true),
        import_vortex_api3.actions.setNextProfile(void 0)
      ];
      import_vortex_api3.util.batchDispatch(api.store, batched);
    } catch (err) {
      api.showErrorNotification("Failed to set up UDF", err);
      return Promise.resolve();
    }
  });
};
var selectUDF = async (context) => {
  const launcherSettings = launcherSettingsFilePath();
  const res = await context.api.showDialog(
    "info",
    "Choose User Data Folder",
    {
      text: "The modding pattern for 7DTD is changing. The Mods path inside the game directory is being deprecated and mods located in the old path will no longer work in the near future. Please select your User Data Folder (UDF) - Vortex will deploy to this new location. Please NEVER set your UDF path to Vortex's staging folder."
    },
    [
      { label: "Cancel" },
      { label: "Select UDF" }
    ]
  );
  if (res.action !== "Select UDF") {
    return Promise.reject(new import_vortex_api3.util.ProcessCanceled("Cannot proceed without UDF"));
  }
  await import_vortex_api3.fs.ensureDirWritableAsync(import_path2.default.dirname(launcherSettings));
  await ensureLOFile(context);
  let directory = await context.api.selectDir({
    title: "Select User Data Folder",
    defaultPath: import_path2.default.join(import_path2.default.dirname(launcherSettings))
  });
  if (!directory) {
    return Promise.reject(new import_vortex_api3.util.ProcessCanceled("Cannot proceed without UDF"));
  }
  const segments = directory.split(import_path2.default.sep);
  const lowered = segments.map((seg) => seg.toLowerCase());
  if (lowered[lowered.length - 1] === "mods") {
    segments.pop();
    directory = segments.join(import_path2.default.sep);
  }
  if (lowered.includes("vortex")) {
    return context.api.showDialog("info", "Invalid User Data Folder", {
      text: "The UDF cannot be set inside Vortex directories. Please select a different folder."
    }, [
      { label: "Try Again" }
    ]).then(() => selectUDF(context));
  }
  await import_vortex_api3.fs.ensureDirWritableAsync(import_path2.default.join(directory, "Mods"));
  const launcher = DEFAULT_LAUNCHER_SETTINGS;
  launcher.DefaultRunConfig.AdditionalParameters = `-UserDataFolder="${directory}"`;
  const launcherData = JSON.stringify(launcher, null, 2);
  await import_vortex_api3.fs.writeFileAsync(launcherSettings, launcherData, { encoding: "utf8" });
  context.api.store.dispatch(setUDF(directory));
  return relaunchExt(context.api);
};
function getModsPath(api) {
  const state = api.getState();
  const udf = import_vortex_api3.util.getSafe(state, ["settings", "7daystodie", "udf"], void 0);
  return udf !== void 0 ? import_path2.default.join(udf, "Mods") : "Mods";
}
function toBlue(func) {
  return (...args) => import_bluebird.default.resolve(func(...args));
}
function genProps(context, profileId) {
  const api = context.api;
  const state = api.getState();
  const profile = profileId !== void 0 ? import_vortex_api3.selectors.profileById(state, profileId) : import_vortex_api3.selectors.activeProfile(state);
  if (profile?.gameId !== GAME_ID) {
    return void 0;
  }
  const discovery = import_vortex_api3.util.getSafe(
    state,
    ["settings", "gameMode", "discovered", GAME_ID],
    void 0
  );
  if (discovery?.path === void 0) {
    return void 0;
  }
  const mods = import_vortex_api3.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  return { api, state, profile, mods, discovery };
}
async function ensureLOFile(context, profileId, props) {
  if (props === void 0) {
    props = genProps(context, profileId);
  }
  if (props === void 0) {
    return Promise.reject(new import_vortex_api3.util.ProcessCanceled("failed to generate game props"));
  }
  const targetPath = loadOrderFilePath(props.profile.id);
  try {
    await import_vortex_api3.fs.statAsync(targetPath).catch({ code: "ENOENT" }, () => import_vortex_api3.fs.writeFileAsync(targetPath, JSON.stringify([]), { encoding: "utf8" }));
    return targetPath;
  } catch (err) {
    return Promise.reject(err);
  }
}
function getPrefixOffset(api) {
  const state = api.getState();
  const profileId = import_vortex_api3.selectors.activeProfile(state)?.id;
  if (profileId === void 0) {
    api.showErrorNotification("No active profile for 7dtd", void 0, { allowReport: false });
    return;
  }
  return import_vortex_api3.util.getSafe(state, ["settings", "7daystodie", "prefixOffset", profileId], 0);
}
function reversePrefix(input) {
  if (input.length !== 3 || input.match(/[A-Z][A-Z][A-Z]/g) === null) {
    throw new import_vortex_api3.util.DataInvalid("Invalid input, please provide a valid prefix (AAA-ZZZ)");
  }
  const prefix = input.split("");
  const offset = prefix.reduce((prev, iter, idx) => {
    const pow = 2 - idx;
    const mult = Math.pow(26, pow);
    const charCode = iter.charCodeAt(0) % 65;
    prev = prev + charCode * mult;
    return prev;
  }, 0);
  return offset;
}
function makePrefix(input) {
  let res = "";
  let rest = input;
  while (rest > 0) {
    res = String.fromCharCode(65 + rest % 26) + res;
    rest = Math.floor(rest / 26);
  }
  return import_vortex_api3.util.pad(res, "A", 3);
}
async function getModName(modInfoPath) {
  let modInfo;
  try {
    const xmlData = await import_vortex_api3.fs.readFileAsync(modInfoPath);
    modInfo = await PARSER.parseStringPromise(xmlData);
    const modName = modInfo?.DisplayName?.[0]?.$?.value || modInfo?.ModInfo?.[0]?.Name?.[0]?.$?.value || modInfo?.Name?.[0]?.$?.value;
    return modName !== void 0 ? Promise.resolve(modName) : Promise.reject(new import_vortex_api3.util.DataInvalid("Unexpected modinfo.xml format"));
  } catch (err) {
    return Promise.reject(new import_vortex_api3.util.DataInvalid("Failed to parse ModInfo.xml file"));
  }
}

// extensions/games/game-7daystodie/loadOrder.ts
function corruptLODialog(props, filePath, err) {
  return new Promise((resolve, reject) => {
    props.api.showDialog("error", "Corrupt load order file", {
      bbcode: props.api.translate("The load order file is in a corrupt state or missing. You can try to fix it yourself or Vortex can regenerate the file for you, but that may result in loss of data. Will only affect load order items you added manually, if any).")
    }, [
      { label: "Cancel", action: () => reject(err) },
      {
        label: "Regenerate File",
        action: async () => {
          await import_vortex_api4.fs.removeAsync(filePath).catch((err2) => null);
          return resolve([]);
        }
      }
    ]);
  });
}
async function serialize(context, loadOrder, previousLO, profileId) {
  const props = genProps(context);
  if (props === void 0) {
    return Promise.reject(new import_vortex_api4.util.ProcessCanceled("invalid props"));
  }
  const loFilePath = await ensureLOFile(context, profileId, props);
  const filteredLO = loadOrder.filter((lo) => !INVALID_LO_MOD_TYPES.includes(props.mods?.[lo?.modId]?.type));
  const offset = getPrefixOffset(context.api);
  const prefixedLO = filteredLO.map((loEntry, idx) => {
    const prefix = makePrefix(idx + offset);
    const data = {
      prefix
    };
    return { ...loEntry, data };
  });
  const fileData = await import_vortex_api4.fs.readFileAsync(loFilePath, { encoding: "utf8" }).catch((err) => err.code === "ENOENT" ? Promise.resolve("[]") : Promise.reject(err));
  let savedLO = [];
  try {
    savedLO = JSON.parse(fileData);
  } catch (err) {
    savedLO = await corruptLODialog(props, loFilePath, err);
  }
  const batchedActions = [];
  batchedActions.push(setPreviousLO(props.profile.id, previousLO));
  import_vortex_api4.util.batchDispatch(context.api.store, batchedActions);
  await import_vortex_api4.fs.removeAsync(loFilePath).catch({ code: "ENOENT" }, () => Promise.resolve());
  await import_vortex_api4.util.writeFileAtomic(loFilePath, JSON.stringify(prefixedLO));
  return Promise.resolve();
}
async function deserialize(context) {
  const props = genProps(context);
  if (props?.profile?.gameId !== GAME_ID) {
    return [];
  }
  const currentModsState = import_vortex_api4.util.getSafe(props.profile, ["modState"], {});
  const enabledModIds = Object.keys(currentModsState).filter((modId) => import_vortex_api4.util.getSafe(currentModsState, [modId, "enabled"], false));
  const mods = import_vortex_api4.util.getSafe(
    props.state,
    ["persistent", "mods", GAME_ID],
    {}
  );
  let data = [];
  let loFilePath;
  try {
    try {
      loFilePath = await ensureLOFile(context);
      const fileData = await import_vortex_api4.fs.readFileAsync(loFilePath, { encoding: "utf8" });
      data = JSON.parse(fileData);
    } catch (err) {
      data = await corruptLODialog(props, loFilePath, err);
    }
    const filteredData = data.filter((entry) => enabledModIds.includes(entry.id));
    const offset = getPrefixOffset(context.api);
    const diff = enabledModIds.filter((id) => !INVALID_LO_MOD_TYPES.includes(mods[id]?.type) && filteredData.find((loEntry) => loEntry.id === id) === void 0);
    diff.forEach((missingEntry, idx) => {
      filteredData.push({
        id: missingEntry,
        modId: missingEntry,
        enabled: true,
        name: mods[missingEntry] !== void 0 ? import_vortex_api4.util.renderModName(mods[missingEntry]) : missingEntry,
        data: {
          prefix: makePrefix(idx + filteredData.length + offset)
        }
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

// extensions/games/game-7daystodie/migrations.ts
var import_path3 = __toESM(require("path"));
var import_semver = __toESM(require("semver"));
var import_vortex_api5 = require("vortex-api");
function migrate020(api, oldVersion) {
  if (import_semver.default.gte(oldVersion, "0.2.0")) {
    return Promise.resolve();
  }
  const state = api.store.getState();
  const mods = import_vortex_api5.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  const hasMods = Object.keys(mods).length > 0;
  if (!hasMods) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    return api.sendNotification({
      id: "7dtd-requires-upgrade",
      type: "warning",
      message: api.translate(
        "Mods for 7 Days to Die need to be reinstalled",
        { ns: I18N_NAMESPACE }
      ),
      noDismiss: true,
      actions: [
        {
          title: "Explain",
          action: () => {
            api.showDialog("info", "7 Days to Die", {
              text: "In version 17 of the game 7 Days to Die the way mods are installed has changed considerably. Unfortunately we are now not able to support this change with the way mods were previously installed.\nThis means that for the mods to work correctly you have to reinstall them.\nWe are sorry for the inconvenience."
            }, [
              { label: "Close" }
            ]);
          }
        },
        {
          title: "Understood",
          action: (dismiss) => {
            dismiss();
            resolve(void 0);
          }
        }
      ]
    });
  });
}
async function migrate100(context, oldVersion) {
  if (import_semver.default.gte(oldVersion, "1.0.0")) {
    return Promise.resolve();
  }
  const state = context.api.store.getState();
  const discoveryPath = import_vortex_api5.util.getSafe(
    state,
    ["settings", "gameMode", "discovered", GAME_ID, "path"],
    void 0
  );
  const activatorId = import_vortex_api5.selectors.activatorForGame(state, GAME_ID);
  const activator = import_vortex_api5.util.getActivator(activatorId);
  if (discoveryPath === void 0 || activator === void 0) {
    return Promise.resolve();
  }
  const mods = import_vortex_api5.util.getSafe(
    state,
    ["persistent", "mods", GAME_ID],
    {}
  );
  if (Object.keys(mods).length === 0) {
    return Promise.resolve();
  }
  const profiles = import_vortex_api5.util.getSafe(state, ["persistent", "profiles"], {});
  const loProfiles = Object.keys(profiles).filter((id) => profiles[id]?.gameId === GAME_ID);
  const loMap = loProfiles.reduce((accum, iter) => {
    const current = import_vortex_api5.util.getSafe(state, ["persistent", "loadOrder", iter], []);
    const newLO = current.map((entry) => {
      return {
        enabled: true,
        name: mods[entry] !== void 0 ? import_vortex_api5.util.renderModName(mods[entry]) : entry,
        id: entry,
        modId: entry
      };
    });
    accum[iter] = newLO;
    return accum;
  }, {});
  for (const profileId of Object.keys(loMap)) {
    await serialize(context, loMap[profileId], void 0, profileId);
  }
  const modsPath = import_path3.default.join(discoveryPath, modsRelPath());
  return context.api.awaitUI().then(() => import_vortex_api5.fs.ensureDirWritableAsync(modsPath)).then(() => context.api.emitAndAwait("purge-mods-in-path", GAME_ID, "", modsPath)).then(() => context.api.store.dispatch(import_vortex_api5.actions.setDeploymentNecessary(GAME_ID, true)));
}
async function migrate1011(context, oldVersion) {
  if (import_semver.default.gte(oldVersion, "1.0.11")) {
    return Promise.resolve();
  }
  const state = context.api.store.getState();
  const discoveryPath = import_vortex_api5.util.getSafe(
    state,
    ["settings", "gameMode", "discovered", GAME_ID, "path"],
    void 0
  );
  if (!discoveryPath) {
    return Promise.resolve();
  }
  const mods = import_vortex_api5.util.getSafe(
    state,
    ["persistent", "mods", GAME_ID],
    {}
  );
  if (Object.keys(mods).length === 0) {
    return Promise.resolve();
  }
  const profiles = import_vortex_api5.util.getSafe(state, ["persistent", "profiles"], {});
  const loProfiles = Object.keys(profiles).filter((id) => profiles[id]?.gameId === GAME_ID);
  const loMap = loProfiles.reduce((accum, iter) => {
    const lo = import_vortex_api5.util.getSafe(state, ["persistent", "loadOrder", iter], []);
    accum[iter] = lo;
    return accum;
  }, {});
  for (const profileId of Object.keys(loMap)) {
    try {
      await serialize(context, loMap[profileId], void 0, profileId);
      await import_vortex_api5.fs.removeAsync(import_path3.default.join(discoveryPath, `${profileId}_loadOrder.json`)).catch((err) => null);
    } catch (err) {
      return Promise.reject(new Error(`Failed to migrate load order for ${profileId}: ${err}`));
    }
  }
  const modsPath = import_path3.default.join(discoveryPath, modsRelPath());
  return context.api.awaitUI().then(() => import_vortex_api5.fs.ensureDirWritableAsync(modsPath)).then(() => context.api.emitAndAwait("purge-mods-in-path", GAME_ID, "", modsPath)).then(() => context.api.store.dispatch(import_vortex_api5.actions.setDeploymentNecessary(GAME_ID, true)));
}

// extensions/games/game-7daystodie/Settings.tsx
var import_path4 = __toESM(require("path"));
var import_react = __toESM(require("react"));
var import_react_redux = require("react-redux");
var import_react_i18next = require("react-i18next");
var import_react_bootstrap = require("react-bootstrap");
var import_vortex_api6 = require("vortex-api");
function Settings(props) {
  const { t } = (0, import_react_i18next.useTranslation)(I18N_NAMESPACE);
  const { onSelectUDF } = props;
  const connectedProps = (0, import_react_redux.useSelector)(mapStateToProps);
  const [currentUDF, setUDF2] = import_react.default.useState(import_path4.default.join(connectedProps.udf, "Mods"));
  const onSelectUDFHandler = import_react.default.useCallback(() => {
    onSelectUDF().then((res) => {
      if (res) {
        setUDF2(import_path4.default.join(res, "Mods"));
      }
    });
  }, [onSelectUDF]);
  return /* @__PURE__ */ import_react.default.createElement("form", { id: `${GAME_ID}-settings-form` }, /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.FormGroup, { controlId: "default-enable" }, /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.ControlLabel, { className: `${GAME_ID}-settings-heading` }, t("7DTD Settings")), /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.Panel, { key: `${GAME_ID}-user-default-folder` }, /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.Panel.Body, null, /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.ControlLabel, { className: `${GAME_ID}-settings-subheading` }, t("Current User Default Folder"), /* @__PURE__ */ import_react.default.createElement(import_vortex_api6.More, { id: "more-udf", name: t("Set User Data Folder") }, t("This will allow you to re-select the User Data Folder (UDF) for 7 Days to Die."))), /* @__PURE__ */ import_react.default.createElement(import_react_bootstrap.InputGroup, null, /* @__PURE__ */ import_react.default.createElement(
    import_react_bootstrap.FormControl,
    {
      className: "install-path-input",
      disabled: true,
      value: currentUDF
    }
  ), /* @__PURE__ */ import_react.default.createElement(
    import_react_bootstrap.Button,
    {
      onClick: onSelectUDFHandler
    },
    /* @__PURE__ */ import_react.default.createElement(import_vortex_api6.Icon, { name: "browse" })
  ))))));
}
function mapStateToProps(state) {
  return {
    udf: import_vortex_api6.util.getSafe(state, ["settings", "7daystodie", "udf"], "")
  };
}

// extensions/games/game-7daystodie/index.tsx
var STEAM_ID = "251570";
var STEAM_DLL = "steamclient64.dll";
var ROOT_MOD_CANDIDATES = ["bepinex"];
function resetPrefixOffset(api) {
  const state = api.getState();
  const profileId = import_vortex_api7.selectors.activeProfile(state)?.id;
  if (profileId === void 0) {
    api.showErrorNotification("No active profile for 7dtd", void 0, { allowReport: false });
    return;
  }
  api.store.dispatch(setPrefixOffset(profileId, 0));
  const loadOrder = import_vortex_api7.util.getSafe(api.getState(), ["persistent", "loadOrder", profileId], []);
  const newLO = loadOrder.map((entry, idx) => ({
    ...entry,
    data: {
      prefix: makePrefix(idx)
    }
  }));
  api.store.dispatch(import_vortex_api7.actions.setLoadOrder(profileId, newLO));
}
function setPrefixOffsetDialog(api) {
  return api.showDialog("question", "Set New Prefix Offset", {
    text: api.translate("Insert new prefix offset for modlets (AAA-ZZZ):"),
    input: [
      {
        id: "7dtdprefixoffsetinput",
        label: "Prefix Offset",
        type: "text",
        placeholder: "AAA"
      }
    ]
  }, [{ label: "Cancel" }, { label: "Set", default: true }]).then((result) => {
    if (result.action === "Set") {
      const prefix = result.input["7dtdprefixoffsetinput"];
      let offset = 0;
      try {
        offset = reversePrefix(prefix);
      } catch (err) {
        return Promise.reject(err);
      }
      const state = api.getState();
      const profileId = import_vortex_api7.selectors.activeProfile(state)?.id;
      if (profileId === void 0) {
        api.showErrorNotification("No active profile for 7dtd", void 0, { allowReport: false });
        return;
      }
      api.store.dispatch(setPrefixOffset(profileId, offset));
      const loadOrder = import_vortex_api7.util.getSafe(api.getState(), ["persistent", "loadOrder", profileId], []);
      const newLO = loadOrder.map((entry) => ({
        ...entry,
        data: {
          prefix: makePrefix(reversePrefix(entry.data.prefix) + offset)
        }
      }));
      api.store.dispatch(import_vortex_api7.actions.setLoadOrder(profileId, newLO));
    }
    return Promise.resolve();
  }).catch((err) => {
    api.showErrorNotification("Failed to set prefix offset", err, { allowReport: false });
    return Promise.resolve();
  });
}
async function findGame() {
  return import_vortex_api7.util.GameStoreHelper.findByAppId([STEAM_ID]).then((game) => game.gamePath);
}
async function prepareForModding(context, discovery) {
  const isUDFSet = import_vortex_api7.util.getSafe(
    context.api.getState(),
    ["settings", "7daystodie", "udf"],
    void 0
  ) != null;
  return !isUDFSet ? selectUDF(context) : Promise.resolve();
}
async function installContent(files, destinationPath, gameId) {
  const modFile = files.find((file) => import_path5.default.basename(file).toLowerCase() === MOD_INFO);
  const rootPath = import_path5.default.dirname(modFile);
  return getModName(import_path5.default.join(destinationPath, modFile)).then((modName) => {
    modName = modName.replace(/[^a-zA-Z0-9]/g, "");
    const filtered = files.filter((filePath) => filePath.startsWith(rootPath) && !filePath.endsWith(import_path5.default.sep));
    const instructions = filtered.map((filePath) => {
      return {
        type: "copy",
        source: filePath,
        destination: import_path5.default.relative(rootPath, filePath)
      };
    });
    return Promise.resolve({ instructions });
  });
}
function testSupportedContent(files, gameId) {
  const supported = gameId === GAME_ID && files.find((file) => import_path5.default.basename(file).toLowerCase() === MOD_INFO) !== void 0;
  return Promise.resolve({
    supported,
    requiredFiles: []
  });
}
function findCandFile(files) {
  return files.find((file) => file.toLowerCase().split(import_path5.default.sep).find((seg) => ROOT_MOD_CANDIDATES.includes(seg)) !== void 0);
}
function hasCandidate(files) {
  const candidate = findCandFile(files);
  return candidate !== void 0;
}
async function installRootMod(files, gameId) {
  const filtered = files.filter((file) => !file.endsWith(import_path5.default.sep));
  const candidate = findCandFile(files);
  const candIdx = candidate.toLowerCase().split(import_path5.default.sep).findIndex((seg) => ROOT_MOD_CANDIDATES.includes(seg));
  const instructions = filtered.reduce((accum, iter) => {
    accum.push({
      type: "copy",
      source: iter,
      destination: iter.split(import_path5.default.sep).slice(candIdx).join(import_path5.default.sep)
    });
    return accum;
  }, []);
  return Promise.resolve({ instructions });
}
async function testRootMod(files, gameId) {
  return Promise.resolve({
    requiredFiles: [],
    supported: hasCandidate(files) && gameId === GAME_ID
  });
}
function toLOPrefix(context, mod) {
  const props = genProps(context);
  if (props === void 0) {
    return "ZZZZ-" + mod.id;
  }
  const loadOrder = import_vortex_api7.util.getSafe(props.state, ["persistent", "loadOrder", props.profile.id], []);
  let loEntry = loadOrder.find((loEntry2) => loEntry2.id === mod.id);
  if (loEntry === void 0) {
    const prev = import_vortex_api7.util.getSafe(props.state, ["settings", "7daystodie", "previousLO", props.profile.id], []);
    loEntry = prev.find((loEntry2) => loEntry2.id === mod.id);
  }
  return loEntry?.data?.prefix !== void 0 ? loEntry.data.prefix + "-" + mod.id : "ZZZZ-" + mod.id;
}
function requiresLauncher(gamePath) {
  return import_vortex_api7.fs.readdirAsync(gamePath).then((files) => files.find((file) => file.endsWith(STEAM_DLL)) !== void 0 ? Promise.resolve({ launcher: "steam" }) : Promise.resolve(void 0)).catch((err) => Promise.reject(err));
}
function InfoPanel(props) {
  const { t, currentOffset } = props;
  return /* @__PURE__ */ React2.createElement("div", { style: { display: "flex", flexDirection: "column", padding: "16px" } }, /* @__PURE__ */ React2.createElement("div", { style: { display: "flex", whiteSpace: "nowrap", alignItems: "center" } }, t("Current Prefix Offset: "), /* @__PURE__ */ React2.createElement("hr", null), /* @__PURE__ */ React2.createElement("label", { style: { color: "red" } }, currentOffset)), /* @__PURE__ */ React2.createElement("hr", null), /* @__PURE__ */ React2.createElement("div", null, t('7 Days to Die loads mods in alphabetic order so Vortex prefixes the directory names with "AAA, AAB, AAC, ..." to ensure they load in the order you set here.')));
}
function InfoPanelWrap(props) {
  const { api, profileId } = props;
  const currentOffset = (0, import_react_redux2.useSelector)((state) => makePrefix(import_vortex_api7.util.getSafe(
    state,
    ["settings", "7daystodie", "prefixOffset", profileId],
    0
  )));
  return /* @__PURE__ */ React2.createElement(
    InfoPanel,
    {
      t: api.translate,
      currentOffset
    }
  );
}
function main(context) {
  context.registerReducer(["settings", "7daystodie"], reducer);
  context.registerGame({
    id: GAME_ID,
    name: "7 Days to Die",
    mergeMods: (mod) => toLOPrefix(context, mod),
    queryPath: toBlue(findGame),
    supportedTools: [],
    queryModPath: () => getModsPath(context.api),
    logo: "gameart.jpg",
    executable: gameExecutable,
    requiredFiles: [],
    requiresLauncher,
    setup: toBlue((discovery) => prepareForModding(context, discovery)),
    environment: {
      SteamAPPId: STEAM_ID
    },
    details: {
      steamAppId: +STEAM_ID,
      hashFiles: ["7DaysToDie_Data/Managed/Assembly-CSharp.dll"]
    }
  });
  context.registerLoadOrder({
    deserializeLoadOrder: () => deserialize(context),
    serializeLoadOrder: ((loadOrder, prev) => serialize(context, loadOrder, prev)),
    validate,
    gameId: GAME_ID,
    toggleableEntries: false,
    usageInstructions: (() => {
      const state = context.api.getState();
      const profileId = import_vortex_api7.selectors.activeProfile(state)?.id;
      if (profileId === void 0) {
        return null;
      }
      return /* @__PURE__ */ React2.createElement(InfoPanelWrap, { api: context.api, profileId });
    })
  });
  context.registerSettings("Mods", Settings, () => ({
    onSelectUDF: () => selectUDF(context).catch(() => null)
  }), () => {
    const state = context.api.getState();
    const activeGame = import_vortex_api7.selectors.activeGameId(state);
    return activeGame === GAME_ID;
  });
  context.registerAction(
    "fb-load-order-icons",
    150,
    "loot-sort",
    {},
    "Prefix Offset Assign",
    () => {
      setPrefixOffsetDialog(context.api);
    },
    () => {
      const state = context.api.getState();
      const activeGame = import_vortex_api7.selectors.activeGameId(state);
      return activeGame === GAME_ID;
    }
  );
  context.registerAction(
    "fb-load-order-icons",
    150,
    "loot-sort",
    {},
    "Prefix Offset Reset",
    () => {
      resetPrefixOffset(context.api);
    },
    () => {
      const state = context.api.getState();
      const activeGame = import_vortex_api7.selectors.activeGameId(state);
      return activeGame === GAME_ID;
    }
  );
  const getOverhaulPath = (game) => {
    const state = context.api.getState();
    const discovery = import_vortex_api7.selectors.discoveryByGame(state, GAME_ID);
    return discovery?.path;
  };
  context.registerInstaller(
    "7dtd-mod",
    25,
    toBlue(testSupportedContent),
    toBlue(installContent)
  );
  context.registerInstaller("7dtd-root-mod", 20, toBlue(testRootMod), toBlue(installRootMod));
  context.registerModType(
    "7dtd-root-mod",
    20,
    (gameId) => gameId === GAME_ID,
    getOverhaulPath,
    (instructions) => {
      const candidateFound = hasCandidate(instructions.filter((instr) => !!instr.destination).map((instr) => instr.destination));
      return Promise.resolve(candidateFound);
    },
    { name: "Root Directory Mod", mergeMods: true, deploymentEssential: false }
  );
  context.registerMigration(toBlue((old) => migrate020(context.api, old)));
  context.registerMigration(toBlue((old) => migrate100(context, old)));
  context.registerMigration(toBlue((old) => migrate1011(context, old)));
  return true;
}
module.exports = {
  default: main
};
//# sourceMappingURL=index.js.map
