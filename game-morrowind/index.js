var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

// extensions/games/game-morrowind/constants.js
var require_constants = __commonJS({
  "extensions/games/game-morrowind/constants.js"(exports2, module2) {
    var MORROWIND_ID2 = "morrowind";
    var NATIVE_PLUGINS2 = ["Bloodmoon.esm", "Morrowind.esm", "Tribunal.esm"];
    module2.exports = {
      MORROWIND_ID: MORROWIND_ID2,
      NATIVE_PLUGINS: NATIVE_PLUGINS2
    };
  }
});

// extensions/games/game-morrowind/loadorder.js
var require_loadorder = __commonJS({
  "extensions/games/game-morrowind/loadorder.js"(exports2, module2) {
    var path2 = require("path");
    var { fs, selectors: selectors3, util: util3 } = require("vortex-api");
    var { default: IniParser, WinapiFormat } = require("vortex-parse-ini");
    var { MORROWIND_ID: MORROWIND_ID2 } = require_constants();
    async function validate2(before, after) {
      return Promise.resolve();
    }
    async function deserializeLoadOrder3(api, mods = void 0) {
      const state = api.getState();
      const discovery = selectors3.discoveryByGame(state, MORROWIND_ID2);
      if (discovery?.path === void 0) {
        return Promise.resolve([]);
      }
      if (mods === void 0) {
        mods = util3.getSafe(state, ["persistent", "mods", MORROWIND_ID2], {});
      }
      const fileMap = Object.keys(mods).reduce((accum, iter) => {
        const plugins = mods[iter]?.attributes?.plugins;
        if (mods[iter]?.attributes?.plugins !== void 0) {
          for (const plugin of plugins) {
            accum[plugin] = iter;
          }
        }
        return accum;
      }, {});
      const iniFilePath = path2.join(discovery.path, "Morrowind.ini");
      const gameFiles = await refreshPlugins(api);
      const enabled = await readGameFiles(iniFilePath);
      return gameFiles.sort((lhs, rhs) => lhs.mtime - rhs.mtime).map((file) => ({
        id: file.name,
        enabled: enabled.includes(file.name),
        name: file.name,
        modId: fileMap[file.name]
      }));
    }
    async function refreshPlugins(api) {
      const state = api.getState();
      const discovery = selectors3.discoveryByGame(state, MORROWIND_ID2);
      if (discovery?.path === void 0) {
        return Promise.resolve([]);
      }
      const dataDirectory = path2.join(discovery.path, "Data Files");
      let fileEntries = [];
      try {
        fileEntries = await fs.readdirAsync(dataDirectory);
      } catch (err) {
        return Promise.resolve([]);
      }
      const pluginEntries = [];
      for (const fileName of fileEntries) {
        if (![".esp", ".esm"].includes(path2.extname(fileName.toLocaleLowerCase()))) {
          continue;
        }
        let stats;
        try {
          stats = await fs.statAsync(path2.join(dataDirectory, fileName));
          pluginEntries.push({ name: fileName, mtime: stats.mtime });
        } catch (err) {
          if (err.code === "ENOENT") {
            continue;
          } else {
            return Promise.reject(err);
          }
        }
      }
      return Promise.resolve(pluginEntries);
    }
    async function readGameFiles(iniFilePath) {
      const parser = new IniParser(new WinapiFormat());
      return parser.read(iniFilePath).then((ini) => {
        const files = ini.data["Game Files"];
        return Object.keys(files ?? {}).map((key) => files[key]);
      });
    }
    async function updatePluginOrder(iniFilePath, plugins) {
      const parser = new IniParser(new WinapiFormat());
      return parser.read(iniFilePath).then((ini) => {
        ini.data["Game Files"] = plugins.reduce((prev, plugin, idx) => {
          prev[`GameFile${idx}`] = plugin;
          return prev;
        }, {});
        return parser.write(iniFilePath, ini);
      });
    }
    async function updatePluginTimestamps(dataPath, plugins) {
      const offset = 946684800;
      const oneDay = 24 * 60 * 60;
      return Promise.mapSeries(plugins, (fileName, idx) => {
        const mtime = offset + oneDay * idx;
        return fs.utimesAsync(path2.join(dataPath, fileName), mtime, mtime).catch((err) => err.code === "ENOENT" ? Promise.resolve() : Promise.reject(err));
      });
    }
    async function serializeLoadOrder2(api, order) {
      const state = api.getState();
      const discovery = selectors3.discoveryByGame(state, MORROWIND_ID2);
      if (discovery?.path === void 0) {
        return Promise.reject(new util3.ProcessCanceled("Game is not discovered"));
      }
      const iniFilePath = path2.join(discovery.path, "Morrowind.ini");
      const dataDirectory = path2.join(discovery.path, "Data Files");
      const enabled = order.filter((loEntry) => loEntry.enabled === true).map((loEntry) => loEntry.id);
      try {
        await updatePluginOrder(iniFilePath, enabled);
        await updatePluginTimestamps(dataDirectory, order.map((loEntry) => loEntry.id));
      } catch (err) {
        const allowReport = !(err instanceof util3.UserCanceled);
        api.showErrorNotification("Failed to save", err, { allowReport });
        return Promise.reject(err);
      }
      return Promise.resolve();
    }
    module2.exports = {
      deserializeLoadOrder: deserializeLoadOrder3,
      serializeLoadOrder: serializeLoadOrder2,
      readGameFiles,
      validate: validate2
    };
  }
});

// extensions/games/game-morrowind/collections.js
var require_collections = __commonJS({
  "extensions/games/game-morrowind/collections.js"(exports2, module2) {
    var { actions: actions2, selectors: selectors3, util: util3 } = require("vortex-api");
    var { MORROWIND_ID: MORROWIND_ID2, NATIVE_PLUGINS: NATIVE_PLUGINS2 } = require_constants();
    var { deserializeLoadOrder: deserializeLoadOrder3, serializeLoadOrder: serializeLoadOrder2 } = require_loadorder();
    async function genCollectionsData2(context, gameId, includedMods, collection) {
      if (MORROWIND_ID2 !== gameId) {
        return Promise.resolve([]);
      }
      try {
        const state = context.api.getState();
        const mods = util3.getSafe(state, ["persistent", "mods", gameId], {});
        const included = includedMods.reduce((accum, iter) => {
          if (mods[iter] !== void 0) {
            accum[iter] = mods[iter];
          }
          return accum;
        }, {});
        const loadOrder = await deserializeLoadOrder3(context.api, included);
        const filtered = loadOrder.filter((entry) => NATIVE_PLUGINS2.includes(entry.id) || entry.modId !== void 0);
        return Promise.resolve({ loadOrder: filtered });
      } catch (err) {
        return Promise.reject(err);
      }
    }
    async function parseCollectionsData2(context, gameId, data) {
      if (MORROWIND_ID2 !== gameId) {
        return Promise.resolve();
      }
      try {
        await serializeLoadOrder2(context.api, data.loadOrder);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    module2.exports = {
      parseCollectionsData: parseCollectionsData2,
      genCollectionsData: genCollectionsData2
    };
  }
});

// extensions/games/game-morrowind/migrations.js
var require_migrations = __commonJS({
  "extensions/games/game-morrowind/migrations.js"(exports2, module2) {
    var path2 = require("path");
    var semver = require("semver");
    var { actions: actions2, selectors: selectors3, util: util3 } = require("vortex-api");
    var { MORROWIND_ID: MORROWIND_ID2 } = require_constants();
    var walk2 = require("turbowalk").default;
    async function migrate1032(api, oldVersion) {
      if (semver.gte(oldVersion, "1.0.3")) {
        return Promise.resolve();
      }
      const state = api.getState();
      const installPath = selectors3.installPathForGame(state, MORROWIND_ID2);
      const mods = util3.getSafe(state, ["persistent", "mods", MORROWIND_ID2], {});
      if (installPath === void 0 || Object.keys(mods).length === 0) {
        return Promise.resolve();
      }
      const batched = [];
      for (const mod of Object.values(mods)) {
        if (mod?.installationPath === void 0) {
          continue;
        }
        const modPath = path2.join(installPath, mod.installationPath);
        const plugins = [];
        await walk2(modPath, (entries) => {
          for (let entry of entries) {
            if ([".esp", ".esm"].includes(path2.extname(entry.filePath.toLowerCase()))) {
              plugins.push(path2.basename(entry.filePath));
            }
          }
        }, { recurse: true, skipLinks: true, skipInaccessible: true });
        if (plugins.length > 0) {
          batched.push(actions2.setModAttribute(MORROWIND_ID2, mod.id, "plugins", plugins));
        }
      }
      if (batched.length > 0 && util3.batchDispatch !== void 0) {
        util3.batchDispatch(api.store, batched);
      } else {
        for (const action of batched) {
          api.store.dispatch(action);
        }
      }
      return Promise.resolve();
    }
    module2.exports = {
      migrate103: migrate1032
    };
  }
});

// extensions/games/game-morrowind/index.ts
var import_path = __toESM(require("path"));
var import_vortex_api2 = require("vortex-api");
var React2 = __toESM(require("react"));
var import_loadorder2 = __toESM(require_loadorder());
var import_constants2 = __toESM(require_constants());
var import_collections = __toESM(require_collections());

// extensions/games/game-morrowind/views/MorrowindCollectionsDataView.tsx
var React = __toESM(require("react"));
var import_react_bootstrap = require("react-bootstrap");
var import_react_i18next = require("react-i18next");
var import_react_redux = require("react-redux");
var import_vortex_api = require("vortex-api");
var import_constants = __toESM(require_constants());
var import_loadorder = __toESM(require_loadorder());
var NAMESPACE = "game-morrowind";
var MorrowindCollectionsDataView = class extends import_vortex_api.ComponentEx {
  constructor(props) {
    super(props);
    this.renderLoadOrderEditInfo = () => {
      const { t } = this.props;
      return /* @__PURE__ */ React.createElement(import_vortex_api.FlexLayout, { type: "row", id: "collection-edit-loadorder-edit-info-container" }, /* @__PURE__ */ React.createElement(import_vortex_api.FlexLayout.Fixed, { className: "loadorder-edit-info-icon" }, /* @__PURE__ */ React.createElement(import_vortex_api.Icon, { name: "dialog-info" })), /* @__PURE__ */ React.createElement(import_vortex_api.FlexLayout.Fixed, { className: "collection-edit-loadorder-edit-info" }, t("You can make changes to this data from the "), /* @__PURE__ */ React.createElement(
        "a",
        {
          className: "fake-link",
          onClick: this.openLoadOrderPage,
          title: t("Go to Load Order Page")
        },
        t("Load Order page.")
      ), t(" If you believe a load order entry is missing, please ensure the relevant mod is enabled and has been added to the collection.")));
    };
    this.openLoadOrderPage = () => {
      this.props.api.events.emit("show-main-page", "file-based-loadorder");
    };
    this.renderOpenLOButton = () => {
      const { t } = this.props;
      return /* @__PURE__ */ React.createElement(
        import_react_bootstrap.Button,
        {
          id: "btn-more-mods",
          className: "collection-add-mods-btn",
          onClick: this.openLoadOrderPage,
          bsStyle: "ghost"
        },
        t("Open Load Order Page")
      );
    };
    this.renderPlaceholder = () => {
      const { t } = this.props;
      return /* @__PURE__ */ React.createElement(
        import_vortex_api.EmptyPlaceholder,
        {
          icon: "sort-none",
          text: t("You have no load order entries (for the current mods in the collection)"),
          subtext: this.renderOpenLOButton()
        }
      );
    };
    this.renderModEntry = (loEntry, idx) => {
      const key = loEntry.id + JSON.stringify(loEntry);
      const classes = ["load-order-entry", "collection-tab"];
      return /* @__PURE__ */ React.createElement(
        import_react_bootstrap.ListGroupItem,
        {
          key,
          className: classes.join(" ")
        },
        /* @__PURE__ */ React.createElement(import_vortex_api.FlexLayout, { type: "row" }, /* @__PURE__ */ React.createElement("p", { className: "load-order-index" }, idx), /* @__PURE__ */ React.createElement("p", null, loEntry.name))
      );
    };
    this.initState({
      sortedMods: []
    });
  }
  componentDidMount() {
    this.updateSortedMods();
  }
  componentDidUpdate(prevProps, prevState) {
    if (JSON.stringify(this.state.sortedMods) !== JSON.stringify(this.props.loadOrder)) {
      this.updateSortedMods();
    }
  }
  render() {
    const { t } = this.props;
    const { sortedMods } = this.state;
    return !!sortedMods && Object.keys(sortedMods).length !== 0 ? /* @__PURE__ */ React.createElement("div", { style: { overflow: "auto" } }, /* @__PURE__ */ React.createElement("h4", null, t("Load Order")), /* @__PURE__ */ React.createElement("p", null, t("This is a snapshot of the load order information that will be exported with this collection.")), this.renderLoadOrderEditInfo(), /* @__PURE__ */ React.createElement(import_react_bootstrap.ListGroup, { id: "collections-load-order-list" }, sortedMods.map((entry, idx) => this.renderModEntry(entry, idx)))) : this.renderPlaceholder();
  }
  updateSortedMods() {
    const includedModIds = (this.props.collection?.rules || []).map((rule) => rule.reference.id);
    const mods = Object.keys(this.props.mods).reduce((accum, iter) => {
      if (includedModIds.includes(iter)) {
        accum[iter] = this.props.mods[iter];
      }
      return accum;
    }, {});
    (0, import_loadorder.deserializeLoadOrder)(this.props.api, mods).then((lo) => {
      const filtered = lo.filter((entry) => import_constants.NATIVE_PLUGINS.includes(entry.id) || entry.modId !== void 0);
      this.nextState.sortedMods = filtered;
    });
  }
};
var empty = [];
function mapStateToProps(state, ownProps) {
  const profile = import_vortex_api.selectors.activeProfile(state) || void 0;
  let loadOrder = [];
  if (!!profile?.gameId) {
    loadOrder = import_vortex_api.util.getSafe(state, ["persistent", "loadOrder", profile.id], empty);
  }
  return {
    gameId: profile?.gameId,
    loadOrder,
    mods: import_vortex_api.util.getSafe(state, ["persistent", "mods", profile.gameId], {}),
    profile
  };
}
function mapDispatchToProps(dispatch) {
  return {};
}
var MorrowindCollectionsDataView_default = (0, import_react_i18next.withTranslation)(["common", NAMESPACE])(
  (0, import_react_redux.connect)(mapStateToProps, mapDispatchToProps)(
    MorrowindCollectionsDataView
  )
);

// extensions/games/game-morrowind/index.ts
var import_migrations = __toESM(require_migrations());
var walk = require("turbowalk").default;
var STEAMAPP_ID = "22320";
var GOG_ID = "1435828767";
var MS_ID = "BethesdaSoftworks.TESMorrowind-PC";
var GAME_ID = import_constants2.MORROWIND_ID;
var localeFoldersXbox = {
  en: "Morrowind GOTY English",
  fr: "Morrowind GOTY French",
  de: "Morrowind GOTY German"
};
var gameStoreIds = {
  steam: [{ id: STEAMAPP_ID, prefer: 0 }],
  xbox: [{ id: MS_ID }],
  gog: [{ id: GOG_ID }],
  registry: [{ id: "HKEY_LOCAL_MACHINE:Software\\Wow6432Node\\Bethesda Softworks\\Morrowind:Installed Path" }]
};
var tools = [
  {
    id: "tes3edit",
    name: "TES3Edit",
    executable: () => "TES3Edit.exe",
    requiredFiles: []
  },
  {
    id: "mw-construction-set",
    name: "Construction Set",
    logo: "constructionset.png",
    executable: () => "TES Construction Set.exe",
    requiredFiles: [
      "TES Construction Set.exe"
    ],
    relative: true,
    exclusive: true
  }
];
async function findGame() {
  const storeGames = await import_vortex_api2.util.GameStoreHelper.find(gameStoreIds).catch(() => []);
  if (!storeGames.length) return;
  if (storeGames.length > 1) (0, import_vortex_api2.log)("debug", "Mutliple copies of Oblivion found", storeGames.map((s) => s.gameStoreId));
  const selectedGame = storeGames[0];
  if (["epic", "xbox"].includes(selectedGame.gameStoreId)) {
    (0, import_vortex_api2.log)("debug", "Defaulting to the English game version", { store: selectedGame.gameStoreId, folder: localeFoldersXbox["en"] });
    selectedGame.gamePath = import_path.default.join(selectedGame.gamePath, localeFoldersXbox["en"]);
  }
  return selectedGame;
}
function prepareForModding(api, discovery) {
  const gameName = import_vortex_api2.util.getGame(GAME_ID)?.name || "This game";
  if (discovery.store && ["epic", "xbox"].includes(discovery.store)) {
    const storeName = discovery.store === "epic" ? "Epic Games" : "Xbox Game Pass";
    api.sendNotification({
      id: `${GAME_ID}-locale-message`,
      type: "info",
      title: "Multiple Languages Available",
      message: "Default: English",
      allowSuppress: true,
      actions: [
        {
          title: "More",
          action: (dismiss) => {
            dismiss();
            api.showDialog(
              "info",
              "Mutliple Languages Available",
              {
                bbcode: '{{gameName}} has multiple language options when downloaded from {{storeName}}. [br][/br][br][/br]Vortex has selected the English variant by default. [br][/br][br][/br]If you would prefer to manage a different language you can change the path to the game using the "Manually Set Location" option in the games tab.',
                parameters: { gameName, storeName }
              },
              [
                { label: "Close", action: () => api.suppressNotification(`${GAME_ID}-locale-message`) }
              ]
            );
          }
        }
      ]
    });
  }
  return Promise.resolve();
}
function CollectionDataWrap(api, props) {
  return React2.createElement(MorrowindCollectionsDataView_default, { ...props, api });
}
function main(context) {
  context.registerGame({
    id: import_constants2.MORROWIND_ID,
    name: "Morrowind",
    mergeMods: true,
    queryPath: import_vortex_api2.util.toBlue(findGame),
    supportedTools: tools,
    setup: import_vortex_api2.util.toBlue((discovery) => prepareForModding(context.api, discovery)),
    queryModPath: () => "Data Files",
    logo: "gameart.jpg",
    executable: () => "morrowind.exe",
    requiredFiles: [
      "morrowind.exe"
    ],
    // requiresLauncher,
    environment: {
      SteamAPPId: STEAMAPP_ID
    },
    details: {
      steamAppId: parseInt(STEAMAPP_ID, 10),
      gogAppId: GOG_ID
    }
  });
  context.registerLoadOrder({
    gameId: import_constants2.MORROWIND_ID,
    deserializeLoadOrder: () => (0, import_loadorder2.deserializeLoadOrder)(context.api),
    serializeLoadOrder: (loadOrder) => (0, import_loadorder2.serializeLoadOrder)(context.api, loadOrder),
    validate: import_loadorder2.validate,
    noCollectionGeneration: true,
    toggleableEntries: true,
    usageInstructions: "Drag your plugins as needed - the game will load load them from top to bottom."
  });
  context.optional.registerCollectionFeature(
    "morrowind_collection_data",
    (gameId, includedMods, collection) => (0, import_collections.genCollectionsData)(context, gameId, includedMods, collection),
    (gameId, collection) => (0, import_collections.parseCollectionsData)(context, gameId, collection),
    () => Promise.resolve(),
    (t) => t("Load Order"),
    (state, gameId) => gameId === import_constants2.MORROWIND_ID,
    (props) => CollectionDataWrap(context.api, props)
  );
  context.registerMigration((old) => (0, import_migrations.migrate103)(context.api, old));
  context.once(() => {
    context.api.events.on("did-install-mod", async (gameId, archiveId, modId) => {
      if (gameId !== import_constants2.MORROWIND_ID) {
        return;
      }
      const state = context.api.getState();
      const installPath = import_vortex_api2.selectors.installPathForGame(state, import_constants2.MORROWIND_ID);
      const mod = import_vortex_api2.util.getSafe(state, ["persistent", "mods", import_constants2.MORROWIND_ID, modId], void 0);
      if (installPath === void 0 || mod === void 0) {
        return;
      }
      const modPath = import_path.default.join(installPath, mod.installationPath);
      const plugins = [];
      try {
        await walk(modPath, (entries) => {
          for (let entry of entries) {
            if ([".esp", ".esm"].includes(import_path.default.extname(entry.filePath.toLowerCase()))) {
              plugins.push(import_path.default.basename(entry.filePath));
            }
          }
        }, { recurse: true, skipLinks: true, skipInaccessible: true });
      } catch (err) {
        context.api.showErrorNotification("Failed to read list of plugins", err, { allowReport: false });
      }
      if (plugins.length > 0) {
        context.api.store.dispatch(import_vortex_api2.actions.setModAttribute(import_constants2.MORROWIND_ID, mod.id, "plugins", plugins));
      }
    });
  });
  return true;
}
module.exports = {
  default: main
};
//# sourceMappingURL=index.js.map
