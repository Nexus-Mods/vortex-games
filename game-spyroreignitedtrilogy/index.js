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
const STEAM_ID = '996580';
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
        name: 'Spyro Reignited Trilogy',
        mergeMods: (mod) => toLOPrefix(context, mod),
        queryPath: util_1.toBlue(findGame),
        requiresCleanup: true,
        supportedTools: [],
        queryModPath: () => common_1.modsRelPath(),
        logo: 'gameart.jpg',
        executable: () => 'Spyro.exe',
        requiredFiles: [
            'Spyro.exe',
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
        usageInstructions: 'Re-position entries by drag and dropping them - note that '
            + 'the mod with the higher index value will win any conflicts.',
    });
    context.registerInstaller('spyroreignitedtrilogy-mod', 25, util_1.toBlue(testSupportedContent), util_1.toBlue(installContent));
    context.registerMigration(util_1.toBlue(oldVer => migrations_1.migrate100(context, oldVer)));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUF3QjtBQUN4QiwyQ0FBNkQ7QUFFN0QscUNBQThEO0FBQzlELDJDQUErRDtBQUMvRCw2Q0FBMEM7QUFFMUMsaUNBQXVEO0FBRXZELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUUxQixTQUFlLFFBQVE7O1FBQ3JCLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Q0FBQTtBQUVELFNBQWUsb0JBQW9CLENBQUMsR0FBd0IsRUFBRSxZQUFzQjs7UUFDbEYsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN4QixJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUNELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsNkJBQTZCLEVBQUU7Z0JBQ3BELE1BQU0sRUFBRSxDQUFDLENBQUMsc0VBQXNFO3NCQUM1RSx3REFBd0Q7c0JBQ3hELGtGQUFrRjtzQkFDbEYsaUZBQWlGO3NCQUNqRiw4REFBOEQ7c0JBQzlELG9GQUFvRjtzQkFDcEYseUZBQXlGO3NCQUN6Riw4RkFBOEYsRUFDaEcsRUFBRSxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFD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Q3hCLG9CQUFvQixFQUFFLEdBQUcsRUFBRSxDQUFDLHVCQUFXLENBQUMsT0FBTyxDQUFDO1FBQ2hELGtCQUFrQixFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxxQkFBUyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUM7UUFDaEUsUUFBUSxFQUFSLG9CQUFRO1FBQ1IsTUFBTSxFQUFFLGdCQUFPO1FBQ2YsaUJBQWlCLEVBQUUsS0FBSztRQUN4QixpQkFBaUIsRUFBRSw0REFBNEQ7Y0FDM0UsNkRBQTZEO0tBQ2xFLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQywyQkFBMkIsRUFBRSxFQUFFLEVBQ3ZELGFBQU0sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLGFBQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBRXhELE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxhQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyx1QkFBVSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFekUsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBNT0RfRklMRV9FWFQsIG1vZHNSZWxQYXRoIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBkZXNlcmlhbGl6ZSwgc2VyaWFsaXplLCB2YWxpZGF0ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcclxuaW1wb3J0IHsgbWlncmF0ZTEwMCB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSVByb3BzLCBMb2FkT3JkZXIgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2VuUHJvcHMsIGdldFBha0ZpbGVzLCB0b0JsdWUgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuY29uc3QgU1RFQU1fSUQgPSAnOTk2NTgwJztcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZpbmRHYW1lKCkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbU1RFQU1fSURdKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZXh0ZXJuYWxGaWxlc1dhcm5pbmcoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBleHRlcm5hbE1vZHM6IHN0cmluZ1tdKSB7XHJcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XHJcbiAgaWYgKGV4dGVybmFsTW9kcy5sZW5ndGggPT09IDApIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ0V4dGVybmFsIE1vZCBGaWxlcyBEZXRlY3RlZCcsIHtcclxuICAgICAgYmJjb2RlOiB0KCdWb3J0ZXggaGFzIGRpc2NvdmVyZWQgdGhlIGZvbGxvd2luZyB1bm1hbmFnZWQvZXh0ZXJuYWwgZmlsZXMgaW4gdGhlICdcclxuICAgICAgICArICd0aGUgZ2FtZVxcJ3MgbW9kcyBkaXJlY3Rvcnk6W2JyXVsvYnJdW2JyXVsvYnJde3tmaWxlc319J1xyXG4gICAgICAgICsgJ1ticl1bL2JyXVBsZWFzZSBub3RlIHRoYXQgdGhlIGV4aXN0ZW5jZSBvZiB0aGVzZSBtb2RzIGludGVyZmVyZXMgd2l0aCBWb3J0ZXhcXCdzICdcclxuICAgICAgICArICdsb2FkIG9yZGVyaW5nIGZ1bmN0aW9uYWxpdHkgYW5kIGFzIHN1Y2gsIHRoZXkgc2hvdWxkIGJlIHJlbW92ZWQgdXNpbmcgdGhlIHNhbWUgJ1xyXG4gICAgICAgICsgJ21lZGl1bSB0aHJvdWdoIHdoaWNoIHRoZXkgaGF2ZSBiZWVuIGFkZGVkLlticl1bL2JyXVticl1bL2JyXSdcclxuICAgICAgICArICdBbHRlcm5hdGl2ZWx5LCBWb3J0ZXggY2FuIHRyeSB0byBpbXBvcnQgdGhlc2UgZmlsZXMgaW50byBpdHMgbW9kcyBsaXN0IHdoaWNoIHdpbGwgJ1xyXG4gICAgICAgICsgJ2FsbG93IFZvcnRleCB0byB0YWtlIGNvbnRyb2wgb3ZlciB0aGVtIGFuZCBkaXNwbGF5IHRoZW0gaW5zaWRlIHRoZSBsb2FkIG9yZGVyaW5nIHBhZ2UuICdcclxuICAgICAgICArICdWb3J0ZXhcXCdzIGxvYWQgb3JkZXJpbmcgZnVuY3Rpb25hbGl0eSB3aWxsIG5vdCBkaXNwbGF5IGV4dGVybmFsIG1vZCBlbnRyaWVzIHVubGVzcyBpbXBvcnRlZCEnLFxyXG4gICAgICAgIHsgcmVwbGFjZTogeyBmaWxlczogZXh0ZXJuYWxNb2RzLm1hcChtb2QgPT4gYFwiJHttb2R9XCJgKS5qb2luKCdbYnJdWy9icl0nKSB9IH0pLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IHJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSkgfSxcclxuICAgICAgeyBsYWJlbDogJ0ltcG9ydCBFeHRlcm5hbCBNb2RzJywgYWN0aW9uOiAoKSA9PiByZXNvbHZlKHVuZGVmaW5lZCkgfSxcclxuICAgIF0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBJbXBvcnRFeHRlcm5hbE1vZHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBleHRlcm5hbDogc3RyaW5nW10pIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRvd25sb2Fkc1BhdGggPSBzZWxlY3RvcnMuZG93bmxvYWRQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgY29uc3Qgc3ppcCA9IG5ldyB1dGlsLlNldmVuWmlwKCk7XHJcbiAgZm9yIChjb25zdCBtb2RGaWxlIG9mIGV4dGVybmFsKSB7XHJcbiAgICBjb25zdCBhcmNoaXZlUGF0aCA9IHBhdGguam9pbihkb3dubG9hZHNQYXRoLCBwYXRoLmJhc2VuYW1lKG1vZEZpbGUsIE1PRF9GSUxFX0VYVCkgKyAnLnppcCcpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgc3ppcC5hZGQoYXJjaGl2ZVBhdGgsIFsgbW9kRmlsZSBdLCB7IHJhdzogWyctciddIH0pO1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtb2RGaWxlKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG1vZHNSZWxQYXRoKCkpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1vZHNQYXRoKTtcclxuICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBtYW5hZ2VkRmlsZXMgPSBhd2FpdCBnZXRQYWtGaWxlcyhpbnN0YWxsUGF0aCk7XHJcbiAgICBjb25zdCBkZXBsb3llZEZpbGVzID0gYXdhaXQgZ2V0UGFrRmlsZXMobW9kc1BhdGgpO1xyXG4gICAgY29uc3QgbW9kaWZpZXIgPSAoZmlsZVBhdGgpID0+IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBjb25zdCB1bk1hbmFnZWRQcmVkaWNhdGUgPSAoZmlsZVBhdGg6IHN0cmluZykgPT5cclxuICAgICAgbWFuYWdlZEZpbGVzLmZpbmQobWFuYWdlZCA9PiBtb2RpZmllcihtYW5hZ2VkKSA9PT0gbW9kaWZpZXIoZmlsZVBhdGgpKSA9PT0gdW5kZWZpbmVkO1xyXG4gICAgY29uc3QgZXh0ZXJuYWxNb2RzID0gZGVwbG95ZWRGaWxlcy5maWx0ZXIodW5NYW5hZ2VkUHJlZGljYXRlKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGV4dGVybmFsRmlsZXNXYXJuaW5nKGNvbnRleHQuYXBpLCBleHRlcm5hbE1vZHMpO1xyXG4gICAgICBhd2FpdCBJbXBvcnRFeHRlcm5hbE1vZHMoY29udGV4dC5hcGksIGV4dGVybmFsTW9kcyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKSB7XHJcbiAgICAgICAgLy8gbm9wXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gaW5zdGFsbENvbnRlbnQoZmlsZXMpIHtcclxuICBjb25zdCBtb2RGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfRklMRV9FWFQpO1xyXG4gIGNvbnN0IGlkeCA9IG1vZEZpbGUuaW5kZXhPZihwYXRoLmJhc2VuYW1lKG1vZEZpbGUpKTtcclxuICBjb25zdCByb290UGF0aCA9IHBhdGguZGlybmFtZShtb2RGaWxlKTtcclxuXHJcbiAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIGFuZCBhbnl0aGluZyB0aGF0IGlzbid0IGluIHRoZSByb290UGF0aC5cclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+XHJcbiAgICAoKGZpbGUuaW5kZXhPZihyb290UGF0aCkgIT09IC0xKVxyXG4gICAgJiYgKCFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSkpKTtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oZmlsZS5zdWJzdHIoaWR4KSksXHJcbiAgICB9O1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkQ29udGVudChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gTWFrZSBzdXJlIHdlJ3JlIGFibGUgdG8gc3VwcG9ydCB0aGlzIG1vZC5cclxuICBsZXQgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiZcclxuICAgIChmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9GSUxFX0VYVCkgIT09IHVuZGVmaW5lZCk7XHJcblxyXG4gIGlmIChzdXBwb3J0ZWQgJiYgZmlsZXMuZmluZChmaWxlID0+XHJcbiAgICAgIChwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICdtb2R1bGVjb25maWcueG1sJylcclxuICAgICAgJiYgKHBhdGguYmFzZW5hbWUocGF0aC5kaXJuYW1lKGZpbGUpKS50b0xvd2VyQ2FzZSgpID09PSAnZm9tb2QnKSkpIHtcclxuICAgIHN1cHBvcnRlZCA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gdG9MT1ByZWZpeChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgbW9kOiB0eXBlcy5JTW9kKTogc3RyaW5nIHtcclxuICBjb25zdCBwcm9wczogSVByb3BzID0gZ2VuUHJvcHMoY29udGV4dCk7XHJcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiAnWlpaWi0nICsgbW9kLmlkO1xyXG4gIH1cclxuXHJcbiAgLy8gUmV0cmlldmUgdGhlIGxvYWQgb3JkZXIgYXMgc3RvcmVkIGluIFZvcnRleCdzIGFwcGxpY2F0aW9uIHN0YXRlLlxyXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShwcm9wcy5zdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb3BzLnByb2ZpbGUuaWRdLCBbXSk7XHJcblxyXG4gIC8vIEZpbmQgdGhlIG1vZCBlbnRyeSBpbiB0aGUgbG9hZCBvcmRlciBzdGF0ZSBhbmQgaW5zZXJ0IHRoZSBwcmVmaXggaW4gZnJvbnRcclxuICAvLyAgb2YgdGhlIG1vZCdzIG5hbWUvaWQvd2hhdGV2ZXJcclxuICBjb25zdCBsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnkgPSBsb2FkT3JkZXIuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IG1vZC5pZCk7XHJcbiAgcmV0dXJuIChsb0VudHJ5Py5kYXRhPy5wcmVmaXggIT09IHVuZGVmaW5lZClcclxuICAgID8gbG9FbnRyeS5kYXRhLnByZWZpeCArICctJyArIG1vZC5pZFxyXG4gICAgOiAnWlpaWi0nICsgbW9kLmlkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnU3B5cm8gUmVpZ25pdGVkIFRyaWxvZ3knLFxyXG4gICAgbWVyZ2VNb2RzOiAobW9kKSA9PiB0b0xPUHJlZml4KGNvbnRleHQsIG1vZCksXHJcbiAgICBxdWVyeVBhdGg6IHRvQmx1ZShmaW5kR2FtZSksXHJcbiAgICByZXF1aXJlc0NsZWFudXA6IHRydWUsXHJcbiAgICBzdXBwb3J0ZWRUb29sczogW10sXHJcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+IG1vZHNSZWxQYXRoKCksXHJcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxyXG4gICAgZXhlY3V0YWJsZTogKCkgPT4gJ1NweXJvLmV4ZScsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdTcHlyby5leGUnLFxyXG4gICAgXSxcclxuICAgIHNldHVwOiB0b0JsdWUoKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSksXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9JRCxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6ICtTVEVBTV9JRCxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xyXG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplKGNvbnRleHQpLFxyXG4gICAgc2VyaWFsaXplTG9hZE9yZGVyOiAobG9hZE9yZGVyKSA9PiBzZXJpYWxpemUoY29udGV4dCwgbG9hZE9yZGVyKSxcclxuICAgIHZhbGlkYXRlLFxyXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgdG9nZ2xlYWJsZUVudHJpZXM6IGZhbHNlLFxyXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICdSZS1wb3NpdGlvbiBlbnRyaWVzIGJ5IGRyYWcgYW5kIGRyb3BwaW5nIHRoZW0gLSBub3RlIHRoYXQgJ1xyXG4gICAgICArICd0aGUgbW9kIHdpdGggdGhlIGhpZ2hlciBpbmRleCB2YWx1ZSB3aWxsIHdpbiBhbnkgY29uZmxpY3RzLicsXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NweXJvcmVpZ25pdGVkdHJpbG9neS1tb2QnLCAyNSxcclxuICAgIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkQ29udGVudCksIHRvQmx1ZShpbnN0YWxsQ29udGVudCkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGRWZXIgPT4gbWlncmF0ZTEwMChjb250ZXh0LCBvbGRWZXIpKSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=