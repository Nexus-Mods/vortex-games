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

// extensions/games/game-nomanssky/index.ts
var import_path = __toESM(require("path"));
var import_semver = __toESM(require("semver"));
var import_vortex_api = require("vortex-api");
var GAME_ID = "nomanssky";
var STEAMAPP_ID = "275850";
var XBOX_ID = "HelloGames.NoMansSky";
var MODTYPE_DEPRECATED_PAK = "nomanssky-deprecated-pak";
var BIN_PATH = "Binaries";
var EXEC = import_path.default.join(BIN_PATH, "NMS.exe");
async function purge(api) {
  return new Promise((resolve, reject) => api.events.emit("purge-mods", true, (err) => err ? reject(err) : resolve()));
}
async function deploy(api) {
  return new Promise((resolve, reject) => api.events.emit("deploy-mods", (err) => err ? reject(err) : resolve()));
}
function findGame() {
  return import_vortex_api.util.GameStoreHelper.findByAppId([STEAMAPP_ID, XBOX_ID]).then((game) => game.gamePath);
}
function deprecatedModPath() {
  return import_path.default.join("GAMEDATA", "PCBANKS", "MODS");
}
function modPath() {
  return import_path.default.join("GAMEDATA", "MODS");
}
async function migrate101(api, oldVersion) {
  if (import_semver.default.gte(oldVersion, "1.0.1")) {
    return Promise.resolve();
  }
  const state = api.getState();
  const mods = import_vortex_api.util.getSafe(state, ["persistent", "mods", GAME_ID], {});
  const modIds = Object.keys(mods).filter((modId) => mods[modId].type !== "nomanssky-deprecated-pak");
  const batched = modIds.map((modId) => import_vortex_api.actions.setModType(GAME_ID, modId, MODTYPE_DEPRECATED_PAK));
  if (batched.length > 0) {
    try {
      (0, import_vortex_api.log)("info", "Migrating mods to deprecated PAK type.", { mods: batched.length });
      await api.awaitUI();
      await purge(api);
      import_vortex_api.util.batchDispatch(api.store, batched);
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      await deploy(api);
    } catch (err) {
      (0, import_vortex_api.log)("error", "Failed to migrate mods to deprecated PAK type.", { err });
    }
  }
  return Promise.resolve();
}
async function prepareForModding(api, discovery) {
  const pcbanks = import_path.default.join(discovery.path, "GAMEDATA", "PCBANKS");
  const ensureDir = (dir) => import_vortex_api.fs.ensureDirWritableAsync(import_path.default.join(discovery.path, dir));
  return Promise.all([ensureDir(modPath()), ensureDir(deprecatedModPath())]).then(() => import_vortex_api.fs.renameAsync(import_path.default.join(pcbanks, "DISABLEMODS.TXT"), import_path.default.join(pcbanks, "ENABLEMODS.TXT")).catch((err) => err.code === "ENOENT" ? Promise.resolve() : Promise.reject(err)));
}
async function requiresLauncher(gamePath, store) {
  if (store === "xbox") {
    return Promise.resolve({
      launcher: "xbox",
      addInfo: {
        appId: XBOX_ID,
        parameters: [{ appExecName: "NoMansSky" }]
      }
    });
  } else {
    return Promise.resolve(void 0);
  }
}
function getPakPath(api, game) {
  const discovery = api.getState().settings.gameMode.discovered[game.id];
  if (!discovery || !discovery.path) {
    return ".";
  }
  const dataPath = import_path.default.join(discovery.path, deprecatedModPath());
  return dataPath;
}
function getBinariesPath(api, game) {
  const discovery = api.getState().settings.gameMode.discovered[game.id];
  if (!discovery || !discovery.path) {
    return ".";
  }
  const dataPath = import_path.default.join(discovery.path, BIN_PATH);
  return dataPath;
}
async function testDeprecatedPakMod(instructions) {
  const hasPak = instructions.some((inst) => inst.source && inst.source.match(/\.pak$/i));
  return Promise.resolve(hasPak);
}
async function testBinariesMod(instructions) {
  const hasDll = instructions.some((inst) => inst.source && inst.source.match(/\.dll$/i));
  return Promise.resolve(hasDll);
}
async function getGameVersion(gamePath) {
  const exeVersion = require("exe-version");
  return Promise.resolve(exeVersion.getProductVersionLocalized(import_path.default.join(gamePath, EXEC)));
}
function main(context) {
  context.registerGame({
    id: GAME_ID,
    name: "No Man's Sky",
    mergeMods: true,
    queryPath: findGame,
    getGameVersion,
    queryModPath: modPath,
    logo: "gameart.jpg",
    executable: () => EXEC,
    requiredFiles: [
      EXEC
    ],
    requiresLauncher,
    setup: (discovery) => prepareForModding(context.api, discovery),
    environment: {
      SteamAPPId: STEAMAPP_ID
    },
    details: {
      steamAppId: +STEAMAPP_ID
    }
  });
  context.registerModType(
    MODTYPE_DEPRECATED_PAK,
    100,
    (gameId) => GAME_ID === gameId,
    (game) => getPakPath(context.api, game),
    testDeprecatedPakMod,
    { deploymentEssential: false, name: "Deprecated PAK" }
  );
  context.registerModType(
    `${GAME_ID}-binaries`,
    90,
    (gameId) => GAME_ID === gameId,
    (game) => getBinariesPath(context.api, game),
    testBinariesMod,
    { name: "Binaries (Engine Injector)" }
  );
  context.registerMigration((old) => migrate101(context.api, old));
  return true;
}
module.exports = {
  default: main
};
//# sourceMappingURL=index.js.map
