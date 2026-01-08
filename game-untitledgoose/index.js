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

// extensions/games/game-untitledgoose/index.ts
var import_bluebird2 = __toESM(require("bluebird"));
var import_path3 = __toESM(require("path"));
var import_vortex_api3 = require("vortex-api");

// extensions/games/game-untitledgoose/migrations.ts
var import_path2 = __toESM(require("path"));
var import_semver = __toESM(require("semver"));
var import_vortex_api2 = require("vortex-api");

// extensions/games/game-untitledgoose/statics.ts
var import_path = __toESM(require("path"));
var DATAPATH = import_path.default.join("Untitled_Data", "Managed");
var EPIC_APP_ID = "Flour";
var GAME_ID = "untitledgoosegame";

// extensions/games/game-untitledgoose/util.ts
var import_bluebird = __toESM(require("bluebird"));
var import_vortex_api = require("vortex-api");
function toBlue(func) {
  return (...args) => import_bluebird.default.resolve(func(...args));
}
function getDiscoveryPath(state) {
  const discovery = import_vortex_api.util.getSafe(state, ["settings", "gameMode", "discovered", GAME_ID], void 0);
  if (discovery === void 0 || discovery.path === void 0) {
    (0, import_vortex_api.log)("debug", "untitledgoosegame was not discovered");
    return void 0;
  }
  return discovery.path;
}

// extensions/games/game-untitledgoose/migrations.ts
function migrate020(context, oldVersion) {
  if (import_semver.default.gte(oldVersion, "0.2.0")) {
    return Promise.resolve();
  }
  const discoveryPath = getDiscoveryPath(context.api.getState());
  if (discoveryPath === void 0) {
    return Promise.resolve();
  }
  const modsPath = import_path2.default.join(discoveryPath, DATAPATH, "VortexMods");
  return context.api.awaitUI().then(() => import_vortex_api2.fs.ensureDirWritableAsync(modsPath)).then(() => context.api.emitAndAwait("purge-mods-in-path", GAME_ID, "", modsPath));
}

// extensions/games/game-untitledgoose/index.ts
var BIX_CONFIG = "BepInEx.cfg";
function ensureBIXConfig(discovery) {
  const src = import_path3.default.join(__dirname, BIX_CONFIG);
  const dest = import_path3.default.join(discovery.path, "BepInEx", "config", BIX_CONFIG);
  return import_vortex_api3.fs.ensureDirWritableAsync(import_path3.default.dirname(dest)).then(() => import_vortex_api3.fs.copyAsync(src, dest)).catch((err) => {
    if (err.code !== "EEXIST") {
      (0, import_vortex_api3.log)("warn", "failed to write BIX config", err);
    }
    return import_bluebird2.default.resolve();
  });
}
function requiresLauncher() {
  return import_vortex_api3.util.epicGamesLauncher.isGameInstalled(EPIC_APP_ID).then((epic) => epic ? { launcher: "epic", addInfo: EPIC_APP_ID } : void 0);
}
function findGame() {
  return import_vortex_api3.util.epicGamesLauncher.findByAppId(EPIC_APP_ID).then((epicEntry) => epicEntry.gamePath);
}
function modPath() {
  return import_path3.default.join("BepInEx", "plugins");
}
function prepareForModding(discovery) {
  if (discovery?.path === void 0) {
    return import_bluebird2.default.reject(new import_vortex_api3.util.ProcessCanceled("Game not discovered"));
  }
  return ensureBIXConfig(discovery).then(() => import_vortex_api3.fs.ensureDirWritableAsync(import_path3.default.join(discovery.path, "BepInEx", "plugins")));
}
function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: "Untitled Goose Game",
    mergeMods: true,
    queryPath: findGame,
    queryModPath: modPath,
    requiresLauncher,
    logo: "gameart.jpg",
    executable: () => "Untitled.exe",
    requiredFiles: [
      "Untitled.exe",
      "UnityPlayer.dll"
    ],
    setup: prepareForModding
  });
  context.registerMigration(toBlue((old) => migrate020(context, old)));
  context.once(() => {
    if (context.api.ext.bepinexAddGame !== void 0) {
      context.api.ext.bepinexAddGame({
        gameId: GAME_ID,
        autoDownloadBepInEx: true,
        doorstopConfig: {
          doorstopType: "default",
          ignoreDisableSwitch: true
        }
      });
    }
  });
  return true;
}
module.exports = {
  default: main
};
//# sourceMappingURL=index.js.map
