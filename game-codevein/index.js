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
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const loadOrder_1 = require("./loadOrder");
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const STEAM_ID = '678960';
function findGame() {
    return __awaiter(this, void 0, void 0, function* () {
        return vortex_api_1.util.GameStoreHelper.findByAppId([STEAM_ID])
            .then(game => game.gamePath);
    });
}
function externalFilesWarning(api, externalMods) {
    return __awaiter(this, void 0, void 0, function* () {
        const t = api.translate;
        if (externalMods.length === 0) {
            return Promise.resolve(undefined);
        }
        return new Promise((resolve, reject) => {
            api.showDialog('info', 'External Mod Files Detected', {
                bbcode: t('Vortex has discovered the following unmanaged/external files in the '
                    + 'the game\'s mods directory:[br][/br][br][/br]{{files}}'
                    + '[br][/br]Please note that the existence of these mods interferes with Vortex\'s '
                    + 'load ordering functionality and as such, they should be removed using the same '
                    + 'medium through which they have been added.[br][/br][br][/br]'
                    + 'Alternatively, Vortex can try to import these files into its mods list which will '
                    + 'allow Vortex to take control over them and display them inside the load ordering page. '
                    + 'Vortex\'s load ordering functionality will not display external mod entries unless imported!', { replace: { files: externalMods.map(mod => `"${mod}"`).join('[br][/br]') } }),
            }, [
                { label: 'Close', action: () => reject(new vortex_api_1.util.UserCanceled()) },
                { label: 'Import External Mods', action: () => resolve(undefined) },
            ]);
        });
    });
}
function ImportExternalMods(api, external) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const downloadsPath = vortex_api_1.selectors.downloadPathForGame(state, common_1.GAME_ID);
        const szip = new vortex_api_1.util.SevenZip();
        for (const modFile of external) {
            const archivePath = path_1.default.join(downloadsPath, path_1.default.basename(modFile, common_1.MOD_FILE_EXT) + '.zip');
            try {
                yield szip.add(archivePath, [modFile], { raw: ['-r'] });
                yield vortex_api_1.fs.removeAsync(modFile);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    });
}
function prepareForModding(context, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.getState();
        const modsPath = path_1.default.join(discovery.path, (0, common_1.modsRelPath)());
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(modsPath);
            const installPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const managedFiles = yield (0, util_1.getPakFiles)(installPath);
            const deployedFiles = yield (0, util_1.getPakFiles)(modsPath);
            const modifier = (filePath) => path_1.default.basename(filePath).toLowerCase();
            const unManagedPredicate = (filePath) => managedFiles.find(managed => modifier(managed) === modifier(filePath)) === undefined;
            const externalMods = deployedFiles.filter(unManagedPredicate);
            try {
                yield externalFilesWarning(context.api, externalMods);
                yield ImportExternalMods(context.api, externalMods);
            }
            catch (err) {
                if (err instanceof vortex_api_1.util.UserCanceled) {
                }
                else {
                    return Promise.reject(err);
                }
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function installContent(files) {
    const modFile = files.find(file => path_1.default.extname(file).toLowerCase() === common_1.MOD_FILE_EXT);
    const idx = modFile.indexOf(path_1.default.basename(modFile));
    const rootPath = path_1.default.dirname(modFile);
    const filtered = files.filter(file => ((file.indexOf(rootPath) !== -1)
        && (!file.endsWith(path_1.default.sep))));
    const instructions = filtered.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: path_1.default.join(file.substr(idx)),
        };
    });
    return Promise.resolve({ instructions });
}
function testSupportedContent(files, gameId) {
    let supported = (gameId === common_1.GAME_ID) &&
        (files.find(file => path_1.default.extname(file).toLowerCase() === common_1.MOD_FILE_EXT) !== undefined);
    if (supported && files.find(file => (path_1.default.basename(file).toLowerCase() === 'moduleconfig.xml')
        && (path_1.default.basename(path_1.default.dirname(file)).toLowerCase() === 'fomod'))) {
        supported = false;
    }
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
function toLOPrefix(context, mod) {
    var _a;
    const props = (0, util_1.genProps)(context);
    if (props === undefined) {
        return 'ZZZZ-' + mod.id;
    }
    const loadOrder = vortex_api_1.util.getSafe(props.state, ['persistent', 'loadOrder', props.profile.id], []);
    const loEntry = loadOrder.find(loEntry => loEntry.id === mod.id);
    return (((_a = loEntry === null || loEntry === void 0 ? void 0 : loEntry.data) === null || _a === void 0 ? void 0 : _a.prefix) !== undefined)
        ? loEntry.data.prefix + '-' + mod.id
        : 'ZZZZ-' + mod.id;
}
const localAppData = (() => {
    let cached;
    return () => {
        if (cached === undefined) {
            cached = process.env.LOCALAPPDATA
                || path_1.default.resolve(vortex_api_1.util.getVortexPath('appData'), '..', 'Local');
        }
        return cached;
    };
})();
const EXECUTABLE = path_1.default.join('CodeVein', 'Binaries', 'Win64', 'CodeVein-Win64-Shipping.exe');
function getGameVersion(gamePath) {
    const exeVersion = require('exe-version');
    return bluebird_1.default.resolve(exeVersion.getProductVersionLocalized(path_1.default.join(gamePath, EXECUTABLE)));
}
function main(context) {
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Code Vein',
        mergeMods: (mod) => toLOPrefix(context, mod),
        queryPath: (0, util_1.toBlue)(findGame),
        requiresCleanup: true,
        supportedTools: [],
        queryModPath: () => (0, common_1.modsRelPath)(),
        logo: 'gameart.jpg',
        executable: () => EXECUTABLE,
        getGameVersion,
        requiredFiles: [
            EXECUTABLE,
        ],
        setup: (0, util_1.toBlue)((discovery) => prepareForModding(context, discovery)),
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
            settingsPath: () => path_1.default.join(localAppData(), 'CodeVein', 'Saved', 'Config', 'WindowsNoEditor'),
        },
    });
    context.registerLoadOrder({
        deserializeLoadOrder: () => (0, loadOrder_1.deserialize)(context),
        serializeLoadOrder: (loadOrder) => (0, loadOrder_1.serialize)(context, loadOrder),
        validate: loadOrder_1.validate,
        gameId: common_1.GAME_ID,
        toggleableEntries: false,
        usageInstructions: 'Drag and drop the mods on the left to reorder them. Code Vein loads mods in alphabetic order so Vortex prefixes '
            + 'the directory names with "AAA, AAB, AAC, ..." to ensure they load in the order you set here.',
    });
    context.registerInstaller('codevein-mod', 25, (0, util_1.toBlue)(testSupportedContent), (0, util_1.toBlue)(installContent));
    context.registerMigration((0, util_1.toBlue)(oldVer => (0, migrations_1.migrate100)(context, oldVer)));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQTZEO0FBRTdELHFDQUE4RDtBQUM5RCwyQ0FBK0Q7QUFDL0QsNkNBQTBDO0FBRTFDLGlDQUF1RDtBQUV2RCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFFMUIsU0FBZSxRQUFROztRQUNyQixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqQyxDQUFDO0NBQUE7QUFFRCxTQUFlLG9CQUFvQixDQUFDLEdBQXdCLEVBQUUsWUFBc0I7O1FBQ2xGLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUM3QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFDRCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3JDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLDZCQUE2QixFQUFFO2dCQUNwRCxNQUFNLEVBQUUsQ0FBQyxDQUFDLHNFQUFzRTtzQkFDNUUsd0RBQXdEO3NCQUN4RCxrRkFBa0Y7c0JBQ2xGLGlGQUFpRjtzQkFDakYsOERBQThEO3NCQUM5RCxvRkFBb0Y7c0JBQ3BGLHlGQUF5RjtzQkFDekYsOEZBQThGLEVBQ2hHLEVBQUUsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxD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QVIsb0JBQVE7UUFDUixNQUFNLEVBQUUsZ0JBQU87UUFDZixpQkFBaUIsRUFBRSxLQUFLO1FBQ3hCLGlCQUFpQixFQUFFLGtIQUFrSDtjQUNqSSw4RkFBOEY7S0FDbkcsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxFQUFFLEVBQzFDLElBQUEsYUFBTSxFQUFDLG9CQUFvQixDQUFDLEVBQUUsSUFBQSxhQUFNLEVBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUV4RCxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLHVCQUFVLEVBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV6RSxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBNT0RfRklMRV9FWFQsIG1vZHNSZWxQYXRoIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgZGVzZXJpYWxpemUsIHNlcmlhbGl6ZSwgdmFsaWRhdGUgfSBmcm9tICcuL2xvYWRPcmRlcic7XG5pbXBvcnQgeyBtaWdyYXRlMTAwIH0gZnJvbSAnLi9taWdyYXRpb25zJztcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSVByb3BzLCBMb2FkT3JkZXIgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IGdlblByb3BzLCBnZXRQYWtGaWxlcywgdG9CbHVlIH0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgU1RFQU1fSUQgPSAnNjc4OTYwJztcblxuYXN5bmMgZnVuY3Rpb24gZmluZEdhbWUoKSB7XG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbU1RFQU1fSURdKVxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV4dGVybmFsRmlsZXNXYXJuaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZXh0ZXJuYWxNb2RzOiBzdHJpbmdbXSkge1xuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcbiAgaWYgKGV4dGVybmFsTW9kcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdFeHRlcm5hbCBNb2QgRmlsZXMgRGV0ZWN0ZWQnLCB7XG4gICAgICBiYmNvZGU6IHQoJ1ZvcnRleCBoYXMgZGlzY292ZXJlZCB0aGUgZm9sbG93aW5nIHVubWFuYWdlZC9leHRlcm5hbCBmaWxlcyBpbiB0aGUgJ1xuICAgICAgICArICd0aGUgZ2FtZVxcJ3MgbW9kcyBkaXJlY3Rvcnk6W2JyXVsvYnJdW2JyXVsvYnJde3tmaWxlc319J1xuICAgICAgICArICdbYnJdWy9icl1QbGVhc2Ugbm90ZSB0aGF0IHRoZSBleGlzdGVuY2Ugb2YgdGhlc2UgbW9kcyBpbnRlcmZlcmVzIHdpdGggVm9ydGV4XFwncyAnXG4gICAgICAgICsgJ2xvYWQgb3JkZXJpbmcgZnVuY3Rpb25hbGl0eSBhbmQgYXMgc3VjaCwgdGhleSBzaG91bGQgYmUgcmVtb3ZlZCB1c2luZyB0aGUgc2FtZSAnXG4gICAgICAgICsgJ21lZGl1bSB0aHJvdWdoIHdoaWNoIHRoZXkgaGF2ZSBiZWVuIGFkZGVkLlticl1bL2JyXVticl1bL2JyXSdcbiAgICAgICAgKyAnQWx0ZXJuYXRpdmVseSwgVm9ydGV4IGNhbiB0cnkgdG8gaW1wb3J0IHRoZXNlIGZpbGVzIGludG8gaXRzIG1vZHMgbGlzdCB3aGljaCB3aWxsICdcbiAgICAgICAgKyAnYWxsb3cgVm9ydGV4IHRvIHRha2UgY29udHJvbCBvdmVyIHRoZW0gYW5kIGRpc3BsYXkgdGhlbSBpbnNpZGUgdGhlIGxvYWQgb3JkZXJpbmcgcGFnZS4gJ1xuICAgICAgICArICdWb3J0ZXhcXCdzIGxvYWQgb3JkZXJpbmcgZnVuY3Rpb25hbGl0eSB3aWxsIG5vdCBkaXNwbGF5IGV4dGVybmFsIG1vZCBlbnRyaWVzIHVubGVzcyBpbXBvcnRlZCEnLFxuICAgICAgICB7IHJlcGxhY2U6IHsgZmlsZXM6IGV4dGVybmFsTW9kcy5tYXAobW9kID0+IGBcIiR7bW9kfVwiYCkuam9pbignW2JyXVsvYnJdJykgfSB9KSxcbiAgICB9LCBbXG4gICAgICB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IHJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSkgfSxcbiAgICAgIHsgbGFiZWw6ICdJbXBvcnQgRXh0ZXJuYWwgTW9kcycsIGFjdGlvbjogKCkgPT4gcmVzb2x2ZSh1bmRlZmluZWQpIH0sXG4gICAgXSk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBJbXBvcnRFeHRlcm5hbE1vZHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBleHRlcm5hbDogc3RyaW5nW10pIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZG93bmxvYWRzUGF0aCA9IHNlbGVjdG9ycy5kb3dubG9hZFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3Qgc3ppcCA9IG5ldyB1dGlsLlNldmVuWmlwKCk7XG4gIGZvciAoY29uc3QgbW9kRmlsZSBvZiBleHRlcm5hbCkge1xuICAgIGNvbnN0IGFyY2hpdmVQYXRoID0gcGF0aC5qb2luKGRvd25sb2Fkc1BhdGgsIHBhdGguYmFzZW5hbWUobW9kRmlsZSwgTU9EX0ZJTEVfRVhUKSArICcuemlwJyk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHN6aXAuYWRkKGFyY2hpdmVQYXRoLCBbIG1vZEZpbGUgXSwgeyByYXc6IFsnLXInXSB9KTtcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKG1vZEZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG1vZHNSZWxQYXRoKCkpO1xuICB0cnkge1xuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobW9kc1BhdGgpO1xuICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3QgbWFuYWdlZEZpbGVzID0gYXdhaXQgZ2V0UGFrRmlsZXMoaW5zdGFsbFBhdGgpO1xuICAgIGNvbnN0IGRlcGxveWVkRmlsZXMgPSBhd2FpdCBnZXRQYWtGaWxlcyhtb2RzUGF0aCk7XG4gICAgY29uc3QgbW9kaWZpZXIgPSAoZmlsZVBhdGgpID0+IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdW5NYW5hZ2VkUHJlZGljYXRlID0gKGZpbGVQYXRoOiBzdHJpbmcpID0+XG4gICAgICBtYW5hZ2VkRmlsZXMuZmluZChtYW5hZ2VkID0+IG1vZGlmaWVyKG1hbmFnZWQpID09PSBtb2RpZmllcihmaWxlUGF0aCkpID09PSB1bmRlZmluZWQ7XG4gICAgY29uc3QgZXh0ZXJuYWxNb2RzID0gZGVwbG95ZWRGaWxlcy5maWx0ZXIodW5NYW5hZ2VkUHJlZGljYXRlKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZXh0ZXJuYWxGaWxlc1dhcm5pbmcoY29udGV4dC5hcGksIGV4dGVybmFsTW9kcyk7XG4gICAgICBhd2FpdCBJbXBvcnRFeHRlcm5hbE1vZHMoY29udGV4dC5hcGksIGV4dGVybmFsTW9kcyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpIHtcbiAgICAgICAgLy8gbm9wXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzKSB7XG4gIGNvbnN0IG1vZEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9GSUxFX0VYVCk7XG4gIGNvbnN0IGlkeCA9IG1vZEZpbGUuaW5kZXhPZihwYXRoLmJhc2VuYW1lKG1vZEZpbGUpKTtcbiAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmRpcm5hbWUobW9kRmlsZSk7XG5cbiAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIGFuZCBhbnl0aGluZyB0aGF0IGlzbid0IGluIHRoZSByb290UGF0aC5cbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PlxuICAgICgoZmlsZS5pbmRleE9mKHJvb3RQYXRoKSAhPT0gLTEpXG4gICAgJiYgKCFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSkpKTtcblxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgIHNvdXJjZTogZmlsZSxcbiAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oZmlsZS5zdWJzdHIoaWR4KSksXG4gICAgfTtcbiAgfSk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn1cblxuZnVuY3Rpb24gdGVzdFN1cHBvcnRlZENvbnRlbnQoZmlsZXMsIGdhbWVJZCkge1xuICAvLyBNYWtlIHN1cmUgd2UncmUgYWJsZSB0byBzdXBwb3J0IHRoaXMgbW9kLlxuICBsZXQgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiZcbiAgICAoZmlsZXMuZmluZChmaWxlID0+IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfRklMRV9FWFQpICE9PSB1bmRlZmluZWQpO1xuXG4gIGlmIChzdXBwb3J0ZWQgJiYgZmlsZXMuZmluZChmaWxlID0+XG4gICAgICAocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSAnbW9kdWxlY29uZmlnLnhtbCcpXG4gICAgICAmJiAocGF0aC5iYXNlbmFtZShwYXRoLmRpcm5hbWUoZmlsZSkpLnRvTG93ZXJDYXNlKCkgPT09ICdmb21vZCcpKSkge1xuICAgIHN1cHBvcnRlZCA9IGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gdG9MT1ByZWZpeChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgbW9kOiB0eXBlcy5JTW9kKTogc3RyaW5nIHtcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAnWlpaWi0nICsgbW9kLmlkO1xuICB9XG5cbiAgLy8gUmV0cmlldmUgdGhlIGxvYWQgb3JkZXIgYXMgc3RvcmVkIGluIFZvcnRleCdzIGFwcGxpY2F0aW9uIHN0YXRlLlxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUocHJvcHMuc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9wcy5wcm9maWxlLmlkXSwgW10pO1xuXG4gIC8vIEZpbmQgdGhlIG1vZCBlbnRyeSBpbiB0aGUgbG9hZCBvcmRlciBzdGF0ZSBhbmQgaW5zZXJ0IHRoZSBwcmVmaXggaW4gZnJvbnRcbiAgLy8gIG9mIHRoZSBtb2QncyBuYW1lL2lkL3doYXRldmVyXG4gIGNvbnN0IGxvRW50cnk6IElMb2FkT3JkZXJFbnRyeSA9IGxvYWRPcmRlci5maW5kKGxvRW50cnkgPT4gbG9FbnRyeS5pZCA9PT0gbW9kLmlkKTtcbiAgcmV0dXJuIChsb0VudHJ5Py5kYXRhPy5wcmVmaXggIT09IHVuZGVmaW5lZClcbiAgICA/IGxvRW50cnkuZGF0YS5wcmVmaXggKyAnLScgKyBtb2QuaWRcbiAgICA6ICdaWlpaLScgKyBtb2QuaWQ7XG59XG5cbmNvbnN0IGxvY2FsQXBwRGF0YSA9ICgoKSA9PiB7XG4gIGxldCBjYWNoZWQ7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgaWYgKGNhY2hlZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjYWNoZWQgPSBwcm9jZXNzLmVudi5MT0NBTEFQUERBVEFcbiAgICAgICAgfHwgcGF0aC5yZXNvbHZlKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnYXBwRGF0YScpLCAnLi4nLCAnTG9jYWwnKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlZDtcbiAgfTtcbn0pKCk7XG5cbmNvbnN0IEVYRUNVVEFCTEUgPSBwYXRoLmpvaW4oJ0NvZGVWZWluJywgJ0JpbmFyaWVzJywgJ1dpbjY0JywgJ0NvZGVWZWluLVdpbjY0LVNoaXBwaW5nLmV4ZScpO1xuXG5mdW5jdGlvbiBnZXRHYW1lVmVyc2lvbihnYW1lUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IGV4ZVZlcnNpb24gPSByZXF1aXJlKCdleGUtdmVyc2lvbicpO1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShleGVWZXJzaW9uLmdldFByb2R1Y3RWZXJzaW9uTG9jYWxpemVkKHBhdGguam9pbihnYW1lUGF0aCwgRVhFQ1VUQUJMRSkpKTtcbn1cblxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XG4gICAgaWQ6IEdBTUVfSUQsXG4gICAgbmFtZTogJ0NvZGUgVmVpbicsXG4gICAgbWVyZ2VNb2RzOiAobW9kKSA9PiB0b0xPUHJlZml4KGNvbnRleHQsIG1vZCksXG4gICAgcXVlcnlQYXRoOiB0b0JsdWUoZmluZEdhbWUpLFxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcbiAgICBzdXBwb3J0ZWRUb29sczogW10sXG4gICAgcXVlcnlNb2RQYXRoOiAoKSA9PiBtb2RzUmVsUGF0aCgpLFxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gRVhFQ1VUQUJMRSxcbiAgICBnZXRHYW1lVmVyc2lvbixcbiAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICBFWEVDVVRBQkxFLFxuICAgIF0sXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fSUQsXG4gICAgICBzZXR0aW5nc1BhdGg6ICgpID0+IHBhdGguam9pbihsb2NhbEFwcERhdGEoKSwgJ0NvZGVWZWluJywgJ1NhdmVkJywgJ0NvbmZpZycsICdXaW5kb3dzTm9FZGl0b3InKSxcbiAgICB9LFxuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemUoY29udGV4dCksXG4gICAgc2VyaWFsaXplTG9hZE9yZGVyOiAobG9hZE9yZGVyKSA9PiBzZXJpYWxpemUoY29udGV4dCwgbG9hZE9yZGVyKSxcbiAgICB2YWxpZGF0ZSxcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IGZhbHNlLFxuICAgIHVzYWdlSW5zdHJ1Y3Rpb25zOiAnRHJhZyBhbmQgZHJvcCB0aGUgbW9kcyBvbiB0aGUgbGVmdCB0byByZW9yZGVyIHRoZW0uIENvZGUgVmVpbiBsb2FkcyBtb2RzIGluIGFscGhhYmV0aWMgb3JkZXIgc28gVm9ydGV4IHByZWZpeGVzICdcbiAgICAgICsgJ3RoZSBkaXJlY3RvcnkgbmFtZXMgd2l0aCBcIkFBQSwgQUFCLCBBQUMsIC4uLlwiIHRvIGVuc3VyZSB0aGV5IGxvYWQgaW4gdGhlIG9yZGVyIHlvdSBzZXQgaGVyZS4nLFxuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdjb2RldmVpbi1tb2QnLCAyNSxcbiAgICB0b0JsdWUodGVzdFN1cHBvcnRlZENvbnRlbnQpLCB0b0JsdWUoaW5zdGFsbENvbnRlbnQpKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGRWZXIgPT4gbWlncmF0ZTEwMChjb250ZXh0LCBvbGRWZXIpKSk7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiBtYWluLFxufTtcbiJdfQ==