"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const semver = __importStar(require("semver"));
const child_process_1 = require("child_process");
const localeFoldersXbox = {
    en: 'Fallout New Vegas English',
    fr: 'Fallout New Vegas French',
    de: 'Fallout New Vegas German',
    it: 'Fallout New Vegas Italian',
    es: 'Fallout New Vegas Spanish',
};
const GAME_ID = 'falloutnv';
const NEXUS_DOMAIN_NAME = 'newvegas';
const STEAMAPP_ID = '22380';
const STEAMAPP_ID2 = '22490';
const GOG_ID = '1454587428';
const MS_ID = 'BethesdaSoftworks.FalloutNewVegas';
const EPIC_ID = '5daeb974a22a435988892319b3a4f476';
const PATCH_4GB_MOD_ID = 62552;
const PATCH_4GB_EXECUTABLES = ['FNVpatch.exe', 'FalloutNVpatch.exe'];
let selectedLanguage = undefined;
let multipleLanguages = false;
const gameStoreIds = {
    steam: [{ id: STEAMAPP_ID, prefer: 0 }, { id: STEAMAPP_ID2 }, { name: 'Fallout: New Vegas.*' }],
    xbox: [{ id: MS_ID }],
    gog: [{ id: GOG_ID }],
    epic: [{ id: EPIC_ID }],
    registry: [{ id: 'HKEY_LOCAL_MACHINE:Software\\Wow6432Node\\Bethesda Softworks\\falloutnv:Installed Path' }],
};
function findGame() {
    return __awaiter(this, void 0, void 0, function* () {
        const storeGames = yield vortex_api_1.util.GameStoreHelper.find(gameStoreIds).catch(() => []);
        if (!storeGames.length)
            return;
        if (storeGames.length > 1)
            (0, vortex_api_1.log)('debug', 'Mutliple copies of New Vegas found', storeGames.map(s => s.gameStoreId));
        const selectedGame = storeGames[0];
        if (['epic', 'xbox'].includes(selectedGame.gameStoreId)) {
            try {
                const folders = yield vortex_api_1.fs.readdirAsync(selectedGame.gamePath).filter(p => !path_1.default.extname(p) && !p.startsWith('.'));
                const availableLocales = Object.keys(localeFoldersXbox).reduce((accum, cur) => {
                    const localeFolderName = localeFoldersXbox[cur];
                    if (folders.includes(localeFolderName))
                        accum.push(cur);
                    return accum;
                }, []);
                if (!availableLocales.length) {
                    (0, vortex_api_1.log)('warn', 'Could not find any recognised locale folders for New Vegas', { folders, path: selectedGame.gamePath });
                    selectedGame.gamePath = path_1.default.join(selectedGame.gamePath, folders[0]);
                    selectedLanguage = folders[0].toUpperCase().replace('Fallout New Vegas', '').trim();
                }
                else if (availableLocales.length === 1)
                    selectedGame.gamePath = path_1.default.join(selectedGame.gamePath, localeFoldersXbox[availableLocales[0]]);
                else {
                    const selectedLocale = availableLocales.includes('en') ? 'en' : availableLocales[0];
                    selectedLanguage = selectedLocale.toUpperCase();
                    multipleLanguages = true;
                    (0, vortex_api_1.log)('debug', `Defaulting to the ${selectedLocale} game version`, { store: selectedGame.gameStoreId, folder: localeFoldersXbox[selectedLocale] });
                    selectedGame.gamePath = path_1.default.join(selectedGame.gamePath, localeFoldersXbox[selectedLocale]);
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'Could not check for Fallout NV locale paths', err);
            }
        }
        return selectedGame;
    });
}
const tools = [
    {
        id: 'FNVEdit',
        name: 'FNVEdit',
        logo: 'fo3edit.png',
        executable: () => 'FNVEdit.exe',
        requiredFiles: [
            'FNVEdit.exe',
        ],
    },
    {
        id: 'WryeBash',
        name: 'Wrye Bash',
        logo: 'wrye.png',
        executable: () => 'Wrye Bash.exe',
        requiredFiles: [
            'Wrye Bash.exe',
        ],
    },
    {
        id: 'nvse',
        name: 'New Vegas Script Extender',
        logo: 'nvse.png',
        shortName: 'NVSE',
        executable: () => 'nvse_loader.exe',
        requiredFiles: [
            'nvse_loader.exe',
            'FalloutNV.exe',
        ],
        relative: true,
        exclusive: true,
        defaultPrimary: true,
    }
];
function downloadAndInstall4GBPatch(api) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        let nxmUrl = 'https://www.nexusmods.com/newvegas/mods/62552?tab=files';
        try {
            if (((_a = api.ext) === null || _a === void 0 ? void 0 : _a.ensureLoggedIn) !== undefined) {
                yield api.ext.ensureLoggedIn();
            }
            const modFiles = yield api.ext.nexusGetModFiles(GAME_ID, PATCH_4GB_MOD_ID);
            const file = modFiles
                .filter(file => file.category_id === 1)
                .sort((lhs, rhs) => semver.rcompare(vortex_api_1.util.coerceToSemver(lhs.version), vortex_api_1.util.coerceToSemver(rhs.version)))[0];
            if (file === undefined) {
                throw new vortex_api_1.util.ProcessCanceled('No 4GB patch main file found');
            }
            const dlInfo = {
                game: GAME_ID,
                name: '4GB Patch',
            };
            const existingDownload = vortex_api_1.selectors.getDownloadByIds(api.getState(), {
                gameId: GAME_ID,
                modId: PATCH_4GB_MOD_ID,
                fileId: file.file_id,
            });
            nxmUrl = `nxm://${GAME_ID}/mods/${PATCH_4GB_MOD_ID}/files/${file.file_id}`;
            const dlId = existingDownload
                ? existingDownload.id
                : yield vortex_api_1.util.toPromise(cb => api.events.emit('start-download', [nxmUrl], dlInfo, undefined, cb, 'never', { allowInstall: false }));
            const existingMod = vortex_api_1.selectors.getMod(api.getState(), GAME_ID, PATCH_4GB_MOD_ID);
            const modId = (((existingMod === null || existingMod === void 0 ? void 0 : existingMod.state) === 'installed') && (((_b = existingMod.attributes) === null || _b === void 0 ? void 0 : _b.fileId) === file.file_id))
                ? existingMod.id
                : yield vortex_api_1.util.toPromise(cb => api.events.emit('start-install-download', dlId, { allowAutoEnable: false }, cb));
            const profileId = vortex_api_1.selectors.lastActiveProfileForGame(api.getState(), GAME_ID);
            yield vortex_api_1.actions.setModsEnabled(api, profileId, [modId], true, {
                allowAutoDeploy: false,
                installed: true,
            });
            yield api.emitAndAwait('deploy-single-mod', GAME_ID, modId);
            yield runInstaller4GBPatch(api, modId);
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'Failed to download patch', err);
            vortex_api_1.util.opn(nxmUrl).catch(() => null);
        }
    });
}
function runInstaller4GBPatch(api, modId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const mod = vortex_api_1.selectors.getMod(state, GAME_ID, modId);
        if (!(mod === null || mod === void 0 ? void 0 : mod.installationPath)) {
            (0, vortex_api_1.log)('error', `Could not find mod ${modId} for 4GB patch installation`);
            return;
        }
        const discovery = vortex_api_1.selectors.discoveryByGame(state, GAME_ID);
        if (!(discovery === null || discovery === void 0 ? void 0 : discovery.path)) {
            (0, vortex_api_1.log)('error', 'Could not find game path for 4GB patch installation');
            return;
        }
        const installPath = vortex_api_1.selectors.getModInstallPath(state, GAME_ID, modId);
        if (!installPath) {
            (0, vortex_api_1.log)('error', 'Could not find installation path for 4GB patch mod');
            return;
        }
        const files = yield vortex_api_1.fs.readdirAsync(installPath);
        const patchExec = files.find(f => PATCH_4GB_EXECUTABLES.includes(f));
        if (!patchExec) {
            (0, vortex_api_1.log)('error', 'Could not find 4GB patch executable');
            return;
        }
        const patchPath = path_1.default.join(installPath, patchExec);
        try {
            yield new Promise((resolve, reject) => {
                var _a, _b;
                const cp = (0, child_process_1.spawn)(patchPath, [], {
                    cwd: discovery.path,
                    stdio: ['pipe', 'pipe', 'pipe'],
                });
                (_a = cp.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
                    var _a;
                    const lines = data.toString().split('\n').map(l => l.trim()).filter(l => l);
                    const logLines = lines.map(l => `[4GB Patch Installer] ${l}`);
                    (0, vortex_api_1.log)('info', logLines.join('\n'));
                    if (logLines.map(l => l.toLowerCase()).some(l => l.includes('any key'))) {
                        (_a = cp.stdin) === null || _a === void 0 ? void 0 : _a.write('\n');
                    }
                });
                (_b = cp.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (data) => {
                    (0, vortex_api_1.log)('warn', `[4GB Patch Installer] ${data.toString()}`);
                });
                cp.on('error', (error) => {
                    reject(error);
                });
                cp.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    }
                    else {
                        reject(new Error(`4GB patch installer exited with code ${code}`));
                    }
                });
            });
            api.sendNotification({
                type: 'success',
                message: '4GB patch installed successfully',
                displayMS: 3000,
            });
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'Failed to run 4GB patch installer', err);
            api.sendNotification({
                type: 'error',
                message: 'Failed to install 4GB patch',
                displayMS: 5000,
            });
        }
    });
}
function testFor4GBPatch(api) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const state = api.getState();
        const activeGameId = vortex_api_1.selectors.activeGameId(state);
        const discovery = (_a = state.settings.gameMode.discovered) === null || _a === void 0 ? void 0 : _a[GAME_ID];
        if (activeGameId !== GAME_ID || !(discovery === null || discovery === void 0 ? void 0 : discovery.path)) {
            return undefined;
        }
        const exePath = path_1.default.join(discovery.path, 'FalloutNV.exe');
        const hasBackupFile = () => vortex_api_1.fs.statAsync(path_1.default.join(path_1.default.dirname(exePath), path_1.default.basename(exePath, '.exe') + '_backup.exe'))
            .then(() => true)
            .catch(() => false);
        try {
            const hasBackup = yield hasBackupFile();
            if (hasBackup) {
                return undefined;
            }
            return {
                description: {
                    short: 'FalloutNV.exe requires 4GB patch',
                    long: 'Fallout New Vegas requires the 4GB patch to work correctly with many mods. ' +
                        'The patch allows the game to use more than 2GB of RAM, preventing crashes and improving stability.',
                },
                severity: 'warning',
                onRecheck: () => hasBackupFile(),
                automaticFix: () => downloadAndInstall4GBPatch(api),
            };
        }
        catch (err) {
            (0, vortex_api_1.log)('debug', 'Could not check 4GB patch status', err.message);
            return undefined;
        }
        return undefined;
    });
}
function prepareForModding(api, discovery) {
    var _a;
    const gameName = ((_a = vortex_api_1.util.getGame(GAME_ID)) === null || _a === void 0 ? void 0 : _a.name) || 'This game';
    if (discovery.store && ['epic', 'xbox'].includes(discovery.store)) {
        const storeName = discovery.store === 'epic' ? 'Epic Games' : 'Xbox Game Pass';
        if (multipleLanguages)
            api.sendNotification({
                id: `${GAME_ID}-locale-message`,
                type: 'info',
                title: 'Multiple Languages Available',
                message: `Default: ${selectedLanguage}`,
                allowSuppress: true,
                actions: [
                    {
                        title: 'More',
                        action: (dismiss) => {
                            dismiss();
                            api.showDialog('info', 'Mutliple Languages Available', {
                                bbcode: '{{gameName}} has multiple language options when downloaded from {{storeName}}. [br][/br][br][/br]' +
                                    'Vortex has selected the {{selectedLanguage}} variant by default. [br][/br][br][/br]' +
                                    'If you would prefer to manage a different language you can change the path to the game using the "Manually Set Location" option in the games tab.',
                                parameters: { gameName, storeName, selectedLanguage }
                            }, [
                                { label: 'Close', action: () => api.suppressNotification(`${GAME_ID}-locale-message`) }
                            ]);
                        }
                    }
                ]
            });
    }
    return Promise.resolve();
}
function requiresLauncher(gamePath, store) {
    return __awaiter(this, void 0, void 0, function* () {
        const xboxSettings = {
            launcher: 'xbox',
            addInfo: {
                appId: MS_ID,
                parameters: [
                    { appExecName: 'Game' },
                ],
            }
        };
        const epicSettings = {
            launcher: 'epic',
            addInfo: {
                appId: EPIC_ID,
            }
        };
        if (store !== undefined) {
            if (store === 'xbox')
                return xboxSettings;
            if (store === 'epic')
                return epicSettings;
            else
                return undefined;
        }
        try {
            const game = yield vortex_api_1.util.GameStoreHelper.findByAppId([MS_ID], 'xbox');
            const normalizeFunc = yield vortex_api_1.util.getNormalizeFunc(gamePath);
            if (normalizeFunc(game.gamePath) === normalizeFunc(gamePath))
                return xboxSettings;
            else
                return undefined;
        }
        catch (err) {
            return undefined;
        }
    });
}
function testInstaller4GBPatch(api) {
    return (files, gameId, archivePath, details) => {
        const state = api.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        if (gameMode !== GAME_ID || (details === null || details === void 0 ? void 0 : details.hasXmlConfigXML) || (details === null || details === void 0 ? void 0 : details.hasCSScripts)) {
            return Promise.resolve({ supported: false, requiredFiles: [] });
        }
        const lowered = files.map(f => f.toLowerCase());
        const hasPatchExe = PATCH_4GB_EXECUTABLES.some(execName => lowered.includes(execName.toLowerCase()));
        if (hasPatchExe) {
            return Promise.resolve({ supported: true, requiredFiles: [] });
        }
        return Promise.resolve({ supported: false, requiredFiles: [] });
    };
}
function applyInstaller4GBPatch(api) {
    return (files, destinationPath, gameId, progressDelegate, choices, unattended, archivePath, options) => __awaiter(this, void 0, void 0, function* () {
        const instructions = files.map(f => ({
            type: 'copy',
            source: f,
            destination: f,
        }));
        const attrib = {
            type: 'attribute',
            key: 'is4GBPatcher',
            value: true,
        };
        const modTypeInstr = {
            type: 'setmodtype',
            value: 'dinput',
        };
        instructions.push(modTypeInstr);
        return { instructions: [...instructions, attrib, modTypeInstr] };
    });
}
function main(context) {
    context.requireExtension('Fallout New Vegas Sanity Checks', undefined, true);
    context.registerGame({
        id: GAME_ID,
        name: 'Fallout:\tNew Vegas',
        setup: (discovery) => prepareForModding(context.api, discovery),
        shortName: 'New Vegas',
        mergeMods: true,
        queryPath: findGame,
        requiresLauncher: requiresLauncher,
        supportedTools: tools,
        queryModPath: () => 'Data',
        logo: 'gameart.jpg',
        executable: () => 'FalloutNV.exe',
        requiredFiles: [
            'FalloutNV.exe',
        ],
        environment: {
            SteamAPPId: '22380',
        },
        details: {
            steamAppId: 22380,
            nexusPageId: NEXUS_DOMAIN_NAME,
            hashFiles: [
                'Data/Update.bsa',
                'Data/FalloutNV.esm',
            ],
        }
    });
    context.registerTest('falloutnv-4gb-patch', 'gamemode-activated', () => testFor4GBPatch(context.api));
    context.registerInstaller('falloutnv-4gb-patch', 25, testInstaller4GBPatch(context.api), applyInstaller4GBPatch(context.api));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBc0U7QUFFdEUsK0NBQWlDO0FBQ2pDLGlEQUFzQztBQUt0QyxNQUFNLGlCQUFpQixHQUFHO0lBQ3hCLEVBQUUsRUFBRSwyQkFBMkI7SUFDL0IsRUFBRSxFQUFFLDBCQUEwQjtJQUM5QixFQUFFLEVBQUUsMEJBQTBCO0lBQzlCLEVBQUUsRUFBRSwyQkFBMkI7SUFDL0IsRUFBRSxFQUFFLDJCQUEyQjtDQUNoQyxDQUFBO0FBRUQsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDO0FBQzVCLE1BQU0saUJBQWlCLEdBQUcsVUFBVSxDQUFDO0FBQ3JDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQztBQUM1QixNQUFNLFlBQVksR0FBRyxPQUFPLENBQUM7QUFDN0IsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQzVCLE1BQU0sS0FBSyxHQUFHLG1DQUFtQyxDQUFDO0FBQ2xELE1BQU0sT0FBTyxHQUFHLGtDQUFrQyxDQUFDO0FBRW5ELE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO0FBQy9CLE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxjQUFjLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztBQUVyRSxJQUFJLGdCQUFnQixHQUFHLFNBQVMsQ0FBQztBQUNqQyxJQUFJLGlCQUFpQixHQUFHLEtBQUssQ0FBQztBQVM5QixNQUFNLFlBQVksR0FBbUQ7SUFDbkUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxzQkFBc0IsRUFBRSxDQUFDO0lBQy9GLElBQUksRUFBRSxDQUFDLEVBQUUsRUFB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LFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNO1FBQzFCLElBQUksRUFBRSxhQUFhO1FBQ25CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxlQUFlO1FBQ2pDLGFBQWEsRUFBRTtZQUNiLGVBQWU7U0FDaEI7UUFDRCxXQUFXLEVBQUU7WUFDWCxVQUFVLEVBQUUsT0FBTztTQUNwQjtRQUNELE9BQU8sRUFBRTtZQUNQLFVBQVUsRUFBRSxLQUFLO1lBQ2pCLFdBQVcsRUFBRSxpQkFBaUI7WUFDOUIsU0FBUyxFQUFFO2dCQUNULGlCQUFpQjtnQkFDakIsb0JBQW9CO2FBQ3JCO1NBQ0Y7S0FDRixDQUFDLENBQUM7SUFHSCxPQUFPLENBQUMsWUFBWSxDQUFDLHFCQUFxQixFQUFFLG9CQUFvQixFQUM5RCxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBUSxDQUFDLENBQUM7SUFHN0MsT0FBTyxDQUFDLGlCQUFpQixDQUN2QixxQkFBcUIsRUFBRSxFQUFFLEVBQ3pCLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQVEsRUFDekMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBUSxDQUMzQyxDQUFDO0lBRUYsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElGaWxlSW5mbyB9IGZyb20gJ0BuZXh1c21vZHMvbmV4dXMtYXBpJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0ICogYXMgbm9kZUZzIGZyb20gJ2ZzJztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcblxyXG4vLyBMaXN0IG9mIGZvbGRlcnMgaW4gdGhlIHZhcmlvdXMgbGFuZ3VhZ2VzIG9uIFhib3gsIGZvciBub3cgd2UgZGVmYXVsdCB0byBFbmdsaXNoIGJ1dCB0aGlzIGNvdWxkIGJlIGVuaGFuY2VkIHRvIHNlbGVjdCBhIGZvbGRlciBiYXNlZCBvbiB0aGUgVm9ydGV4IGxvY2FsZS5cclxuLy8gSXQncyBwb3NzaWJsZSB0aGF0IHNvbWUgbW9kcyBkb24ndCB3b3JrIHdpdGggdGhlIG5vbi1FbmdsaXNoIHZhcmlhbnQuIFxyXG4vLyBTdHJ1Y3R1cmUgaXMge0dBTUUgRk9MREVSfVxcQ29udGVudFxce0xBTkdVQUdFIEZPTERFUn1cclxuY29uc3QgbG9jYWxlRm9sZGVyc1hib3ggPSB7XHJcbiAgZW46ICdGYWxsb3V0IE5ldyBWZWdhcyBFbmdsaXNoJyxcclxuICBmcjogJ0ZhbGxvdXQgTmV3IFZlZ2FzIEZyZW5jaCcsXHJcbiAgZGU6ICdGYWxsb3V0IE5ldyBWZWdhcyBHZXJtYW4nLFxyXG4gIGl0OiAnRmFsbG91dCBOZXcgVmVnYXMgSXRhbGlhbicsXHJcbiAgZXM6ICdGYWxsb3V0IE5ldyBWZWdhcyBTcGFuaXNoJyxcclxufVxyXG5cclxuY29uc3QgR0FNRV9JRCA9ICdmYWxsb3V0bnYnO1xyXG5jb25zdCBORVhVU19ET01BSU5fTkFNRSA9ICduZXd2ZWdhcyc7XHJcbmNvbnN0IFNURUFNQVBQX0lEID0gJzIyMzgwJztcclxuY29uc3QgU1RFQU1BUFBfSUQyID0gJzIyNDkwJztcclxuY29uc3QgR09HX0lEID0gJzE0NTQ1ODc0MjgnO1xyXG5jb25zdCBNU19JRCA9ICdCZXRoZXNkYVNvZnR3b3Jrcy5GYWxsb3V0TmV3VmVnYXMnO1xyXG5jb25zdCBFUElDX0lEID0gJzVkYWViOTc0YTIyYTQzNTk4ODg5MjMxOWIzYTRmNDc2JztcclxuXHJcbmNvbnN0IFBBVENIXzRHQl9NT0RfSUQgPSA2MjU1MjtcclxuY29uc3QgUEFUQ0hfNEdCX0VYRUNVVEFCTEVTID0gWydGTlZwYXRjaC5leGUnLCAnRmFsbG91dE5WcGF0Y2guZXhlJ107XHJcblxyXG5sZXQgc2VsZWN0ZWRMYW5ndWFnZSA9IHVuZGVmaW5lZDtcclxubGV0IG11bHRpcGxlTGFuZ3VhZ2VzID0gZmFsc2U7XHJcblxyXG5pbnRlcmZhY2UgSVBhdGNoSW5mbyB7XHJcbiAgb2Zmc2V0OiBudW1iZXI7XHJcbiAgb3JpZ2luYWw6IG51bWJlcjtcclxuICBwYXRjaGVkOiBudW1iZXI7XHJcbiAgbmFtZTogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBnYW1lU3RvcmVJZHM6IHsgW2dhbWVTdG9yZUlkOiBzdHJpbmddOiB0eXBlcy5JU3RvcmVRdWVyeVtdIH0gPSB7XHJcbiAgc3RlYW06IFt7IGlkOiBTVEVBTUFQUF9JRCwgcHJlZmVyOiAwIH0sIHsgaWQ6IFNURUFNQVBQX0lEMiB9LCB7IG5hbWU6ICdGYWxsb3V0OiBOZXcgVmVnYXMuKicgfV0sXHJcbiAgeGJveDogW3sgaWQ6IE1TX0lEIH1dLFxyXG4gIGdvZzogW3sgaWQ6IEdPR19JRCB9XSxcclxuICBlcGljOiBbeyBpZDogRVBJQ19JRCB9XSxcclxuICByZWdpc3RyeTogW3sgaWQ6ICdIS0VZX0xPQ0FMX01BQ0hJTkU6U29mdHdhcmVcXFxcV293NjQzMk5vZGVcXFxcQmV0aGVzZGEgU29mdHdvcmtzXFxcXGZhbGxvdXRudjpJbnN0YWxsZWQgUGF0aCcgfV0sXHJcbn07XHJcblxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgY29uc3Qgc3RvcmVHYW1lcyA9IGF3YWl0IHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmQoZ2FtZVN0b3JlSWRzKS5jYXRjaCgoKSA9PiBbXSk7XHJcblxyXG4gIGlmICghc3RvcmVHYW1lcy5sZW5ndGgpIHJldHVybjtcclxuICBcclxuICBpZiAoc3RvcmVHYW1lcy5sZW5ndGggPiAxKSBsb2coJ2RlYnVnJywgJ011dGxpcGxlIGNvcGllcyBvZiBOZXcgVmVnYXMgZm91bmQnLCBzdG9yZUdhbWVzLm1hcChzID0+IHMuZ2FtZVN0b3JlSWQpKTtcclxuXHJcbiAgY29uc3Qgc2VsZWN0ZWRHYW1lID0gc3RvcmVHYW1lc1swXTtcclxuICBpZiAoWydlcGljJywgJ3hib3gnXS5pbmNsdWRlcyhzZWxlY3RlZEdhbWUuZ2FtZVN0b3JlSWQpKSB7XHJcbiAgICAvLyBHZXQgYSBsaXN0IG9mIGZvbGRlcnMgaW4gdGhlIGluc3RhbGxhdGlvbi5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGZvbGRlcnM6IHN0cmluZ1tdID0gYXdhaXQgZnMucmVhZGRpckFzeW5jKHNlbGVjdGVkR2FtZS5nYW1lUGF0aCkuZmlsdGVyKHAgPT4gIXBhdGguZXh0bmFtZShwKSAmJiAhcC5zdGFydHNXaXRoKCcuJykpO1xyXG4gICAgICBjb25zdCBhdmFpbGFibGVMb2NhbGVzID0gT2JqZWN0LmtleXMobG9jYWxlRm9sZGVyc1hib3gpLnJlZHVjZSgoYWNjdW0sIGN1cikgPT4ge1xyXG4gICAgICAgIGNvbnN0IGxvY2FsZUZvbGRlck5hbWUgPSBsb2NhbGVGb2xkZXJzWGJveFtjdXJdO1xyXG4gICAgICAgIGlmIChmb2xkZXJzLmluY2x1ZGVzKGxvY2FsZUZvbGRlck5hbWUpKSBhY2N1bS5wdXNoKGN1cik7XHJcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgICB9LCBbXSk7XHJcbiAgICAgIGlmICghYXZhaWxhYmxlTG9jYWxlcy5sZW5ndGgpIHtcclxuICAgICAgICBsb2coJ3dhcm4nLCAnQ291bGQgbm90IGZpbmQgYW55IHJlY29nbmlzZWQgbG9jYWxlIGZvbGRlcnMgZm9yIE5ldyBWZWdhcycsIHtmb2xkZXJzLCBwYXRoOiBzZWxlY3RlZEdhbWUuZ2FtZVBhdGh9KTtcclxuICAgICAgICBzZWxlY3RlZEdhbWUuZ2FtZVBhdGggPSBwYXRoLmpvaW4oc2VsZWN0ZWRHYW1lLmdhbWVQYXRoLCBmb2xkZXJzWzBdKTtcclxuICAgICAgICAvLyBHZXQgdGhlIGxhc3Qgd29yZCBvZiB0aGUgZm9sZGVyIG5hbWUgdG8gc2hvdyBhcyBhIGxhbmd1YWdlXHJcbiAgICAgICAgc2VsZWN0ZWRMYW5ndWFnZSA9IGZvbGRlcnNbMF0udG9VcHBlckNhc2UoKS5yZXBsYWNlKCdGYWxsb3V0IE5ldyBWZWdhcycsICcnKS50cmltKCk7XHJcbiAgICAgIH1cclxuICAgICAgLy8gT25seSBvbmUgbGFuZ3VhZ2U/XHJcbiAgICAgIGVsc2UgaWYgKGF2YWlsYWJsZUxvY2FsZXMubGVuZ3RoID09PSAxKSBzZWxlY3RlZEdhbWUuZ2FtZVBhdGggPSBwYXRoLmpvaW4oc2VsZWN0ZWRHYW1lLmdhbWVQYXRoLCBsb2NhbGVGb2xkZXJzWGJveFthdmFpbGFibGVMb2NhbGVzWzBdXSk7XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIEdldCB0aGUgdXNlcidzIGNob3NlbiBsYW5ndWFnZVxyXG4gICAgICAgIC8vIHN0YXRlLmludGVyZmFjZS5sYW5ndWFnZSB8fCAnZW4nOyBcclxuICAgICAgICAvLyBNdWx0aXBsZT9cclxuICAgICAgICBjb25zdCBzZWxlY3RlZExvY2FsZSA9IGF2YWlsYWJsZUxvY2FsZXMuaW5jbHVkZXMoJ2VuJykgPyAnZW4nIDogYXZhaWxhYmxlTG9jYWxlc1swXTtcclxuICAgICAgICBzZWxlY3RlZExhbmd1YWdlID0gc2VsZWN0ZWRMb2NhbGUudG9VcHBlckNhc2UoKTtcclxuICAgICAgICBtdWx0aXBsZUxhbmd1YWdlcyA9IHRydWU7XHJcbiAgICAgICAgbG9nKCdkZWJ1ZycsIGBEZWZhdWx0aW5nIHRvIHRoZSAke3NlbGVjdGVkTG9jYWxlfSBnYW1lIHZlcnNpb25gLCB7IHN0b3JlOiBzZWxlY3RlZEdhbWUuZ2FtZVN0b3JlSWQsIGZvbGRlcjogbG9jYWxlRm9sZGVyc1hib3hbc2VsZWN0ZWRMb2NhbGVdIH0pO1xyXG4gICAgICAgIHNlbGVjdGVkR2FtZS5nYW1lUGF0aCA9IHBhdGguam9pbihzZWxlY3RlZEdhbWUuZ2FtZVBhdGgsIGxvY2FsZUZvbGRlcnNYYm94W3NlbGVjdGVkTG9jYWxlXSk7XHJcbiAgICAgIH0gICAgICBcclxuICAgIH1cclxuICAgIGNhdGNoKGVycikge1xyXG4gICAgICBsb2coJ3dhcm4nLCAnQ291bGQgbm90IGNoZWNrIGZvciBGYWxsb3V0IE5WIGxvY2FsZSBwYXRocycsIGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBzZWxlY3RlZEdhbWU7XHJcbn1cclxuXHJcbmNvbnN0IHRvb2xzID0gW1xyXG4gIHtcclxuICAgIGlkOiAnRk5WRWRpdCcsXHJcbiAgICBuYW1lOiAnRk5WRWRpdCcsXHJcbiAgICBsb2dvOiAnZm8zZWRpdC5wbmcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ0ZOVkVkaXQuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ0ZOVkVkaXQuZXhlJyxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBpZDogJ1dyeWVCYXNoJyxcclxuICAgIG5hbWU6ICdXcnllIEJhc2gnLFxyXG4gICAgbG9nbzogJ3dyeWUucG5nJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdXcnllIEJhc2guZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ1dyeWUgQmFzaC5leGUnLFxyXG4gICAgXSxcclxuICB9LFxyXG4gIHtcclxuICAgIGlkOiAnbnZzZScsXHJcbiAgICBuYW1lOiAnTmV3IFZlZ2FzIFNjcmlwdCBFeHRlbmRlcicsXHJcbiAgICBsb2dvOiAnbnZzZS5wbmcnLFxyXG4gICAgc2hvcnROYW1lOiAnTlZTRScsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnbnZzZV9sb2FkZXIuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ252c2VfbG9hZGVyLmV4ZScsXHJcbiAgICAgICdGYWxsb3V0TlYuZXhlJyxcclxuICAgIF0sXHJcbiAgICByZWxhdGl2ZTogdHJ1ZSxcclxuICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcclxuICAgIGRlZmF1bHRQcmltYXJ5OiB0cnVlLFxyXG4gIH1cclxuXTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkQW5kSW5zdGFsbDRHQlBhdGNoKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGxldCBueG1VcmwgPSAnaHR0cHM6Ly93d3cubmV4dXNtb2RzLmNvbS9uZXd2ZWdhcy9tb2RzLzYyNTUyP3RhYj1maWxlcyc7XHJcbiAgdHJ5IHtcclxuICAgIGlmIChhcGkuZXh0Py5lbnN1cmVMb2dnZWRJbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGF3YWl0IGFwaS5leHQuZW5zdXJlTG9nZ2VkSW4oKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1vZEZpbGVzOiBJRmlsZUluZm9bXSA9IGF3YWl0IGFwaS5leHQubmV4dXNHZXRNb2RGaWxlcyhHQU1FX0lELCBQQVRDSF80R0JfTU9EX0lEKTtcclxuXHJcbiAgICBjb25zdCBmaWxlID0gbW9kRmlsZXNcclxuICAgICAgLmZpbHRlcihmaWxlID0+IGZpbGUuY2F0ZWdvcnlfaWQgPT09IDEpXHJcbiAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyLnJjb21wYXJlKHV0aWwuY29lcmNlVG9TZW12ZXIobGhzLnZlcnNpb24pLCB1dGlsLmNvZXJjZVRvU2VtdmVyKHJocy52ZXJzaW9uKSkpWzBdO1xyXG5cclxuICAgIGlmIChmaWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhyb3cgbmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdObyA0R0IgcGF0Y2ggbWFpbiBmaWxlIGZvdW5kJyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGxJbmZvID0ge1xyXG4gICAgICBnYW1lOiBHQU1FX0lELFxyXG4gICAgICBuYW1lOiAnNEdCIFBhdGNoJyxcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgZXhpc3RpbmdEb3dubG9hZCA9IHNlbGVjdG9ycy5nZXREb3dubG9hZEJ5SWRzKGFwaS5nZXRTdGF0ZSgpLCB7XHJcbiAgICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgICAgbW9kSWQ6IFBBVENIXzRHQl9NT0RfSUQsXHJcbiAgICAgIGZpbGVJZDogZmlsZS5maWxlX2lkLFxyXG4gICAgfSk7XHJcbiAgICBueG1VcmwgPSBgbnhtOi8vJHtHQU1FX0lEfS9tb2RzLyR7UEFUQ0hfNEdCX01PRF9JRH0vZmlsZXMvJHtmaWxlLmZpbGVfaWR9YDtcclxuICAgIGNvbnN0IGRsSWQgPSBleGlzdGluZ0Rvd25sb2FkXHJcbiAgICAgID8gZXhpc3RpbmdEb3dubG9hZC5pZFxyXG4gICAgICA6IGF3YWl0IHV0aWwudG9Qcm9taXNlPHN0cmluZz4oY2IgPT4gYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1kb3dubG9hZCcsIFtueG1VcmxdLCBkbEluZm8sIHVuZGVmaW5lZCwgY2IsICduZXZlcicsIHsgYWxsb3dJbnN0YWxsOiBmYWxzZSB9KSk7XHJcbiAgICBjb25zdCBleGlzdGluZ01vZCA9IHNlbGVjdG9ycy5nZXRNb2QoYXBpLmdldFN0YXRlKCksIEdBTUVfSUQsIFBBVENIXzRHQl9NT0RfSUQpO1xyXG4gICAgY29uc3QgbW9kSWQgPSAoKGV4aXN0aW5nTW9kPy5zdGF0ZSA9PT0gJ2luc3RhbGxlZCcpICYmIChleGlzdGluZ01vZC5hdHRyaWJ1dGVzPy5maWxlSWQgPT09IGZpbGUuZmlsZV9pZCkpXHJcbiAgICAgID8gZXhpc3RpbmdNb2QuaWRcclxuICAgICAgOiBhd2FpdCB1dGlsLnRvUHJvbWlzZTxzdHJpbmc+KGNiID0+IGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtaW5zdGFsbC1kb3dubG9hZCcsIGRsSWQsIHsgYWxsb3dBdXRvRW5hYmxlOiBmYWxzZSB9LCBjYikpO1xyXG4gICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgICBhd2FpdCBhY3Rpb25zLnNldE1vZHNFbmFibGVkKGFwaSwgcHJvZmlsZUlkLCBbbW9kSWRdLCB0cnVlLCB7XHJcbiAgICAgIGFsbG93QXV0b0RlcGxveTogZmFsc2UsXHJcbiAgICAgIGluc3RhbGxlZDogdHJ1ZSxcclxuICAgIH0pO1xyXG4gICAgYXdhaXQgYXBpLmVtaXRBbmRBd2FpdCgnZGVwbG95LXNpbmdsZS1tb2QnLCBHQU1FX0lELCBtb2RJZCk7XHJcbiAgICBhd2FpdCBydW5JbnN0YWxsZXI0R0JQYXRjaChhcGksIG1vZElkKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnRmFpbGVkIHRvIGRvd25sb2FkIHBhdGNoJywgZXJyKTtcclxuICAgIHV0aWwub3BuKG54bVVybCkuY2F0Y2goKCkgPT4gbnVsbCk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBydW5JbnN0YWxsZXI0R0JQYXRjaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG1vZElkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZCA9IHNlbGVjdG9ycy5nZXRNb2Qoc3RhdGUsIEdBTUVfSUQsIG1vZElkKTtcclxuICBpZiAoIW1vZD8uaW5zdGFsbGF0aW9uUGF0aCkge1xyXG4gICAgbG9nKCdlcnJvcicsIGBDb3VsZCBub3QgZmluZCBtb2QgJHttb2RJZH0gZm9yIDRHQiBwYXRjaCBpbnN0YWxsYXRpb25gKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgaWYgKCFkaXNjb3Zlcnk/LnBhdGgpIHtcclxuICAgIGxvZygnZXJyb3InLCAnQ291bGQgbm90IGZpbmQgZ2FtZSBwYXRoIGZvciA0R0IgcGF0Y2ggaW5zdGFsbGF0aW9uJyk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmdldE1vZEluc3RhbGxQYXRoKHN0YXRlLCBHQU1FX0lELCBtb2RJZCk7XHJcbiAgaWYgKCFpbnN0YWxsUGF0aCkge1xyXG4gICAgbG9nKCdlcnJvcicsICdDb3VsZCBub3QgZmluZCBpbnN0YWxsYXRpb24gcGF0aCBmb3IgNEdCIHBhdGNoIG1vZCcpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBmaWxlcyA9IGF3YWl0IGZzLnJlYWRkaXJBc3luYyhpbnN0YWxsUGF0aCk7XHJcbiAgY29uc3QgcGF0Y2hFeGVjID0gZmlsZXMuZmluZChmID0+IFBBVENIXzRHQl9FWEVDVVRBQkxFUy5pbmNsdWRlcyhmKSk7XHJcbiAgaWYgKCFwYXRjaEV4ZWMpIHtcclxuICAgIGxvZygnZXJyb3InLCAnQ291bGQgbm90IGZpbmQgNEdCIHBhdGNoIGV4ZWN1dGFibGUnKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgcGF0Y2hQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBwYXRjaEV4ZWMpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IGNwID0gc3Bhd24ocGF0Y2hQYXRoLCBbXSwge1xyXG4gICAgICAgIGN3ZDogZGlzY292ZXJ5LnBhdGgsXHJcbiAgICAgICAgc3RkaW86IFsncGlwZScsICdwaXBlJywgJ3BpcGUnXSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjcC5zdGRvdXQ/Lm9uKCdkYXRhJywgKGRhdGEpID0+IHtcclxuICAgICAgICBjb25zdCBsaW5lcyA9IGRhdGEudG9TdHJpbmcoKS5zcGxpdCgnXFxuJykubWFwKGwgPT4gbC50cmltKCkpLmZpbHRlcihsID0+IGwpO1xyXG4gICAgICAgIGNvbnN0IGxvZ0xpbmVzID0gbGluZXMubWFwKGwgPT4gYFs0R0IgUGF0Y2ggSW5zdGFsbGVyXSAke2x9YCk7XHJcbiAgICAgICAgbG9nKCdpbmZvJywgbG9nTGluZXMuam9pbignXFxuJykpO1xyXG4gICAgICAgIGlmIChsb2dMaW5lcy5tYXAobCA9PiBsLnRvTG93ZXJDYXNlKCkpLnNvbWUobCA9PiBsLmluY2x1ZGVzKCdhbnkga2V5JykpKSB7XHJcbiAgICAgICAgICBjcC5zdGRpbj8ud3JpdGUoJ1xcbicpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICBjcC5zdGRlcnI/Lm9uKCdkYXRhJywgKGRhdGEpID0+IHtcclxuICAgICAgICBsb2coJ3dhcm4nLCBgWzRHQiBQYXRjaCBJbnN0YWxsZXJdICR7ZGF0YS50b1N0cmluZygpfWApO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGNwLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xyXG4gICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY3Aub24oJ2Nsb3NlJywgKGNvZGUpID0+IHtcclxuICAgICAgICBpZiAoY29kZSA9PT0gMCkge1xyXG4gICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKGA0R0IgcGF0Y2ggaW5zdGFsbGVyIGV4aXRlZCB3aXRoIGNvZGUgJHtjb2RlfWApKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgICAgbWVzc2FnZTogJzRHQiBwYXRjaCBpbnN0YWxsZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgZGlzcGxheU1TOiAzMDAwLFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBydW4gNEdCIHBhdGNoIGluc3RhbGxlcicsIGVycik7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gaW5zdGFsbCA0R0IgcGF0Y2gnLFxyXG4gICAgICBkaXNwbGF5TVM6IDUwMDAsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHRlc3RGb3I0R0JQYXRjaChhcGkpOiBQcm9taXNlPHR5cGVzLklUZXN0UmVzdWx0PiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVHYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkPy5bR0FNRV9JRF07XHJcbiAgaWYgKGFjdGl2ZUdhbWVJZCAhPT0gR0FNRV9JRCB8fCAhZGlzY292ZXJ5Py5wYXRoKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZXhlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ0ZhbGxvdXROVi5leGUnKTtcclxuICBjb25zdCBoYXNCYWNrdXBGaWxlID0gKCkgPT4gZnMuc3RhdEFzeW5jKHBhdGguam9pbihwYXRoLmRpcm5hbWUoZXhlUGF0aCksIHBhdGguYmFzZW5hbWUoZXhlUGF0aCwgJy5leGUnKSArICdfYmFja3VwLmV4ZScpKVxyXG4gICAgLnRoZW4oKCkgPT4gdHJ1ZSlcclxuICAgIC5jYXRjaCgoKSA9PiBmYWxzZSk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGhhc0JhY2t1cCA9IGF3YWl0IGhhc0JhY2t1cEZpbGUoKTtcclxuICAgIGlmIChoYXNCYWNrdXApIHtcclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGRlc2NyaXB0aW9uOiB7XHJcbiAgICAgICAgc2hvcnQ6ICdGYWxsb3V0TlYuZXhlIHJlcXVpcmVzIDRHQiBwYXRjaCcsXHJcbiAgICAgICAgbG9uZzogJ0ZhbGxvdXQgTmV3IFZlZ2FzIHJlcXVpcmVzIHRoZSA0R0IgcGF0Y2ggdG8gd29yayBjb3JyZWN0bHkgd2l0aCBtYW55IG1vZHMuICcgK1xyXG4gICAgICAgICAgICAgICdUaGUgcGF0Y2ggYWxsb3dzIHRoZSBnYW1lIHRvIHVzZSBtb3JlIHRoYW4gMkdCIG9mIFJBTSwgcHJldmVudGluZyBjcmFzaGVzIGFuZCBpbXByb3Zpbmcgc3RhYmlsaXR5LicsXHJcbiAgICAgIH0sXHJcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXHJcbiAgICAgIG9uUmVjaGVjazogKCkgPT4gaGFzQmFja3VwRmlsZSgpIGFzIGFueSxcclxuICAgICAgYXV0b21hdGljRml4OiAoKSA9PiBkb3dubG9hZEFuZEluc3RhbGw0R0JQYXRjaChhcGkpIGFzIGFueSxcclxuICAgIH07XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBGaWxlIGRvZXNuJ3QgZXhpc3Qgb3IgY2FuJ3QgYmUgcmVhZCAtIG5vdCBhbiBlcnJvciBmb3IgdGhpcyB0ZXN0XHJcbiAgICBsb2coJ2RlYnVnJywgJ0NvdWxkIG5vdCBjaGVjayA0R0IgcGF0Y2ggc3RhdHVzJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGFwaSwgZGlzY292ZXJ5KSB7XHJcbiAgY29uc3QgZ2FtZU5hbWUgPSB1dGlsLmdldEdhbWUoR0FNRV9JRCk/Lm5hbWUgfHwgJ1RoaXMgZ2FtZSc7XHJcblxyXG4gIGlmIChkaXNjb3Zlcnkuc3RvcmUgJiYgWydlcGljJywgJ3hib3gnXS5pbmNsdWRlcyhkaXNjb3Zlcnkuc3RvcmUpKSB7XHJcbiAgICBjb25zdCBzdG9yZU5hbWUgPSBkaXNjb3Zlcnkuc3RvcmUgPT09ICdlcGljJyA/ICdFcGljIEdhbWVzJyA6ICdYYm94IEdhbWUgUGFzcyc7XHJcbiAgICBcclxuICAgIC8vIElmIHRoaXMgaXMgYW4gRXBpYyBvciBYYm94IGdhbWUgd2UndmUgZGVmYXVsdGVkIHRvIEVuZ2xpc2gsIHNvIHdlIHNob3VsZCBsZXQgdGhlIHVzZXIga25vdy5cclxuICAgIGlmKG11bHRpcGxlTGFuZ3VhZ2VzKSBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiBgJHtHQU1FX0lEfS1sb2NhbGUtbWVzc2FnZWAsXHJcbiAgICAgIHR5cGU6ICdpbmZvJyxcclxuICAgICAgdGl0bGU6ICdNdWx0aXBsZSBMYW5ndWFnZXMgQXZhaWxhYmxlJyxcclxuICAgICAgbWVzc2FnZTogYERlZmF1bHQ6ICR7c2VsZWN0ZWRMYW5ndWFnZX1gLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgICAgIGFjdGlvbjogKGRpc21pc3MpID0+IHtcclxuICAgICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdNdXRsaXBsZSBMYW5ndWFnZXMgQXZhaWxhYmxlJywge1xyXG4gICAgICAgICAgICAgIGJiY29kZTogJ3t7Z2FtZU5hbWV9fSBoYXMgbXVsdGlwbGUgbGFuZ3VhZ2Ugb3B0aW9ucyB3aGVuIGRvd25sb2FkZWQgZnJvbSB7e3N0b3JlTmFtZX19LiBbYnJdWy9icl1bYnJdWy9icl0nK1xyXG4gICAgICAgICAgICAgICAgJ1ZvcnRleCBoYXMgc2VsZWN0ZWQgdGhlIHt7c2VsZWN0ZWRMYW5ndWFnZX19IHZhcmlhbnQgYnkgZGVmYXVsdC4gW2JyXVsvYnJdW2JyXVsvYnJdJytcclxuICAgICAgICAgICAgICAgICdJZiB5b3Ugd291bGQgcHJlZmVyIHRvIG1hbmFnZSBhIGRpZmZlcmVudCBsYW5ndWFnZSB5b3UgY2FuIGNoYW5nZSB0aGUgcGF0aCB0byB0aGUgZ2FtZSB1c2luZyB0aGUgXCJNYW51YWxseSBTZXQgTG9jYXRpb25cIiBvcHRpb24gaW4gdGhlIGdhbWVzIHRhYi4nLFxyXG4gICAgICAgICAgICAgIHBhcmFtZXRlcnM6IHsgZ2FtZU5hbWUsIHN0b3JlTmFtZSwgc2VsZWN0ZWRMYW5ndWFnZSB9XHJcbiAgICAgICAgICAgIH0sIFxyXG4gICAgICAgICAgICBbIFxyXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4gYXBpLnN1cHByZXNzTm90aWZpY2F0aW9uKGAke0dBTUVfSUR9LWxvY2FsZS1tZXNzYWdlYCkgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICBdXHJcbiAgICB9KTtcclxuICB9XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZXF1aXJlc0xhdW5jaGVyKGdhbWVQYXRoLCBzdG9yZSkge1xyXG4gIGNvbnN0IHhib3hTZXR0aW5ncyA9IHtcclxuICAgIGxhdW5jaGVyOiAneGJveCcsXHJcbiAgICBhZGRJbmZvOiB7XHJcbiAgICAgIGFwcElkOiBNU19JRCxcclxuICAgICAgcGFyYW1ldGVyczogW1xyXG4gICAgICAgIHsgYXBwRXhlY05hbWU6ICdHYW1lJyB9LFxyXG4gICAgICBdLFxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGVwaWNTZXR0aW5ncyA9IHtcclxuICAgIGxhdW5jaGVyOiAnZXBpYycsXHJcbiAgICBhZGRJbmZvOiB7XHJcbiAgICAgIGFwcElkOiBFUElDX0lELFxyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGlmIChzdG9yZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBpZiAoc3RvcmUgPT09ICd4Ym94JykgcmV0dXJuIHhib3hTZXR0aW5ncztcclxuICAgIGlmIChzdG9yZSA9PT0gJ2VwaWMnKSByZXR1cm4gZXBpY1NldHRpbmdzO1xyXG4gICAgZWxzZSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgLy8gU3RvcmUgdHlwZSBpc24ndCBkZXRlY3RlZC4gVHJ5IGFuZCBtYXRjaCB0aGUgWGJveCBwYXRoLiBcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGdhbWUgPSBhd2FpdCB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbTVNfSURdLCAneGJveCcpO1xyXG4gICAgY29uc3Qgbm9ybWFsaXplRnVuYyA9IGF3YWl0IHV0aWwuZ2V0Tm9ybWFsaXplRnVuYyhnYW1lUGF0aCk7XHJcbiAgICBpZiAobm9ybWFsaXplRnVuYyhnYW1lLmdhbWVQYXRoKSA9PT0gbm9ybWFsaXplRnVuYyhnYW1lUGF0aCkpIHJldHVybiB4Ym94U2V0dGluZ3M7XHJcbiAgICBlbHNlIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIGNhdGNoKGVycikge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RJbnN0YWxsZXI0R0JQYXRjaChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICByZXR1cm4gKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcsIGFyY2hpdmVQYXRoPzogc3RyaW5nLCBkZXRhaWxzPzogdHlwZXMuSVRlc3RTdXBwb3J0ZWREZXRhaWxzKTogUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZU1vZGUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIGlmIChnYW1lTW9kZSAhPT0gR0FNRV9JRCB8fCBkZXRhaWxzPy5oYXNYbWxDb25maWdYTUwgfHwgZGV0YWlscz8uaGFzQ1NTY3JpcHRzKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxuICAgIH1cclxuICAgIGNvbnN0IGxvd2VyZWQgPSBmaWxlcy5tYXAoZiA9PiBmLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgY29uc3QgaGFzUGF0Y2hFeGUgPSBQQVRDSF80R0JfRVhFQ1VUQUJMRVMuc29tZShleGVjTmFtZSA9PiBsb3dlcmVkLmluY2x1ZGVzKGV4ZWNOYW1lLnRvTG93ZXJDYXNlKCkpKTtcclxuICAgIGlmIChoYXNQYXRjaEV4ZSkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiB0cnVlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFwcGx5SW5zdGFsbGVyNEdCUGF0Y2goYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgcmV0dXJuIGFzeW5jIChmaWxlczogc3RyaW5nW10sIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLCBnYW1lSWQ6IHN0cmluZyxcclxuICAgICAgcHJvZ3Jlc3NEZWxlZ2F0ZTogdHlwZXMuUHJvZ3Jlc3NEZWxlZ2F0ZSwgY2hvaWNlcz86IGFueSxcclxuICAgICAgdW5hdHRlbmRlZD86IGJvb2xlYW4sIGFyY2hpdmVQYXRoPzogc3RyaW5nLCBvcHRpb25zPzogdHlwZXMuSUluc3RhbGxhdGlvbkRldGFpbHMpIDogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4gPT4ge1xyXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbGVzLm1hcChmID0+ICh7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBmLFxyXG4gICAgICBkZXN0aW5hdGlvbjogZixcclxuICAgIH0pKTtcclxuICAgIGNvbnN0IGF0dHJpYjogdHlwZXMuSUluc3RydWN0aW9uID0ge1xyXG4gICAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgICAga2V5OiAnaXM0R0JQYXRjaGVyJyxcclxuICAgICAgdmFsdWU6IHRydWUsXHJcbiAgICB9O1xyXG4gICAgY29uc3QgbW9kVHlwZUluc3RyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7XHJcbiAgICAgIHR5cGU6ICdzZXRtb2R0eXBlJyxcclxuICAgICAgdmFsdWU6ICdkaW5wdXQnLFxyXG4gICAgfTtcclxuICAgIGluc3RydWN0aW9ucy5wdXNoKG1vZFR5cGVJbnN0cik7XHJcbiAgICByZXR1cm4geyBpbnN0cnVjdGlvbnM6IFsuLi5pbnN0cnVjdGlvbnMsIGF0dHJpYiwgbW9kVHlwZUluc3RyIF0gfTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpOiBib29sZWFuIHtcclxuICBjb250ZXh0LnJlcXVpcmVFeHRlbnNpb24oJ0ZhbGxvdXQgTmV3IFZlZ2FzIFNhbml0eSBDaGVja3MnLCB1bmRlZmluZWQsIHRydWUpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdGYWxsb3V0OlxcdE5ldyBWZWdhcycsXHJcbiAgICBzZXR1cDogKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dC5hcGksIGRpc2NvdmVyeSkgYXMgYW55LFxyXG4gICAgc2hvcnROYW1lOiAnTmV3IFZlZ2FzJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUgYXMgYW55LFxyXG4gICAgcmVxdWlyZXNMYXVuY2hlcjogcmVxdWlyZXNMYXVuY2hlciBhcyBhbnksXHJcbiAgICBzdXBwb3J0ZWRUb29sczogdG9vbHMsXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdEYXRhJyxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnRmFsbG91dE5WLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdGYWxsb3V0TlYuZXhlJyxcclxuICAgIF0sXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiAnMjIzODAnLFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogMjIzODAsXHJcbiAgICAgIG5leHVzUGFnZUlkOiBORVhVU19ET01BSU5fTkFNRSxcclxuICAgICAgaGFzaEZpbGVzOiBbXHJcbiAgICAgICAgJ0RhdGEvVXBkYXRlLmJzYScsXHJcbiAgICAgICAgJ0RhdGEvRmFsbG91dE5WLmVzbScsXHJcbiAgICAgIF0sXHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIC8vIFRlc3RzL0hlYWx0aCBjaGVja3NcclxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnZmFsbG91dG52LTRnYi1wYXRjaCcsICdnYW1lbW9kZS1hY3RpdmF0ZWQnLFxyXG4gICAgKCkgPT4gdGVzdEZvcjRHQlBhdGNoKGNvbnRleHQuYXBpKSBhcyBhbnkpO1xyXG5cclxuICAvLyBJbnN0YWxsZXJzXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcihcclxuICAgICdmYWxsb3V0bnYtNGdiLXBhdGNoJywgMjUsXHJcbiAgICB0ZXN0SW5zdGFsbGVyNEdCUGF0Y2goY29udGV4dC5hcGkpIGFzIGFueSxcclxuICAgIGFwcGx5SW5zdGFsbGVyNEdCUGF0Y2goY29udGV4dC5hcGkpIGFzIGFueVxyXG4gICk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=