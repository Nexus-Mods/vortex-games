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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQTZEO0FBRTdELHFDQUE4RDtBQUM5RCwyQ0FBK0Q7QUFDL0QsNkNBQTBDO0FBRTFDLGlDQUF1RDtBQUV2RCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFFMUIsU0FBZSxRQUFROztRQUNyQixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqQyxDQUFDO0NBQUE7QUFFRCxTQUFlLG9CQUFvQixDQUFDLEdBQXdCLEVBQUUsWUFBc0I7O1FBQ2xGLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUM3QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFDRCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3JDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLDZCQUE2QixFQUFFO2dCQUNwRCxNQUFNLEVBQUUsQ0FBQyxDQUFDLHNFQUFzRTtzQkFDNUUsd0RBQXdEO3NCQUN4RCxrRkFBa0Y7c0JBQ2xGLGlGQUFpRjtzQkFDakYsOERBQThEO3NCQUM5RCxvRkFBb0Y7c0JBQ3BGLHlGQUF5RjtzQkFDekYsOEZBQThGLEVBQ2hHLEVBQUUsT0FBTyxFQUFFLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxD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QVIsb0JBQVE7UUFDUixNQUFNLEVBQUUsZ0JBQU87UUFDZixpQkFBaUIsRUFBRSxLQUFLO1FBQ3hCLGlCQUFpQixFQUFFLGtIQUFrSDtjQUNqSSw4RkFBOEY7S0FDbkcsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLGlCQUFpQixDQUFDLGNBQWMsRUFBRSxFQUFFLEVBQzFDLElBQUEsYUFBTSxFQUFDLG9CQUFvQixDQUFDLEVBQUUsSUFBQSxhQUFNLEVBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUV4RCxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBQSxhQUFNLEVBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFBLHVCQUFVLEVBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV6RSxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJsdWViaXJkIGZyb20gJ2JsdWViaXJkJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIE1PRF9GSUxFX0VYVCwgbW9kc1JlbFBhdGggfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IGRlc2VyaWFsaXplLCBzZXJpYWxpemUsIHZhbGlkYXRlIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5pbXBvcnQgeyBtaWdyYXRlMTAwIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlckVudHJ5LCBJUHJvcHMsIExvYWRPcmRlciB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBnZW5Qcm9wcywgZ2V0UGFrRmlsZXMsIHRvQmx1ZSB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBTVEVBTV9JRCA9ICc2Nzg5NjAnO1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtTVEVBTV9JRF0pXHJcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleHRlcm5hbEZpbGVzV2FybmluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGV4dGVybmFsTW9kczogc3RyaW5nW10pIHtcclxuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcclxuICBpZiAoZXh0ZXJuYWxNb2RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnRXh0ZXJuYWwgTW9kIEZpbGVzIERldGVjdGVkJywge1xyXG4gICAgICBiYmNvZGU6IHQoJ1ZvcnRleCBoYXMgZGlzY292ZXJlZCB0aGUgZm9sbG93aW5nIHVubWFuYWdlZC9leHRlcm5hbCBmaWxlcyBpbiB0aGUgJ1xyXG4gICAgICAgICsgJ3RoZSBnYW1lXFwncyBtb2RzIGRpcmVjdG9yeTpbYnJdWy9icl1bYnJdWy9icl17e2ZpbGVzfX0nXHJcbiAgICAgICAgKyAnW2JyXVsvYnJdUGxlYXNlIG5vdGUgdGhhdCB0aGUgZXhpc3RlbmNlIG9mIHRoZXNlIG1vZHMgaW50ZXJmZXJlcyB3aXRoIFZvcnRleFxcJ3MgJ1xyXG4gICAgICAgICsgJ2xvYWQgb3JkZXJpbmcgZnVuY3Rpb25hbGl0eSBhbmQgYXMgc3VjaCwgdGhleSBzaG91bGQgYmUgcmVtb3ZlZCB1c2luZyB0aGUgc2FtZSAnXHJcbiAgICAgICAgKyAnbWVkaXVtIHRocm91Z2ggd2hpY2ggdGhleSBoYXZlIGJlZW4gYWRkZWQuW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICAgICsgJ0FsdGVybmF0aXZlbHksIFZvcnRleCBjYW4gdHJ5IHRvIGltcG9ydCB0aGVzZSBmaWxlcyBpbnRvIGl0cyBtb2RzIGxpc3Qgd2hpY2ggd2lsbCAnXHJcbiAgICAgICAgKyAnYWxsb3cgVm9ydGV4IHRvIHRha2UgY29udHJvbCBvdmVyIHRoZW0gYW5kIGRpc3BsYXkgdGhlbSBpbnNpZGUgdGhlIGxvYWQgb3JkZXJpbmcgcGFnZS4gJ1xyXG4gICAgICAgICsgJ1ZvcnRleFxcJ3MgbG9hZCBvcmRlcmluZyBmdW5jdGlvbmFsaXR5IHdpbGwgbm90IGRpc3BsYXkgZXh0ZXJuYWwgbW9kIGVudHJpZXMgdW5sZXNzIGltcG9ydGVkIScsXHJcbiAgICAgICAgeyByZXBsYWNlOiB7IGZpbGVzOiBleHRlcm5hbE1vZHMubWFwKG1vZCA9PiBgXCIke21vZH1cImApLmpvaW4oJ1ticl1bL2JyXScpIH0gfSksXHJcbiAgICB9LCBbXHJcbiAgICAgIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4gcmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpKSB9LFxyXG4gICAgICB7IGxhYmVsOiAnSW1wb3J0IEV4dGVybmFsIE1vZHMnLCBhY3Rpb246ICgpID0+IHJlc29sdmUodW5kZWZpbmVkKSB9LFxyXG4gICAgXSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIEltcG9ydEV4dGVybmFsTW9kcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGV4dGVybmFsOiBzdHJpbmdbXSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZG93bmxvYWRzUGF0aCA9IHNlbGVjdG9ycy5kb3dubG9hZFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBzemlwID0gbmV3IHV0aWwuU2V2ZW5aaXAoKTtcclxuICBmb3IgKGNvbnN0IG1vZEZpbGUgb2YgZXh0ZXJuYWwpIHtcclxuICAgIGNvbnN0IGFyY2hpdmVQYXRoID0gcGF0aC5qb2luKGRvd25sb2Fkc1BhdGgsIHBhdGguYmFzZW5hbWUobW9kRmlsZSwgTU9EX0ZJTEVfRVhUKSArICcuemlwJyk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBzemlwLmFkZChhcmNoaXZlUGF0aCwgWyBtb2RGaWxlIF0sIHsgcmF3OiBbJy1yJ10gfSk7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKG1vZEZpbGUpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1JlbFBhdGgoKSk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobW9kc1BhdGgpO1xyXG4gICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IG1hbmFnZWRGaWxlcyA9IGF3YWl0IGdldFBha0ZpbGVzKGluc3RhbGxQYXRoKTtcclxuICAgIGNvbnN0IGRlcGxveWVkRmlsZXMgPSBhd2FpdCBnZXRQYWtGaWxlcyhtb2RzUGF0aCk7XHJcbiAgICBjb25zdCBtb2RpZmllciA9IChmaWxlUGF0aCkgPT4gcGF0aC5iYXNlbmFtZShmaWxlUGF0aCkudG9Mb3dlckNhc2UoKTtcclxuICAgIGNvbnN0IHVuTWFuYWdlZFByZWRpY2F0ZSA9IChmaWxlUGF0aDogc3RyaW5nKSA9PlxyXG4gICAgICBtYW5hZ2VkRmlsZXMuZmluZChtYW5hZ2VkID0+IG1vZGlmaWVyKG1hbmFnZWQpID09PSBtb2RpZmllcihmaWxlUGF0aCkpID09PSB1bmRlZmluZWQ7XHJcbiAgICBjb25zdCBleHRlcm5hbE1vZHMgPSBkZXBsb3llZEZpbGVzLmZpbHRlcih1bk1hbmFnZWRQcmVkaWNhdGUpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZXh0ZXJuYWxGaWxlc1dhcm5pbmcoY29udGV4dC5hcGksIGV4dGVybmFsTW9kcyk7XHJcbiAgICAgIGF3YWl0IEltcG9ydEV4dGVybmFsTW9kcyhjb250ZXh0LmFwaSwgZXh0ZXJuYWxNb2RzKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpIHtcclxuICAgICAgICAvLyBub3BcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpbnN0YWxsQ29udGVudChmaWxlcykge1xyXG4gIGNvbnN0IG1vZEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9GSUxFX0VYVCk7XHJcbiAgY29uc3QgaWR4ID0gbW9kRmlsZS5pbmRleE9mKHBhdGguYmFzZW5hbWUobW9kRmlsZSkpO1xyXG4gIGNvbnN0IHJvb3RQYXRoID0gcGF0aC5kaXJuYW1lKG1vZEZpbGUpO1xyXG5cclxuICAvLyBSZW1vdmUgZGlyZWN0b3JpZXMgYW5kIGFueXRoaW5nIHRoYXQgaXNuJ3QgaW4gdGhlIHJvb3RQYXRoLlxyXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT5cclxuICAgICgoZmlsZS5pbmRleE9mKHJvb3RQYXRoKSAhPT0gLTEpXHJcbiAgICAmJiAoIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApKSkpO1xyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihmaWxlLnN1YnN0cihpZHgpKSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWRDb250ZW50KGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBNYWtlIHN1cmUgd2UncmUgYWJsZSB0byBzdXBwb3J0IHRoaXMgbW9kLlxyXG4gIGxldCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKSAmJlxyXG4gICAgKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0ZJTEVfRVhUKSAhPT0gdW5kZWZpbmVkKTtcclxuXHJcbiAgaWYgKHN1cHBvcnRlZCAmJiBmaWxlcy5maW5kKGZpbGUgPT5cclxuICAgICAgKHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gJ21vZHVsZWNvbmZpZy54bWwnKVxyXG4gICAgICAmJiAocGF0aC5iYXNlbmFtZShwYXRoLmRpcm5hbWUoZmlsZSkpLnRvTG93ZXJDYXNlKCkgPT09ICdmb21vZCcpKSkge1xyXG4gICAgc3VwcG9ydGVkID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0b0xPUHJlZml4KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBtb2Q6IHR5cGVzLklNb2QpOiBzdHJpbmcge1xyXG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuICdaWlpaLScgKyBtb2QuaWQ7XHJcbiAgfVxyXG5cclxuICAvLyBSZXRyaWV2ZSB0aGUgbG9hZCBvcmRlciBhcyBzdG9yZWQgaW4gVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUuXHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvcHMucHJvZmlsZS5pZF0sIFtdKTtcclxuXHJcbiAgLy8gRmluZCB0aGUgbW9kIGVudHJ5IGluIHRoZSBsb2FkIG9yZGVyIHN0YXRlIGFuZCBpbnNlcnQgdGhlIHByZWZpeCBpbiBmcm9udFxyXG4gIC8vICBvZiB0aGUgbW9kJ3MgbmFtZS9pZC93aGF0ZXZlclxyXG4gIGNvbnN0IGxvRW50cnk6IElMb2FkT3JkZXJFbnRyeSA9IGxvYWRPcmRlci5maW5kKGxvRW50cnkgPT4gbG9FbnRyeS5pZCA9PT0gbW9kLmlkKTtcclxuICByZXR1cm4gKGxvRW50cnk/LmRhdGE/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBsb0VudHJ5LmRhdGEucHJlZml4ICsgJy0nICsgbW9kLmlkXHJcbiAgICA6ICdaWlpaLScgKyBtb2QuaWQ7XHJcbn1cclxuXHJcbmNvbnN0IGxvY2FsQXBwRGF0YSA9ICgoKSA9PiB7XHJcbiAgbGV0IGNhY2hlZDtcclxuICByZXR1cm4gKCkgPT4ge1xyXG4gICAgaWYgKGNhY2hlZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNhY2hlZCA9IHByb2Nlc3MuZW52LkxPQ0FMQVBQREFUQVxyXG4gICAgICAgIHx8IHBhdGgucmVzb2x2ZSh1dGlsLmdldFZvcnRleFBhdGgoJ2FwcERhdGEnKSwgJy4uJywgJ0xvY2FsJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2FjaGVkO1xyXG4gIH07XHJcbn0pKCk7XHJcblxyXG5jb25zdCBFWEVDVVRBQkxFID0gcGF0aC5qb2luKCdDb2RlVmVpbicsICdCaW5hcmllcycsICdXaW42NCcsICdDb2RlVmVpbi1XaW42NC1TaGlwcGluZy5leGUnKTtcclxuXHJcbmZ1bmN0aW9uIGdldEdhbWVWZXJzaW9uKGdhbWVQYXRoOiBzdHJpbmcpIHtcclxuICBjb25zdCBleGVWZXJzaW9uID0gcmVxdWlyZSgnZXhlLXZlcnNpb24nKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZShleGVWZXJzaW9uLmdldFByb2R1Y3RWZXJzaW9uTG9jYWxpemVkKHBhdGguam9pbihnYW1lUGF0aCwgRVhFQ1VUQUJMRSkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ0NvZGUgVmVpbicsXHJcbiAgICBtZXJnZU1vZHM6IChtb2QpID0+IHRvTE9QcmVmaXgoY29udGV4dCwgbW9kKSxcclxuICAgIHF1ZXJ5UGF0aDogdG9CbHVlKGZpbmRHYW1lKSxcclxuICAgIHJlcXVpcmVzQ2xlYW51cDogdHJ1ZSxcclxuICAgIHN1cHBvcnRlZFRvb2xzOiBbXSxcclxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gbW9kc1JlbFBhdGgoKSxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiBFWEVDVVRBQkxFLFxyXG4gICAgZ2V0R2FtZVZlcnNpb24sXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgIEVYRUNVVEFCTEUsXHJcbiAgICBdLFxyXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxyXG4gICAgICBzZXR0aW5nc1BhdGg6ICgpID0+IHBhdGguam9pbihsb2NhbEFwcERhdGEoKSwgJ0NvZGVWZWluJywgJ1NhdmVkJywgJ0NvbmZpZycsICdXaW5kb3dzTm9FZGl0b3InKSxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xyXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplKGNvbnRleHQpLFxyXG4gICAgc2VyaWFsaXplTG9hZE9yZGVyOiAobG9hZE9yZGVyKSA9PiBzZXJpYWxpemUoY29udGV4dCwgbG9hZE9yZGVyKSxcclxuICAgIHZhbGlkYXRlLFxyXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IGZhbHNlLFxyXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICdEcmFnIGFuZCBkcm9wIHRoZSBtb2RzIG9uIHRoZSBsZWZ0IHRvIHJlb3JkZXIgdGhlbS4gQ29kZSBWZWluIGxvYWRzIG1vZHMgaW4gYWxwaGFiZXRpYyBvcmRlciBzbyBWb3J0ZXggcHJlZml4ZXMgJ1xyXG4gICAgICArICd0aGUgZGlyZWN0b3J5IG5hbWVzIHdpdGggXCJBQUEsIEFBQiwgQUFDLCAuLi5cIiB0byBlbnN1cmUgdGhleSBsb2FkIGluIHRoZSBvcmRlciB5b3Ugc2V0IGhlcmUuJyxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignY29kZXZlaW4tbW9kJywgMjUsXHJcbiAgICB0b0JsdWUodGVzdFN1cHBvcnRlZENvbnRlbnQpLCB0b0JsdWUoaW5zdGFsbENvbnRlbnQpKTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbih0b0JsdWUob2xkVmVyID0+IG1pZ3JhdGUxMDAoY29udGV4dCwgb2xkVmVyKSkpO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19