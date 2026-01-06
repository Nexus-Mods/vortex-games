"use strict";
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
const PATCH_4GB_EXECUTABLES = ['FNVpatch.exe', 'FalloutNVpatch.exe', 'Patcher.exe'];
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
        return Promise.resolve({ supported: hasPatchExe, requiredFiles: [] });
    };
}
function applyInstaller4GBPatch(api) {
    return (files, destinationPath, gameId, progressDelegate, choices, unattended, archivePath, details) => __awaiter(this, void 0, void 0, function* () {
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
    context.registerInstaller('falloutnv-4gb-patch', 25, testInstaller4GBPatch(context.api), applyInstaller4GBPatch(context.api));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBc0U7QUFRdEUsTUFBTSxpQkFBaUIsR0FBRztJQUN4QixFQUFFLEVBQUUsMkJBQTJCO0lBQy9CLEVBQUUsRUFBRSwwQkFBMEI7SUFDOUIsRUFBRSxFQUFFLDBCQUEwQjtJQUM5QixFQUFFLEVBQUUsMkJBQTJCO0lBQy9CLEVBQUUsRUFBRSwyQkFBMkI7Q0FDaEMsQ0FBQTtBQUVELE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQztBQUM1QixNQUFNLGlCQUFpQixHQUFHLFVBQVUsQ0FBQztBQUNyQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7QUFDNUIsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDO0FBQzdCLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQztBQUM1QixNQUFNLEtBQUssR0FBRyxtQ0FBbUMsQ0FBQztBQUNsRCxNQUFNLE9BQU8sR0FBRyxrQ0FBa0MsQ0FBQztBQUVuRCxNQUFNLHFCQUFxQixHQUFHLENBQUMsY0FBYyxFQUFFLG9CQUFvQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBRXBGLElBQUksZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO0FBQ2pDLElBQUksaUJBQWlCLEdBQUcsS0FBSyxDQUFDO0FBRTlCLE1BQU0sWUFBWSxHQUFtRDtJQUNuRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLHNCQUFzQixFQUFFLENBQUM7SUFDL0YsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDckIsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUM7SUFDckIsSUFB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O1NBQ2hCO1FBQ0QsV0FBVyxFQUFFO1lBQ1gsVUFBVSxFQUFFLE9BQU87U0FDcEI7UUFDRCxPQUFPLEVBQUU7WUFDUCxVQUFVLEVBQUUsS0FBSztZQUNqQixXQUFXLEVBQUUsaUJBQWlCO1lBQzlCLFNBQVMsRUFBRTtnQkFDVCxpQkFBaUI7Z0JBQ2pCLG9CQUFvQjthQUNyQjtTQUNGO0tBQ0YsQ0FBQyxDQUFDO0lBR0gsT0FBTyxDQUFDLGlCQUFpQixDQUN2QixxQkFBcUIsRUFBRSxFQUFFLEVBQ3pCLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQVEsRUFDekMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBUSxDQUMzQyxDQUFDO0lBRUYsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElGaWxlSW5mbyB9IGZyb20gJ0BuZXh1c21vZHMvbmV4dXMtYXBpJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHR5cGVzLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0ICogYXMgbm9kZUZzIGZyb20gJ2ZzJztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcblxyXG4vLyBMaXN0IG9mIGZvbGRlcnMgaW4gdGhlIHZhcmlvdXMgbGFuZ3VhZ2VzIG9uIFhib3gsIGZvciBub3cgd2UgZGVmYXVsdCB0byBFbmdsaXNoIGJ1dCB0aGlzIGNvdWxkIGJlIGVuaGFuY2VkIHRvIHNlbGVjdCBhIGZvbGRlciBiYXNlZCBvbiB0aGUgVm9ydGV4IGxvY2FsZS5cclxuLy8gSXQncyBwb3NzaWJsZSB0aGF0IHNvbWUgbW9kcyBkb24ndCB3b3JrIHdpdGggdGhlIG5vbi1FbmdsaXNoIHZhcmlhbnQuIFxyXG4vLyBTdHJ1Y3R1cmUgaXMge0dBTUUgRk9MREVSfVxcQ29udGVudFxce0xBTkdVQUdFIEZPTERFUn1cclxuY29uc3QgbG9jYWxlRm9sZGVyc1hib3ggPSB7XHJcbiAgZW46ICdGYWxsb3V0IE5ldyBWZWdhcyBFbmdsaXNoJyxcclxuICBmcjogJ0ZhbGxvdXQgTmV3IFZlZ2FzIEZyZW5jaCcsXHJcbiAgZGU6ICdGYWxsb3V0IE5ldyBWZWdhcyBHZXJtYW4nLFxyXG4gIGl0OiAnRmFsbG91dCBOZXcgVmVnYXMgSXRhbGlhbicsXHJcbiAgZXM6ICdGYWxsb3V0IE5ldyBWZWdhcyBTcGFuaXNoJyxcclxufVxyXG5cclxuY29uc3QgR0FNRV9JRCA9ICdmYWxsb3V0bnYnO1xyXG5jb25zdCBORVhVU19ET01BSU5fTkFNRSA9ICduZXd2ZWdhcyc7XHJcbmNvbnN0IFNURUFNQVBQX0lEID0gJzIyMzgwJztcclxuY29uc3QgU1RFQU1BUFBfSUQyID0gJzIyNDkwJztcclxuY29uc3QgR09HX0lEID0gJzE0NTQ1ODc0MjgnO1xyXG5jb25zdCBNU19JRCA9ICdCZXRoZXNkYVNvZnR3b3Jrcy5GYWxsb3V0TmV3VmVnYXMnO1xyXG5jb25zdCBFUElDX0lEID0gJzVkYWViOTc0YTIyYTQzNTk4ODg5MjMxOWIzYTRmNDc2JztcclxuXHJcbmNvbnN0IFBBVENIXzRHQl9FWEVDVVRBQkxFUyA9IFsnRk5WcGF0Y2guZXhlJywgJ0ZhbGxvdXROVnBhdGNoLmV4ZScsICdQYXRjaGVyLmV4ZSddO1xyXG5cclxubGV0IHNlbGVjdGVkTGFuZ3VhZ2UgPSB1bmRlZmluZWQ7XHJcbmxldCBtdWx0aXBsZUxhbmd1YWdlcyA9IGZhbHNlO1xyXG5cclxuY29uc3QgZ2FtZVN0b3JlSWRzOiB7IFtnYW1lU3RvcmVJZDogc3RyaW5nXTogdHlwZXMuSVN0b3JlUXVlcnlbXSB9ID0ge1xyXG4gIHN0ZWFtOiBbeyBpZDogU1RFQU1BUFBfSUQsIHByZWZlcjogMCB9LCB7IGlkOiBTVEVBTUFQUF9JRDIgfSwgeyBuYW1lOiAnRmFsbG91dDogTmV3IFZlZ2FzLionIH1dLFxyXG4gIHhib3g6IFt7IGlkOiBNU19JRCB9XSxcclxuICBnb2c6IFt7IGlkOiBHT0dfSUQgfV0sXHJcbiAgZXBpYzogW3sgaWQ6IEVQSUNfSUQgfV0sXHJcbiAgcmVnaXN0cnk6IFt7IGlkOiAnSEtFWV9MT0NBTF9NQUNISU5FOlNvZnR3YXJlXFxcXFdvdzY0MzJOb2RlXFxcXEJldGhlc2RhIFNvZnR3b3Jrc1xcXFxmYWxsb3V0bnY6SW5zdGFsbGVkIFBhdGgnIH1dLFxyXG59O1xyXG5cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZpbmRHYW1lKCkge1xyXG4gIGNvbnN0IHN0b3JlR2FtZXMgPSBhd2FpdCB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kKGdhbWVTdG9yZUlkcykuY2F0Y2goKCkgPT4gW10pO1xyXG5cclxuICBpZiAoIXN0b3JlR2FtZXMubGVuZ3RoKSByZXR1cm47XHJcbiAgXHJcbiAgaWYgKHN0b3JlR2FtZXMubGVuZ3RoID4gMSkgbG9nKCdkZWJ1ZycsICdNdXRsaXBsZSBjb3BpZXMgb2YgTmV3IFZlZ2FzIGZvdW5kJywgc3RvcmVHYW1lcy5tYXAocyA9PiBzLmdhbWVTdG9yZUlkKSk7XHJcblxyXG4gIGNvbnN0IHNlbGVjdGVkR2FtZSA9IHN0b3JlR2FtZXNbMF07XHJcbiAgaWYgKFsnZXBpYycsICd4Ym94J10uaW5jbHVkZXMoc2VsZWN0ZWRHYW1lLmdhbWVTdG9yZUlkKSkge1xyXG4gICAgLy8gR2V0IGEgbGlzdCBvZiBmb2xkZXJzIGluIHRoZSBpbnN0YWxsYXRpb24uXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBmb2xkZXJzOiBzdHJpbmdbXSA9IGF3YWl0IGZzLnJlYWRkaXJBc3luYyhzZWxlY3RlZEdhbWUuZ2FtZVBhdGgpLmZpbHRlcihwID0+ICFwYXRoLmV4dG5hbWUocCkgJiYgIXAuc3RhcnRzV2l0aCgnLicpKTtcclxuICAgICAgY29uc3QgYXZhaWxhYmxlTG9jYWxlcyA9IE9iamVjdC5rZXlzKGxvY2FsZUZvbGRlcnNYYm94KS5yZWR1Y2UoKGFjY3VtLCBjdXIpID0+IHtcclxuICAgICAgICBjb25zdCBsb2NhbGVGb2xkZXJOYW1lID0gbG9jYWxlRm9sZGVyc1hib3hbY3VyXTtcclxuICAgICAgICBpZiAoZm9sZGVycy5pbmNsdWRlcyhsb2NhbGVGb2xkZXJOYW1lKSkgYWNjdW0ucHVzaChjdXIpO1xyXG4gICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgfSwgW10pO1xyXG4gICAgICBpZiAoIWF2YWlsYWJsZUxvY2FsZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgbG9nKCd3YXJuJywgJ0NvdWxkIG5vdCBmaW5kIGFueSByZWNvZ25pc2VkIGxvY2FsZSBmb2xkZXJzIGZvciBOZXcgVmVnYXMnLCB7Zm9sZGVycywgcGF0aDogc2VsZWN0ZWRHYW1lLmdhbWVQYXRofSk7XHJcbiAgICAgICAgc2VsZWN0ZWRHYW1lLmdhbWVQYXRoID0gcGF0aC5qb2luKHNlbGVjdGVkR2FtZS5nYW1lUGF0aCwgZm9sZGVyc1swXSk7XHJcbiAgICAgICAgLy8gR2V0IHRoZSBsYXN0IHdvcmQgb2YgdGhlIGZvbGRlciBuYW1lIHRvIHNob3cgYXMgYSBsYW5ndWFnZVxyXG4gICAgICAgIHNlbGVjdGVkTGFuZ3VhZ2UgPSBmb2xkZXJzWzBdLnRvVXBwZXJDYXNlKCkucmVwbGFjZSgnRmFsbG91dCBOZXcgVmVnYXMnLCAnJykudHJpbSgpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIE9ubHkgb25lIGxhbmd1YWdlP1xyXG4gICAgICBlbHNlIGlmIChhdmFpbGFibGVMb2NhbGVzLmxlbmd0aCA9PT0gMSkgc2VsZWN0ZWRHYW1lLmdhbWVQYXRoID0gcGF0aC5qb2luKHNlbGVjdGVkR2FtZS5nYW1lUGF0aCwgbG9jYWxlRm9sZGVyc1hib3hbYXZhaWxhYmxlTG9jYWxlc1swXV0pO1xyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAvLyBHZXQgdGhlIHVzZXIncyBjaG9zZW4gbGFuZ3VhZ2VcclxuICAgICAgICAvLyBzdGF0ZS5pbnRlcmZhY2UubGFuZ3VhZ2UgfHwgJ2VuJzsgXHJcbiAgICAgICAgLy8gTXVsdGlwbGU/XHJcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRMb2NhbGUgPSBhdmFpbGFibGVMb2NhbGVzLmluY2x1ZGVzKCdlbicpID8gJ2VuJyA6IGF2YWlsYWJsZUxvY2FsZXNbMF07XHJcbiAgICAgICAgc2VsZWN0ZWRMYW5ndWFnZSA9IHNlbGVjdGVkTG9jYWxlLnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgbXVsdGlwbGVMYW5ndWFnZXMgPSB0cnVlO1xyXG4gICAgICAgIGxvZygnZGVidWcnLCBgRGVmYXVsdGluZyB0byB0aGUgJHtzZWxlY3RlZExvY2FsZX0gZ2FtZSB2ZXJzaW9uYCwgeyBzdG9yZTogc2VsZWN0ZWRHYW1lLmdhbWVTdG9yZUlkLCBmb2xkZXI6IGxvY2FsZUZvbGRlcnNYYm94W3NlbGVjdGVkTG9jYWxlXSB9KTtcclxuICAgICAgICBzZWxlY3RlZEdhbWUuZ2FtZVBhdGggPSBwYXRoLmpvaW4oc2VsZWN0ZWRHYW1lLmdhbWVQYXRoLCBsb2NhbGVGb2xkZXJzWGJveFtzZWxlY3RlZExvY2FsZV0pO1xyXG4gICAgICB9ICAgICAgXHJcbiAgICB9XHJcbiAgICBjYXRjaChlcnIpIHtcclxuICAgICAgbG9nKCd3YXJuJywgJ0NvdWxkIG5vdCBjaGVjayBmb3IgRmFsbG91dCBOViBsb2NhbGUgcGF0aHMnLCBlcnIpO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gc2VsZWN0ZWRHYW1lO1xyXG59XHJcblxyXG5jb25zdCB0b29scyA9IFtcclxuICB7XHJcbiAgICBpZDogJ0ZOVkVkaXQnLFxyXG4gICAgbmFtZTogJ0ZOVkVkaXQnLFxyXG4gICAgbG9nbzogJ2ZvM2VkaXQucG5nJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdGTlZFZGl0LmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdGTlZFZGl0LmV4ZScsXHJcbiAgICBdLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgaWQ6ICdXcnllQmFzaCcsXHJcbiAgICBuYW1lOiAnV3J5ZSBCYXNoJyxcclxuICAgIGxvZ286ICd3cnllLnBuZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnV3J5ZSBCYXNoLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdXcnllIEJhc2guZXhlJyxcclxuICAgIF0sXHJcbiAgfSxcclxuICB7XHJcbiAgICBpZDogJ252c2UnLFxyXG4gICAgbmFtZTogJ05ldyBWZWdhcyBTY3JpcHQgRXh0ZW5kZXInLFxyXG4gICAgbG9nbzogJ252c2UucG5nJyxcclxuICAgIHNob3J0TmFtZTogJ05WU0UnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ252c2VfbG9hZGVyLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdudnNlX2xvYWRlci5leGUnLFxyXG4gICAgICAnRmFsbG91dE5WLmV4ZScsXHJcbiAgICBdLFxyXG4gICAgcmVsYXRpdmU6IHRydWUsXHJcbiAgICBleGNsdXNpdmU6IHRydWUsXHJcbiAgICBkZWZhdWx0UHJpbWFyeTogdHJ1ZSxcclxuICB9XHJcbl07XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhhcGksIGRpc2NvdmVyeSkge1xyXG4gIGNvbnN0IGdhbWVOYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpPy5uYW1lIHx8ICdUaGlzIGdhbWUnO1xyXG5cclxuICBpZiAoZGlzY292ZXJ5LnN0b3JlICYmIFsnZXBpYycsICd4Ym94J10uaW5jbHVkZXMoZGlzY292ZXJ5LnN0b3JlKSkge1xyXG4gICAgY29uc3Qgc3RvcmVOYW1lID0gZGlzY292ZXJ5LnN0b3JlID09PSAnZXBpYycgPyAnRXBpYyBHYW1lcycgOiAnWGJveCBHYW1lIFBhc3MnO1xyXG4gICAgXHJcbiAgICAvLyBJZiB0aGlzIGlzIGFuIEVwaWMgb3IgWGJveCBnYW1lIHdlJ3ZlIGRlZmF1bHRlZCB0byBFbmdsaXNoLCBzbyB3ZSBzaG91bGQgbGV0IHRoZSB1c2VyIGtub3cuXHJcbiAgICBpZihtdWx0aXBsZUxhbmd1YWdlcykgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogYCR7R0FNRV9JRH0tbG9jYWxlLW1lc3NhZ2VgLFxyXG4gICAgICB0eXBlOiAnaW5mbycsXHJcbiAgICAgIHRpdGxlOiAnTXVsdGlwbGUgTGFuZ3VhZ2VzIEF2YWlsYWJsZScsXHJcbiAgICAgIG1lc3NhZ2U6IGBEZWZhdWx0OiAke3NlbGVjdGVkTGFuZ3VhZ2V9YCxcclxuICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgICBhY3Rpb246IChkaXNtaXNzKSA9PiB7XHJcbiAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnTXV0bGlwbGUgTGFuZ3VhZ2VzIEF2YWlsYWJsZScsIHtcclxuICAgICAgICAgICAgICBiYmNvZGU6ICd7e2dhbWVOYW1lfX0gaGFzIG11bHRpcGxlIGxhbmd1YWdlIG9wdGlvbnMgd2hlbiBkb3dubG9hZGVkIGZyb20ge3tzdG9yZU5hbWV9fS4gW2JyXVsvYnJdW2JyXVsvYnJdJytcclxuICAgICAgICAgICAgICAgICdWb3J0ZXggaGFzIHNlbGVjdGVkIHRoZSB7e3NlbGVjdGVkTGFuZ3VhZ2V9fSB2YXJpYW50IGJ5IGRlZmF1bHQuIFticl1bL2JyXVticl1bL2JyXScrXHJcbiAgICAgICAgICAgICAgICAnSWYgeW91IHdvdWxkIHByZWZlciB0byBtYW5hZ2UgYSBkaWZmZXJlbnQgbGFuZ3VhZ2UgeW91IGNhbiBjaGFuZ2UgdGhlIHBhdGggdG8gdGhlIGdhbWUgdXNpbmcgdGhlIFwiTWFudWFsbHkgU2V0IExvY2F0aW9uXCIgb3B0aW9uIGluIHRoZSBnYW1lcyB0YWIuJyxcclxuICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7IGdhbWVOYW1lLCBzdG9yZU5hbWUsIHNlbGVjdGVkTGFuZ3VhZ2UgfVxyXG4gICAgICAgICAgICB9LCBcclxuICAgICAgICAgICAgWyBcclxuICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IGFwaS5zdXBwcmVzc05vdGlmaWNhdGlvbihgJHtHQU1FX0lEfS1sb2NhbGUtbWVzc2FnZWApIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgXVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVxdWlyZXNMYXVuY2hlcihnYW1lUGF0aCwgc3RvcmUpIHtcclxuICBjb25zdCB4Ym94U2V0dGluZ3MgPSB7XHJcbiAgICBsYXVuY2hlcjogJ3hib3gnLFxyXG4gICAgYWRkSW5mbzoge1xyXG4gICAgICBhcHBJZDogTVNfSUQsXHJcbiAgICAgIHBhcmFtZXRlcnM6IFtcclxuICAgICAgICB7IGFwcEV4ZWNOYW1lOiAnR2FtZScgfSxcclxuICAgICAgXSxcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBlcGljU2V0dGluZ3MgPSB7XHJcbiAgICBsYXVuY2hlcjogJ2VwaWMnLFxyXG4gICAgYWRkSW5mbzoge1xyXG4gICAgICBhcHBJZDogRVBJQ19JRCxcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBpZiAoc3RvcmUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgaWYgKHN0b3JlID09PSAneGJveCcpIHJldHVybiB4Ym94U2V0dGluZ3M7XHJcbiAgICBpZiAoc3RvcmUgPT09ICdlcGljJykgcmV0dXJuIGVwaWNTZXR0aW5ncztcclxuICAgIGVsc2UgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIC8vIFN0b3JlIHR5cGUgaXNuJ3QgZGV0ZWN0ZWQuIFRyeSBhbmQgbWF0Y2ggdGhlIFhib3ggcGF0aC4gXHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBnYW1lID0gYXdhaXQgdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW01TX0lEXSwgJ3hib3gnKTtcclxuICAgIGNvbnN0IG5vcm1hbGl6ZUZ1bmMgPSBhd2FpdCB1dGlsLmdldE5vcm1hbGl6ZUZ1bmMoZ2FtZVBhdGgpO1xyXG4gICAgaWYgKG5vcm1hbGl6ZUZ1bmMoZ2FtZS5nYW1lUGF0aCkgPT09IG5vcm1hbGl6ZUZ1bmMoZ2FtZVBhdGgpKSByZXR1cm4geGJveFNldHRpbmdzO1xyXG4gICAgZWxzZSByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuICBjYXRjaChlcnIpIHtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0SW5zdGFsbGVyNEdCUGF0Y2goYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgcmV0dXJuIChmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nLCBhcmNoaXZlUGF0aD86IHN0cmluZywgZGV0YWlscz86IHR5cGVzLklUZXN0U3VwcG9ydGVkRGV0YWlscyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4gPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQgfHwgZGV0YWlscz8uaGFzWG1sQ29uZmlnWE1MIHx8IGRldGFpbHM/Lmhhc0NTU2NyaXB0cykge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBsb3dlcmVkID0gZmlsZXMubWFwKGYgPT4gZi50b0xvd2VyQ2FzZSgpKTtcclxuICAgIGNvbnN0IGhhc1BhdGNoRXhlID0gUEFUQ0hfNEdCX0VYRUNVVEFCTEVTLnNvbWUoZXhlY05hbWUgPT4gbG93ZXJlZC5pbmNsdWRlcyhleGVjTmFtZS50b0xvd2VyQ2FzZSgpKSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiBoYXNQYXRjaEV4ZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBhcHBseUluc3RhbGxlcjRHQlBhdGNoKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIHJldHVybiBhc3luYyAoZmlsZXM6IHN0cmluZ1tdLCBkZXN0aW5hdGlvblBhdGg6IHN0cmluZywgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICAgIHByb2dyZXNzRGVsZWdhdGU6IHR5cGVzLlByb2dyZXNzRGVsZWdhdGUsIGNob2ljZXM/OiBhbnksXHJcbiAgICAgIHVuYXR0ZW5kZWQ/OiBib29sZWFuLCBhcmNoaXZlUGF0aD86IHN0cmluZywgZGV0YWlscz86IHR5cGVzLklJbnN0YWxsYXRpb25EZXRhaWxzKSA6IFByb21pc2U8dHlwZXMuSUluc3RhbGxSZXN1bHQ+ID0+IHtcclxuICAgIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWxlcy5tYXAoZiA9PiAoe1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZixcclxuICAgICAgZGVzdGluYXRpb246IGYsXHJcbiAgICB9KSk7XHJcbiAgICBjb25zdCBhdHRyaWI6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHtcclxuICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICAgIGtleTogJ2lzNEdCUGF0Y2hlcicsXHJcbiAgICAgIHZhbHVlOiB0cnVlLFxyXG4gICAgfTtcclxuICAgIGNvbnN0IG1vZFR5cGVJbnN0cjogdHlwZXMuSUluc3RydWN0aW9uID0ge1xyXG4gICAgICB0eXBlOiAnc2V0bW9kdHlwZScsXHJcbiAgICAgIHZhbHVlOiAnZGlucHV0JyxcclxuICAgIH07XHJcbiAgICBpbnN0cnVjdGlvbnMucHVzaChtb2RUeXBlSW5zdHIpO1xyXG4gICAgcmV0dXJuIHsgaW5zdHJ1Y3Rpb25zOiBbIC4uLmluc3RydWN0aW9ucywgYXR0cmliLCBtb2RUeXBlSW5zdHIgXSB9O1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCk6IGJvb2xlYW4ge1xyXG4gIGNvbnRleHQucmVxdWlyZUV4dGVuc2lvbignRmFsbG91dCBOZXcgVmVnYXMgU2FuaXR5IENoZWNrcycsIHVuZGVmaW5lZCwgdHJ1ZSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ0ZhbGxvdXQ6XFx0TmV3IFZlZ2FzJyxcclxuICAgIHNldHVwOiAoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LmFwaSwgZGlzY292ZXJ5KSBhcyBhbnksXHJcbiAgICBzaG9ydE5hbWU6ICdOZXcgVmVnYXMnLFxyXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSBhcyBhbnksXHJcbiAgICByZXF1aXJlc0xhdW5jaGVyOiByZXF1aXJlc0xhdW5jaGVyIGFzIGFueSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiB0b29scyxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ0RhdGEnLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdGYWxsb3V0TlYuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ0ZhbGxvdXROVi5leGUnLFxyXG4gICAgXSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6ICcyMjM4MCcsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiAyMjM4MCxcclxuICAgICAgbmV4dXNQYWdlSWQ6IE5FWFVTX0RPTUFJTl9OQU1FLFxyXG4gICAgICBoYXNoRmlsZXM6IFtcclxuICAgICAgICAnRGF0YS9VcGRhdGUuYnNhJyxcclxuICAgICAgICAnRGF0YS9GYWxsb3V0TlYuZXNtJyxcclxuICAgICAgXSxcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgLy8gSW5zdGFsbGVyc1xyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoXHJcbiAgICAnZmFsbG91dG52LTRnYi1wYXRjaCcsIDI1LFxyXG4gICAgdGVzdEluc3RhbGxlcjRHQlBhdGNoKGNvbnRleHQuYXBpKSBhcyBhbnksXHJcbiAgICBhcHBseUluc3RhbGxlcjRHQlBhdGNoKGNvbnRleHQuYXBpKSBhcyBhbnlcclxuICApO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19