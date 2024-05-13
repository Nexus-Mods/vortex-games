const GAME_ID = 'sunlesssea';
const STEAMAPP_ID = '304650';
const EPICAPP_ID = '2420b50453144c07b3b847fff941275d'
const GOGAPP_ID = '1421064427';

const LOCALLOW_PATH = "LocalLow/Failbetter Games/Sunless Sea/"

const JSON_MOD_PATH = (() => {
    let cached;
    return () => {
        if (cached === undefined) {
            cached = path.resolve(util.getVortexPath('appData'), '..', LOCALLOW_PATH);
        }
        return cached;
    };
})();

const BEPINEX_MOD_EXT = ".dll";

var installPath
var modType

var namelessModInstalls = 0
var prepath = ""

var cont // Save context for later use

const path = require('path');
const {
    fs,
    log,
    util
} = require('vortex-api');

function main(context) {
    cont = context

    context.registerGame({
        id: GAME_ID,
        name: 'Sunless Sea',
        mergeMods: true,
        queryPath: findGame,
        supportedTools: [],
        queryModPath: () => '',
        logo: 'gameart.jpg',
        executable: () => 'Sunless Sea.exe',
        requiredFiles: ['Sunless Sea.exe'],
        setup: prepareForModding,
        environment: {
            SteamAPPId: STEAMAPP_ID,
        },
        details: {
            steamAppId: STEAMAPP_ID,
            gogAppId: GOGAPP_ID,
            epicAppId: EPICAPP_ID
        },
    });
    // Create a seperate mod type for installing JSON mods to %localappdata%low
    context.registerModType("JSON Addon Mod", 2, (gameId) => gameId === GAME_ID, JSON_MOD_PATH, () => Promise.resolve(false));

    context.registerInstaller("Code Injection Mods", 1, isBepInExMod, installContent)
    context.registerInstaller("JSON Addon Mods", 2, isJSONAddon, installContent)

    return true
}

async function prepareForModding(discovery) { // Check whether these directories are writable so Vortex doesn't throw a hissy fit
    const ensureDir = async (dirPath) => {
        const createPath = path.isAbsolute(dirPath) ? dirPath : path.join(discovery.path, dirPath);
        return fs.ensureDirWritableAsync(createPath);
    }
    return Promise.all(["BepInEx/plugins", "BepInEx/patchers", JSON_MOD_PATH()].map(dirPath => ensureDir(dirPath)));
}

function isBepInExMod(files) {
    // Check if any of the files in the mod archive have a BepInEx mod 
    let hasBepInExMod = files.some(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === BEPINEX_MOD_EXT;
    });
    if (hasBepInExMod) {
        // Initial setup for loading BepInEx mods
        modType = "bep"
        installPath = checkBepInExDirectoryStructure(files)
    }

    let supported = hasBepInExMod
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}

function isJSONAddon(files) {
    // Initial setup for loading JSON mods
    modType = "json"
    installPath = checkJsonDirectoryStructure(files)
    let supported = true
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}



function checkBepInExDirectoryStructure(files) {
    const hasBepInExFolder = files.some(file => file.toLowerCase() == 'bepinex\\');
    if (hasBepInExFolder) {
        return ""; // If the mod contains a BepInEx folder, install it to the base directory
    }

    const hasPluginsFolder = files.some(file => file.toLowerCase() == 'plugins\\');
    if (hasPluginsFolder) {
        // If the mod contains only a 'plugins' folder, install it to the BepInEx directory
        return "/BepInEx";
    }

    // If none of the above conditions are met, install it to the 'plugins' directory
    return "/BepInEx/plugins";
}

function installContent(files) {
    const filtered = files.filter(file =>
        (!file.endsWith(path.sep)));

    let instructions = filtered.map(file => {
        console.log("removing prepath " + prepath)

        const destinationPath = path.join(installPath, file.startsWith(prepath) ? file.substring(prepath.length) : file);
        console.log("install to " + destinationPath)
        return {
            type: 'copy',
            source: file,
            destination: destinationPath,
        };
    });

    if (modType === "json") { // Change the install path if it's a json mod
        const modTypeInstr = {
            type: 'setmodtype',
            value: 'JSON Addon Mod',
        };
        instructions.push(modTypeInstr);
    }

    return Promise.resolve({
        instructions
    });
}

function checkJsonDirectoryStructure(files) {
    const baseFolders = ['addon', 'images'];
    const subFolders = ['entities', 'encyclopaedia', 'geography']

    prepath = ""
    let pathto = ""
    for (let i = 0; i < files.length; i++) {
        let parts = files[i].split("\\")
        for (let i2 = 0; i2 < parts.length; i2++) {
            if (baseFolders.includes(parts[i2].replace(/[\/\\]/g, ""))) {
                prepath = pathto
                break
            }
            pathto = parts[i2]
        }
        if (prepath !== "") {
            return ""
        }
    }

    // Check if it's a base mod
    const isBaseMod = files.some(file => baseFolders.includes(file.replace(/[\/\\]/g, "")));

    // const isBaseMod = baseFolders.some(folder => files.includes(folder.replace(/[\/\\]/g, "")));

    if (isBaseMod) {
        return "";
    }

    // Checks whether the first entry in the files list is a folder that should be inside another folder
    const isAModFolder = !subFolders.includes(files[0].replace(/[\/\\]/g, ""))
    // If not, just install it as is to addon

    if (isAModFolder) {
        return '/addon';
    }

    namelessModInstalls++
    cont.api.sendNotification({
        type: "warning",
        message: "Incorrect mod format, contact the mod author.",
        actions: [{
            title: "More",
            action: () => {
                cont.api.showDialog(
                    "warning",
                    "Incorrect mod format, contact the mod author.", {
                        text: "The Sunless Sea Vortex extension was coded in a way to still allow this mod to run, but it is undesirable and might break. Contact the mod author to fix the formatting error in the latest version. Mod shall be installed as Nameless Mod " + namelessModInstalls,
                        message: "Accepted formats for addons:\nARCHIVE > Mod Folder > entities/geography etc > JSON\nARCHIVE > addons > Mod Folder > entities/geography etc > JSON\nYour format:\nARCHIVE > entities/geography etc > JSON\nor other",
                    },
                    [{
                        label: "Close"
                    }]
                )
            }
        }, ]
    })

    return path.join('/addon', "Nameless Mod " + namelessModInstalls);
}

function findGame() {
    return util.GameStoreHelper.findByAppId([STEAMAPP_ID, EPICAPP_ID, GOGAPP_ID])
        .then(game => game.gamePath);
}

module.exports = {
    default: main,
};