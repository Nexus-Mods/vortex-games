//Import some assets from Vortex we'll need.
const path = require("path");
const { fs, log, util } = require("vortex-api");

const GAME_ID = "mysummercar";
const STEAMAPP_ID = "516750";
const MSCLOADER_MODPAGE = "https://www.nexusmods.com/mysummercar/mods/147";
const MOD_FILE_EXT = ".dll";
const ASSETS_DIR = "Assets";
const REFS_DIR = "References";
const VTS_DIR = "VehicleTextureSwap";

const moddingTools = [
  {
    executable: () => "MSCEditor.exe",
    id: "MSCEditor",
    logo: "msce.png",
    name: "MSCEditor",
    requiredFiles: [
      "MSCEditor.exe"
    ]
  }
];

function findGame() {
  return util.GameStoreHelper.findByAppId([STEAMAPP_ID])
    .then((game) => game.gamePath);
}

function prepareForModding(discovery, api) {
  var loaderPath = path.join(discovery.path,
    "mysummercar_Data", "Managed", "MSCLoader.dll");
  return fs.statAsync(loaderPath)
    .catch(() => {
      api.sendNotification({
        actions: [
          {
            action: () => util.opn(MSCLOADER_MODPAGE).catch(() => undefined),
            title: "Get MSCLoader"
          }
        ],
        id: "modloader-missing",
        message: "MSCLoader is required to mod My Summer Car.",
        title: "MSCLoader not installed into game directory",
        type: "warning"
      });
    });
}

function findRootPath(files, api) {
  const modFiles = files.filter((file) => (
    path.extname(file).toLowerCase() === MOD_FILE_EXT)
    && !file.includes("Debug") // Skip Debug builds from GitHub
    && !file.endsWith(path.sep)
    && !path.dirname(file).endsWith(REFS_DIR)
  );

  const modDirs = Array.from(
    modFiles.reduce(function(map, file) {
      map.set(path.dirname(file), {});
      return map;
    }, new Map())
    .keys()
  );

  if (modDirs.length === 0) {
    throw new Error("No DLL files were found in the specified mod. Only DLL-based mods are supported.");
  }
  if (modDirs.length > 1) {
    const fmtDirs = allDirs.join()
    throw new Error(`Mods with DLLs in more than one directory are not supported: ${fmtDirs}`);
  }
  return modDirs[0];
}

function locateModFiles(rootPath, files, api) {
  // Disregard anything placed outside the root (where mod .dll is).
  const filtered = files.filter((file) => (
    (rootPath === "." || file.indexOf(rootPath) !== -1)
    && (!file.endsWith(path.sep))
    && (!file.toLowerCase().includes("do not copy"))
  ));

  for (const file of filtered) {
    const dir = path.dirname(file);
    if (dir !== rootPath
        && !(dir === ".." && rootPath === ".")
        && !dir.includes(REFS_DIR)
        && !dir.includes(ASSETS_DIR)
        && !dir.includes(VTS_DIR)) {
      throw new Error(`Mods with files outside the primary {Mods,Mods\Assets,Mods\References} directories are unsupported: ${dir}.`);
    }
  }

  return filtered;
}

function testSupportedContent(files, gameId, api) {
  var supported = (gameId === GAME_ID);
  const rootPath = findRootPath(files, api);
  const modFiles = locateModFiles(rootPath, files, api);

  return Promise.resolve({
    requiredFiles: [],
    supported
  });
}

function installContent(files, api) {
  const rootPath = findRootPath(files, api);
  const idx = rootPath === "." ? 0 : rootPath.length + 1; // For the leading path.sep
  const filtered = locateModFiles(rootPath, files, api);

  const instructions = filtered.map(file => {
    var dir = "Mods";
    if (file.includes(path.join(VTS_DIR, path.sep))) {
        dir = "Images";
    }
    const dst = path.join(dir, file.substring(idx));
    return {
      destination: dst,
      source: file,
      type: "copy"
    };
  });

  return Promise.resolve({ instructions });
}

function main(context) {
  context.registerGame({
    details: {
      steamAppId: STEAMAPP_ID
    },
    environment: {
      SteamAPPId: STEAMAPP_ID
    },
    executable: () => "mysummercar.exe",
    id: GAME_ID,
    logo: "gameart.jpg",
    mergeMods: true,
    name: "My Summer Car",
    queryModPath: () => "",
    queryPath: findGame,
    requiredFiles: [
      "mysummercar.exe"
    ],
    setup: (discovery) => prepareForModding(discovery, context.api),
    supportedTools: moddingTools
  });
  context.registerInstaller(
    "mysummercar-mod",
    25,
    (files, gameId) => testSupportedContent(files, gameId, context.api),
    (files) => installContent(files, context.api)
  );

  return true;
}

module.exports = {
  default: main
};
