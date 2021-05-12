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
const common_1 = require("./common");
const loadOrder_1 = require("./loadOrder");
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const STEAM_ID = '692850';
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
        const modsPath = path_1.default.join(discovery.path, common_1.modsRelPath());
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(modsPath);
            const installPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const managedFiles = yield util_1.getPakFiles(installPath);
            const deployedFiles = yield util_1.getPakFiles(modsPath);
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
    const props = util_1.genProps(context);
    if (props === undefined) {
        return 'ZZZZ-' + mod.id;
    }
    const loadOrder = vortex_api_1.util.getSafe(props.state, ['persistent', 'loadOrder', props.profile.id], []);
    const loEntry = loadOrder.find(loEntry => loEntry.id === mod.id);
    return (((_a = loEntry === null || loEntry === void 0 ? void 0 : loEntry.data) === null || _a === void 0 ? void 0 : _a.prefix) !== undefined)
        ? loEntry.data.prefix + '-' + mod.id
        : 'ZZZZ-' + mod.id;
}
function main(context) {
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Bloodstained:\tRitual of the Night',
        mergeMods: (mod) => toLOPrefix(context, mod),
        queryPath: util_1.toBlue(findGame),
        requiresCleanup: true,
        supportedTools: [],
        queryModPath: () => common_1.modsRelPath(),
        logo: 'gameart.jpg',
        executable: () => 'BloodstainedROTN.exe',
        requiredFiles: [
            'BloodstainedRotN.exe',
            'BloodstainedROTN/Binaries/Win64/BloodstainedRotN-Win64-Shipping.exe',
        ],
        setup: util_1.toBlue((discovery) => prepareForModding(context, discovery)),
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
        },
    });
    context.registerLoadOrder({
        deserializeLoadOrder: () => loadOrder_1.deserialize(context),
        serializeLoadOrder: (loadOrder) => loadOrder_1.serialize(context, loadOrder),
        validate: loadOrder_1.validate,
        gameId: common_1.GAME_ID,
        toggleableEntries: false,
        usageInstructions: 'Drag and drop the mods on the left to reorder them. BloodstainedROTN loads mods in alphabetic order so Vortex prefixes '
            + 'the directory names with "AAA, AAB, AAC, ..." to ensure they load in the order you set here.',
    });
    context.registerInstaller('bloodstainedrotn-mod', 25, util_1.toBlue(testSupportedContent), util_1.toBlue(installContent));
    context.registerMigration(util_1.toBlue(oldVer => migrations_1.migrate100(context.api, oldVer)));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUF3QjtBQUN4QiwyQ0FBNkQ7QUFFN0QscUNBQThEO0FBQzlELDJDQUErRDtBQUMvRCw2Q0FBMEM7QUFFMUMsaUNBQXVEO0FBRXZELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUUxQixTQUFlLFFBQVE7O1FBQ3JCLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Q0FBQTtBQUVELFNBQWUsb0JBQW9CLENBQUMsR0FBd0IsRUFBRSxZQUFzQjs7UUFDbEYsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN4QixJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUNELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsNkJBQTZCLEVBQUU7Z0JBQ3BELE1BQU0sRUFBRSxDQUFDLENBQUMsc0VBQXNFO3NCQUM1RSx3REFBd0Q7c0JBQ3hELGtGQUFrRjtzQkFDbEYsaUZBQWlGO3NCQUNqRiw4REFBOEQ7c0JBQzlELG9GQUFvRjtzQkFDcEYseUZBQXlGO3NCQUN6Riw4RkFBOEYsRUFDaEcsRUFBRSxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFD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QUFDLGlCQUFpQixDQUFDO1FBQ3hCLG9CQUFvQixFQUFFLEdBQUcsRUFBRSxDQUFDLHVCQUFXLENBQUMsT0FBTyxDQUFDO1FBQ2hELGtCQUFrQixFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxxQkFBUyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUM7UUFDaEUsUUFBUSxFQUFSLG9CQUFRO1FBQ1IsTUFBTSxFQUFFLGdCQUFPO1FBQ2YsaUJBQWlCLEVBQUUsS0FBSztRQUN4QixpQkFBaUIsRUFBRSx5SEFBeUg7Y0FDeEksOEZBQThGO0tBQ25HLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLEVBQ2xELGFBQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLGFBQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBRXhELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxhQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyx1QkFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTdFLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgZnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgTU9EX0ZJTEVfRVhULCBtb2RzUmVsUGF0aCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgZGVzZXJpYWxpemUsIHNlcmlhbGl6ZSwgdmFsaWRhdGUgfSBmcm9tICcuL2xvYWRPcmRlcic7XHJcbmltcG9ydCB7IG1pZ3JhdGUxMDAgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElQcm9wcywgTG9hZE9yZGVyIH0gZnJvbSAnLi90eXBlcyc7XHJcbmltcG9ydCB7IGdlblByb3BzLCBnZXRQYWtGaWxlcywgdG9CbHVlIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IFNURUFNX0lEID0gJzY5Mjg1MCc7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBmaW5kR2FtZSgpIHtcclxuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW1NURUFNX0lEXSlcclxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGV4dGVybmFsRmlsZXNXYXJuaW5nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZXh0ZXJuYWxNb2RzOiBzdHJpbmdbXSkge1xyXG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xyXG4gIGlmIChleHRlcm5hbE1vZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdFeHRlcm5hbCBNb2QgRmlsZXMgRGV0ZWN0ZWQnLCB7XHJcbiAgICAgIGJiY29kZTogdCgnVm9ydGV4IGhhcyBkaXNjb3ZlcmVkIHRoZSBmb2xsb3dpbmcgdW5tYW5hZ2VkL2V4dGVybmFsIGZpbGVzIGluIHRoZSAnXHJcbiAgICAgICAgKyAndGhlIGdhbWVcXCdzIG1vZHMgZGlyZWN0b3J5Olticl1bL2JyXVticl1bL2JyXXt7ZmlsZXN9fSdcclxuICAgICAgICArICdbYnJdWy9icl1QbGVhc2Ugbm90ZSB0aGF0IHRoZSBleGlzdGVuY2Ugb2YgdGhlc2UgbW9kcyBpbnRlcmZlcmVzIHdpdGggVm9ydGV4XFwncyAnXHJcbiAgICAgICAgKyAnbG9hZCBvcmRlcmluZyBmdW5jdGlvbmFsaXR5IGFuZCBhcyBzdWNoLCB0aGV5IHNob3VsZCBiZSByZW1vdmVkIHVzaW5nIHRoZSBzYW1lICdcclxuICAgICAgICArICdtZWRpdW0gdGhyb3VnaCB3aGljaCB0aGV5IGhhdmUgYmVlbiBhZGRlZC5bYnJdWy9icl1bYnJdWy9icl0nXHJcbiAgICAgICAgKyAnQWx0ZXJuYXRpdmVseSwgVm9ydGV4IGNhbiB0cnkgdG8gaW1wb3J0IHRoZXNlIGZpbGVzIGludG8gaXRzIG1vZHMgbGlzdCB3aGljaCB3aWxsICdcclxuICAgICAgICArICdhbGxvdyBWb3J0ZXggdG8gdGFrZSBjb250cm9sIG92ZXIgdGhlbSBhbmQgZGlzcGxheSB0aGVtIGluc2lkZSB0aGUgbG9hZCBvcmRlcmluZyBwYWdlLiAnXHJcbiAgICAgICAgKyAnVm9ydGV4XFwncyBsb2FkIG9yZGVyaW5nIGZ1bmN0aW9uYWxpdHkgd2lsbCBub3QgZGlzcGxheSBleHRlcm5hbCBtb2QgZW50cmllcyB1bmxlc3MgaW1wb3J0ZWQhJyxcclxuICAgICAgICB7IHJlcGxhY2U6IHsgZmlsZXM6IGV4dGVybmFsTW9kcy5tYXAobW9kID0+IGBcIiR7bW9kfVwiYCkuam9pbignW2JyXVsvYnJdJykgfSB9KSxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ0Nsb3NlJywgYWN0aW9uOiAoKSA9PiByZWplY3QobmV3IHV0aWwuVXNlckNhbmNlbGVkKCkpIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdJbXBvcnQgRXh0ZXJuYWwgTW9kcycsIGFjdGlvbjogKCkgPT4gcmVzb2x2ZSh1bmRlZmluZWQpIH0sXHJcbiAgICBdKTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gSW1wb3J0RXh0ZXJuYWxNb2RzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZXh0ZXJuYWw6IHN0cmluZ1tdKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkb3dubG9hZHNQYXRoID0gc2VsZWN0b3JzLmRvd25sb2FkUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IHN6aXAgPSBuZXcgdXRpbC5TZXZlblppcCgpO1xyXG4gIGZvciAoY29uc3QgbW9kRmlsZSBvZiBleHRlcm5hbCkge1xyXG4gICAgY29uc3QgYXJjaGl2ZVBhdGggPSBwYXRoLmpvaW4oZG93bmxvYWRzUGF0aCwgcGF0aC5iYXNlbmFtZShtb2RGaWxlLCBNT0RfRklMRV9FWFQpICsgJy56aXAnKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHN6aXAuYWRkKGFyY2hpdmVQYXRoLCBbIG1vZEZpbGUgXSwgeyByYXc6IFsnLXInXSB9KTtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobW9kRmlsZSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBtb2RzUmVsUGF0aCgpKTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCk7XHJcbiAgICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgbWFuYWdlZEZpbGVzID0gYXdhaXQgZ2V0UGFrRmlsZXMoaW5zdGFsbFBhdGgpO1xyXG4gICAgY29uc3QgZGVwbG95ZWRGaWxlcyA9IGF3YWl0IGdldFBha0ZpbGVzKG1vZHNQYXRoKTtcclxuICAgIGNvbnN0IG1vZGlmaWVyID0gKGZpbGVQYXRoKSA9PiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgY29uc3QgdW5NYW5hZ2VkUHJlZGljYXRlID0gKGZpbGVQYXRoOiBzdHJpbmcpID0+XHJcbiAgICAgIG1hbmFnZWRGaWxlcy5maW5kKG1hbmFnZWQgPT4gbW9kaWZpZXIobWFuYWdlZCkgPT09IG1vZGlmaWVyKGZpbGVQYXRoKSkgPT09IHVuZGVmaW5lZDtcclxuICAgIGNvbnN0IGV4dGVybmFsTW9kcyA9IGRlcGxveWVkRmlsZXMuZmlsdGVyKHVuTWFuYWdlZFByZWRpY2F0ZSk7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBleHRlcm5hbEZpbGVzV2FybmluZyhjb250ZXh0LmFwaSwgZXh0ZXJuYWxNb2RzKTtcclxuICAgICAgYXdhaXQgSW1wb3J0RXh0ZXJuYWxNb2RzKGNvbnRleHQuYXBpLCBleHRlcm5hbE1vZHMpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCkge1xyXG4gICAgICAgIC8vIG5vcFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzKSB7XHJcbiAgY29uc3QgbW9kRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0ZJTEVfRVhUKTtcclxuICBjb25zdCBpZHggPSBtb2RGaWxlLmluZGV4T2YocGF0aC5iYXNlbmFtZShtb2RGaWxlKSk7XHJcbiAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmRpcm5hbWUobW9kRmlsZSk7XHJcblxyXG4gIC8vIFJlbW92ZSBkaXJlY3RvcmllcyBhbmQgYW55dGhpbmcgdGhhdCBpc24ndCBpbiB0aGUgcm9vdFBhdGguXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PlxyXG4gICAgKChmaWxlLmluZGV4T2Yocm9vdFBhdGgpICE9PSAtMSlcclxuICAgICYmICghZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkpKSk7XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbHRlcmVkLm1hcChmaWxlID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKGZpbGUuc3Vic3RyKGlkeCkpLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdGVzdFN1cHBvcnRlZENvbnRlbnQoZmlsZXMsIGdhbWVJZCkge1xyXG4gIC8vIE1ha2Ugc3VyZSB3ZSdyZSBhYmxlIHRvIHN1cHBvcnQgdGhpcyBtb2QuXHJcbiAgbGV0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpICYmXHJcbiAgICAoZmlsZXMuZmluZChmaWxlID0+IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfRklMRV9FWFQpICE9PSB1bmRlZmluZWQpO1xyXG5cclxuICBpZiAoc3VwcG9ydGVkICYmIGZpbGVzLmZpbmQoZmlsZSA9PlxyXG4gICAgICAocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSAnbW9kdWxlY29uZmlnLnhtbCcpXHJcbiAgICAgICYmIChwYXRoLmJhc2VuYW1lKHBhdGguZGlybmFtZShmaWxlKSkudG9Mb3dlckNhc2UoKSA9PT0gJ2ZvbW9kJykpKSB7XHJcbiAgICBzdXBwb3J0ZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvTE9QcmVmaXgoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIG1vZDogdHlwZXMuSU1vZCk6IHN0cmluZyB7XHJcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gJ1paWlotJyArIG1vZC5pZDtcclxuICB9XHJcblxyXG4gIC8vIFJldHJpZXZlIHRoZSBsb2FkIG9yZGVyIGFzIHN0b3JlZCBpbiBWb3J0ZXgncyBhcHBsaWNhdGlvbiBzdGF0ZS5cclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUocHJvcHMuc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9wcy5wcm9maWxlLmlkXSwgW10pO1xyXG5cclxuICAvLyBGaW5kIHRoZSBtb2QgZW50cnkgaW4gdGhlIGxvYWQgb3JkZXIgc3RhdGUgYW5kIGluc2VydCB0aGUgcHJlZml4IGluIGZyb250XHJcbiAgLy8gIG9mIHRoZSBtb2QncyBuYW1lL2lkL3doYXRldmVyXHJcbiAgY29uc3QgbG9FbnRyeTogSUxvYWRPcmRlckVudHJ5ID0gbG9hZE9yZGVyLmZpbmQobG9FbnRyeSA9PiBsb0VudHJ5LmlkID09PSBtb2QuaWQpO1xyXG4gIHJldHVybiAobG9FbnRyeT8uZGF0YT8ucHJlZml4ICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IGxvRW50cnkuZGF0YS5wcmVmaXggKyAnLScgKyBtb2QuaWRcclxuICAgIDogJ1paWlotJyArIG1vZC5pZDtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ0Jsb29kc3RhaW5lZDpcXHRSaXR1YWwgb2YgdGhlIE5pZ2h0JyxcclxuICAgIG1lcmdlTW9kczogKG1vZCkgPT4gdG9MT1ByZWZpeChjb250ZXh0LCBtb2QpLFxyXG4gICAgcXVlcnlQYXRoOiB0b0JsdWUoZmluZEdhbWUpLFxyXG4gICAgcmVxdWlyZXNDbGVhbnVwOiB0cnVlLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtdLFxyXG4gICAgcXVlcnlNb2RQYXRoOiAoKSA9PiBtb2RzUmVsUGF0aCgpLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdCbG9vZHN0YWluZWRST1ROLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdCbG9vZHN0YWluZWRSb3ROLmV4ZScsXHJcbiAgICAgICdCbG9vZHN0YWluZWRST1ROL0JpbmFyaWVzL1dpbjY0L0Jsb29kc3RhaW5lZFJvdE4tV2luNjQtU2hpcHBpbmcuZXhlJyxcclxuICAgIF0sXHJcbiAgICBzZXR1cDogdG9CbHVlKChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSkpLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fSUQsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcclxuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyOiAoKSA9PiBkZXNlcmlhbGl6ZShjb250ZXh0KSxcclxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplKGNvbnRleHQsIGxvYWRPcmRlciksXHJcbiAgICB2YWxpZGF0ZSxcclxuICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgIHRvZ2dsZWFibGVFbnRyaWVzOiBmYWxzZSxcclxuICAgIHVzYWdlSW5zdHJ1Y3Rpb25zOiAnRHJhZyBhbmQgZHJvcCB0aGUgbW9kcyBvbiB0aGUgbGVmdCB0byByZW9yZGVyIHRoZW0uIEJsb29kc3RhaW5lZFJPVE4gbG9hZHMgbW9kcyBpbiBhbHBoYWJldGljIG9yZGVyIHNvIFZvcnRleCBwcmVmaXhlcyAnXHJcbiAgICAgICsgJ3RoZSBkaXJlY3RvcnkgbmFtZXMgd2l0aCBcIkFBQSwgQUFCLCBBQUMsIC4uLlwiIHRvIGVuc3VyZSB0aGV5IGxvYWQgaW4gdGhlIG9yZGVyIHlvdSBzZXQgaGVyZS4nLFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCdibG9vZHN0YWluZWRyb3RuLW1vZCcsIDI1LFxyXG4gICAgdG9CbHVlKHRlc3RTdXBwb3J0ZWRDb250ZW50KSwgdG9CbHVlKGluc3RhbGxDb250ZW50KSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24odG9CbHVlKG9sZFZlciA9PiBtaWdyYXRlMTAwKGNvbnRleHQuYXBpLCBvbGRWZXIpKSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=