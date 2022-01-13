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
exports.walkAsync = exports.refreshGameParams = exports.getElementValue = exports.genProps = exports.getXMLData = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const subModCache_1 = require("./subModCache");
const PARAMS_TEMPLATE = ['/{{gameMode}}', '_MODULES_{{subModIds}}*_MODULES_'];
function getXMLData(xmlFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return vortex_api_1.fs.readFileAsync(xmlFilePath)
            .then((data) => __awaiter(this, void 0, void 0, function* () {
            try {
                const xmlData = yield (0, xml2js_1.parseStringPromise)(data);
                return Promise.resolve(xmlData);
            }
            catch (err) {
                return Promise.reject(new vortex_api_1.util.DataInvalid(err.message));
            }
        }))
            .catch(err => (err.code === 'ENOENT')
            ? Promise.reject(new vortex_api_1.util.NotFound(xmlFilePath))
            : Promise.reject(new vortex_api_1.util.DataInvalid(err.message)));
    });
}
exports.getXMLData = getXMLData;
function genProps(api, profileId) {
    const state = api.getState();
    const profile = (profileId !== undefined)
        ? vortex_api_1.selectors.profileById(state, profileId)
        : vortex_api_1.selectors.activeProfile(state);
    if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
        return undefined;
    }
    const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
    if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
        return undefined;
    }
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    const enabledMods = Object.keys(mods)
        .filter(id => vortex_api_1.util.getSafe(profile, ['modState', id, 'enabled'], false))
        .reduce((accum, id) => {
        accum[id] = mods[id];
        return accum;
    }, {});
    return { state, profile, discovery, enabledMods };
}
exports.genProps = genProps;
function getElementValue(subModuleFilePath, elementName) {
    return __awaiter(this, void 0, void 0, function* () {
        const logAndContinue = () => {
            (0, vortex_api_1.log)('error', 'Unable to parse xml element', elementName);
            return Promise.resolve(undefined);
        };
        return vortex_api_1.fs.readFileAsync(subModuleFilePath, { encoding: 'utf-8' })
            .then((xmlData) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                const modInfo = yield (0, xml2js_1.parseStringPromise)(xmlData);
                const element = (_a = modInfo === null || modInfo === void 0 ? void 0 : modInfo.Module) === null || _a === void 0 ? void 0 : _a[elementName];
                return ((element !== undefined) && (((_c = (_b = element === null || element === void 0 ? void 0 : element[0]) === null || _b === void 0 ? void 0 : _b.$) === null || _c === void 0 ? void 0 : _c.value) !== undefined))
                    ? Promise.resolve((_e = (_d = element === null || element === void 0 ? void 0 : element[0]) === null || _d === void 0 ? void 0 : _d.$) === null || _e === void 0 ? void 0 : _e.value)
                    : logAndContinue();
            }
            catch (err) {
                const errorMessage = 'Vortex was unable to parse: ' + subModuleFilePath + '; please inform the mod author';
                return Promise.reject(new vortex_api_1.util.DataInvalid(errorMessage));
            }
        }));
    });
}
exports.getElementValue = getElementValue;
function refreshGameParams(context, loadOrder) {
    return __awaiter(this, void 0, void 0, function* () {
        const LAUNCHER_DATA = (0, subModCache_1.getLauncherData)();
        const enabled = (!!loadOrder && Object.keys(loadOrder).length > 0)
            ? Object.keys(loadOrder)
                .filter(key => loadOrder[key].enabled)
                .sort((lhs, rhs) => loadOrder[lhs].pos - loadOrder[rhs].pos)
                .reduce((accum, key) => {
                const CACHE = (0, subModCache_1.getCache)();
                const cacheKeys = Object.keys(CACHE);
                const entry = cacheKeys.find(cacheElement => CACHE[cacheElement].vortexId === key);
                if (!!entry) {
                    accum.push(entry);
                }
                return accum;
            }, [])
            : LAUNCHER_DATA.singlePlayerSubMods
                .filter(subMod => subMod.enabled)
                .map(subMod => subMod.subModId);
        const parameters = [
            PARAMS_TEMPLATE[0].replace('{{gameMode}}', 'singleplayer'),
            PARAMS_TEMPLATE[1].replace('{{subModIds}}', enabled.map(key => `*${key}`).join('')),
        ];
        context.api.store.dispatch(vortex_api_1.actions.setGameParameters(common_1.GAME_ID, {
            executable: common_1.BANNERLORD_EXEC,
            parameters,
        }));
        return Promise.resolve();
    });
}
exports.refreshGameParams = refreshGameParams;
function walkAsync(dir, levelsDeep = 2) {
    return __awaiter(this, void 0, void 0, function* () {
        let entries = [];
        return vortex_api_1.fs.readdirAsync(dir).then(files => {
            const filtered = files.filter(file => !file.endsWith('.vortex_backup'));
            return bluebird_1.default.each(filtered, file => {
                const fullPath = path_1.default.join(dir, file);
                return vortex_api_1.fs.statAsync(fullPath).then(stats => {
                    if (stats.isDirectory() && levelsDeep > 0) {
                        return walkAsync(fullPath, levelsDeep - 1)
                            .then(nestedFiles => {
                            entries = entries.concat(nestedFiles);
                            return Promise.resolve();
                        });
                    }
                    else {
                        entries.push(fullPath);
                        return Promise.resolve();
                    }
                }).catch(err => {
                    (0, vortex_api_1.log)('error', 'MnB2: invalid symlink', err);
                    return (err.code === 'ENOENT')
                        ? Promise.resolve()
                        : Promise.reject(err);
                });
            });
        })
            .then(() => Promise.resolve(entries));
    });
}
exports.walkAsync = walkAsync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGdEQUF3QjtBQUN4QiwyQ0FBc0U7QUFDdEUsbUNBQTRDO0FBRTVDLHFDQUFvRDtBQUNwRCwrQ0FBMEQ7QUFNMUQsTUFBTSxlQUFlLEdBQUcsQ0FBQyxlQUFlLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztBQUU5RSxTQUFzQixVQUFVLENBQUMsV0FBbUI7O1FBQ2xELE9BQU8sZUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUM7YUFDakMsSUFBSSxDQUFDLENBQU0sSUFBSSxFQUFDLEVBQUU7WUFDakIsSUFBSTtnQkFDRixNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsMkJBQWtCLEVBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQy9DLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUNqQztZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQzFEO1FBQ0gsQ0FBQyxDQUFBLENBQUM7YUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO1lBQ25DLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNELENBQUM7Q0FBQTtBQWJELGdDQWFDO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLEdBQXdCLEVBQUUsU0FBa0I7SUFDbkUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sT0FBTyxHQUFHLENBQUMsU0FBUyxLQUFLLFNBQVMsQ0FBQztRQUN2QyxDQUFDLENBQUMsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQztRQUN6QyxDQUFDLENBQUMsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFbkMsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssZ0JBQU8sRUFBRTtRQUMvQixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sU0FBUyxHQUEyQixpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQzFELENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzlELElBQUksQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxNQUFLLFNBQVMsRUFBRTtRQUNqQyxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE1BQU0sSUFBSSxHQUNSLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRTNELE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1NBQ2xDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLEVBQUUsU0FBUyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDdkUsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFO1FBQ3BCLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckIsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFVCxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLENBQUM7QUFDcEQsQ0FBQztBQTNCRCw0QkEyQkM7QUFFRCxTQUFzQixlQUFlLENBQUMsaUJBQXlCLEVBQUUsV0FBbUI7O1FBQ2xGLE1BQU0sY0FBYyxHQUFHLEdBQUcsRUFBRTtZQUMxQixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLDZCQUE2QixFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3pELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUM7UUFDRixPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUM7YUFDOUQsSUFBSSxDQUFDLENBQU0sT0FBTyxFQUFDLEVBQUU7O1lBQ3BCLElBQUk7Z0JBQ0YsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFBLDJCQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNsRCxNQUFNLE9BQU8sR0FBRyxNQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLDBDQUFHLFdBQVcsQ0FBQyxDQUFDO2dCQUMvQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBLE1BQUEsTUFBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUcsQ0FBQyxDQUFDLDBDQUFFLENBQUMsMENBQUUsS0FBSyxNQUFLLFNBQVMsQ0FBQyxDQUFDO29CQUN4RSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFBLE1BQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFHLENBQUMsQ0FBQywwQ0FBRSxDQUFDLDBDQUFFLEtBQUssQ0FBQztvQkFDekMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO2FBQ3RCO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osTUFBTSxZQUFZLEdBQUcsOEJBQThCLEdBQUcsaUJBQWlCLEdBQUcsZ0NBQWdDLENBQUM7Z0JBQzNHLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7YUFDM0Q7UUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUFBO0FBbEJELDBDQWtCQztBQUVELFNBQXNCLGlCQUFpQixDQUFDLE9BQWdDLEVBQUUsU0FBcUI7O1FBQzdGLE1BQU0sYUFBYSxHQUFHLElBQUEsNkJBQWUsR0FBRSxDQUFDO1FBRXhDLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7WUFDaEUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO2lCQUNuQixNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDO2lCQUNyQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUM7aUJBQzNELE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDckIsTUFBTSxLQUFLLEdBQUcsSUFBQSxzQkFBUSxHQUFFLENBQUM7Z0JBQ3pCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsUUFBUSxLQUFLLEdBQUcsQ0FBQyxDQUFDO2dCQUNuRixJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUU7b0JBQ1gsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDbkI7Z0JBQ0QsT0FBTyxLQUFLLENBQUM7WUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ1YsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUI7aUJBQzlCLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUM7aUJBQ2hDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUd0QyxNQUFNLFVBQVUsR0FBRztZQUNqQixlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUM7WUFDMUQsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDcEYsQ0FBQztRQU1GLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLGlCQUFpQixDQUFDLGdCQUFPLEVBQUU7WUFDNUQsVUFBVSxFQUFFLHdCQUFlO1lBQzNCLFVBQVU7U0FDWCxDQUFDLENBQUMsQ0FBQztRQUVKLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzNCLENBQUM7Q0FBQTtBQXBDRCw4Q0FvQ0M7QUFFRCxTQUFzQixTQUFTLENBQUMsR0FBRyxFQUFFLFVBQVUsR0FBRyxDQUFDOztRQUNqRCxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDakIsT0FBTyxlQUFFLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN2QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztZQUN4RSxPQUFPLGtCQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDcEMsTUFBTSxRQUFRLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3RDLE9BQU8sZUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQ3pDLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRSxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUU7d0JBQ3pDLE9BQU8sU0FBUyxDQUFDLFFBQVEsRUFBRSxVQUFVLEdBQUcsQ0FBQyxDQUFDOzZCQUN2QyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7NEJBQ2xCLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDOzRCQUN0QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFDM0IsQ0FBQyxDQUFDLENBQUM7cUJBQ047eUJBQU07d0JBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDdkIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7cUJBQzFCO2dCQUNILENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFJYixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUMzQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7d0JBQzVCLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFO3dCQUNuQixDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDMUIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQzthQUNELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDeEMsQ0FBQztDQUFBO0FBN0JELDhCQTZCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcblxyXG5pbXBvcnQgeyBCQU5ORVJMT1JEX0VYRUMsIEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IGdldENhY2hlLCBnZXRMYXVuY2hlckRhdGEgfSBmcm9tICcuL3N1Yk1vZENhY2hlJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlciwgSVByb3BzIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG4vLyBVc2VkIGZvciB0aGUgXCJjdXN0b20gbGF1bmNoZXJcIiB0b29scy5cclxuLy8gIGdhbWVNb2RlOiBzaW5nbGVwbGF5ZXIgb3IgbXVsdGlwbGF5ZXJcclxuLy8gIHN1Yk1vZElkczogdGhlIG1vZCBpZHMgd2Ugd2FudCB0byBsb2FkIGludG8gdGhlIGdhbWUuXHJcbmNvbnN0IFBBUkFNU19URU1QTEFURSA9IFsnL3t7Z2FtZU1vZGV9fScsICdfTU9EVUxFU197e3N1Yk1vZElkc319Kl9NT0RVTEVTXyddO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFhNTERhdGEoeG1sRmlsZVBhdGg6IHN0cmluZykge1xyXG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKHhtbEZpbGVQYXRoKVxyXG4gICAgLnRoZW4oYXN5bmMgZGF0YSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgeG1sRGF0YSA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShkYXRhKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHhtbERhdGEpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoZXJyLm1lc3NhZ2UpKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgPyBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Ob3RGb3VuZCh4bWxGaWxlUGF0aCkpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoZXJyLm1lc3NhZ2UpKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZW5Qcm9wcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZD86IHN0cmluZyk6IElQcm9wcyB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZClcclxuICAgIDogc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG5cclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9XHJcbiAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuXHJcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RzKVxyXG4gICAgLmZpbHRlcihpZCA9PiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZScsIGlkLCAnZW5hYmxlZCddLCBmYWxzZSkpXHJcbiAgICAucmVkdWNlKChhY2N1bSwgaWQpID0+IHtcclxuICAgICAgYWNjdW1baWRdID0gbW9kc1tpZF07XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIHsgc3RhdGUsIHByb2ZpbGUsIGRpc2NvdmVyeSwgZW5hYmxlZE1vZHMgfTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEVsZW1lbnRWYWx1ZShzdWJNb2R1bGVGaWxlUGF0aDogc3RyaW5nLCBlbGVtZW50TmFtZTogc3RyaW5nKSB7XHJcbiAgY29uc3QgbG9nQW5kQ29udGludWUgPSAoKSA9PiB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ1VuYWJsZSB0byBwYXJzZSB4bWwgZWxlbWVudCcsIGVsZW1lbnROYW1lKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9O1xyXG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKHN1Yk1vZHVsZUZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pXHJcbiAgICAudGhlbihhc3luYyB4bWxEYXRhID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBtb2RJbmZvID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKHhtbERhdGEpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBtb2RJbmZvPy5Nb2R1bGU/LltlbGVtZW50TmFtZV07XHJcbiAgICAgICAgcmV0dXJuICgoZWxlbWVudCAhPT0gdW5kZWZpbmVkKSAmJiAoZWxlbWVudD8uWzBdPy4kPy52YWx1ZSAhPT0gdW5kZWZpbmVkKSlcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKGVsZW1lbnQ/LlswXT8uJD8udmFsdWUpXHJcbiAgICAgICAgICA6IGxvZ0FuZENvbnRpbnVlKCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9ICdWb3J0ZXggd2FzIHVuYWJsZSB0byBwYXJzZTogJyArIHN1Yk1vZHVsZUZpbGVQYXRoICsgJzsgcGxlYXNlIGluZm9ybSB0aGUgbW9kIGF1dGhvcic7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGVycm9yTWVzc2FnZSkpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBsb2FkT3JkZXI6IElMb2FkT3JkZXIpIHtcclxuICBjb25zdCBMQVVOQ0hFUl9EQVRBID0gZ2V0TGF1bmNoZXJEYXRhKCk7XHJcbiAgLy8gR28gdGhyb3VnaCB0aGUgZW5hYmxlZCBlbnRyaWVzIHNvIHdlIGNhbiBmb3JtIG91ciBnYW1lIHBhcmFtZXRlcnMuXHJcbiAgY29uc3QgZW5hYmxlZCA9ICghIWxvYWRPcmRlciAmJiBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmxlbmd0aCA+IDApXHJcbiAgICA/IE9iamVjdC5rZXlzKGxvYWRPcmRlcilcclxuICAgICAgICAuZmlsdGVyKGtleSA9PiBsb2FkT3JkZXJba2V5XS5lbmFibGVkKVxyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gbG9hZE9yZGVyW2xoc10ucG9zIC0gbG9hZE9yZGVyW3Joc10ucG9zKVxyXG4gICAgICAgIC5yZWR1Y2UoKGFjY3VtLCBrZXkpID0+IHtcclxuICAgICAgICAgIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICAgICAgICAgIGNvbnN0IGNhY2hlS2V5cyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgICAgICAgIGNvbnN0IGVudHJ5ID0gY2FjaGVLZXlzLmZpbmQoY2FjaGVFbGVtZW50ID0+IENBQ0hFW2NhY2hlRWxlbWVudF0udm9ydGV4SWQgPT09IGtleSk7XHJcbiAgICAgICAgICBpZiAoISFlbnRyeSkge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICB9LCBbXSlcclxuICAgIDogTEFVTkNIRVJfREFUQS5zaW5nbGVQbGF5ZXJTdWJNb2RzXHJcbiAgICAgICAgLmZpbHRlcihzdWJNb2QgPT4gc3ViTW9kLmVuYWJsZWQpXHJcbiAgICAgICAgLm1hcChzdWJNb2QgPT4gc3ViTW9kLnN1Yk1vZElkKTtcclxuXHJcbiAgLy8gQ3VycmVudGx5IFNpbmdsZXBsYXllciBvbmx5ISAobW9yZSByZXNlYXJjaCBpbnRvIE1QIG5lZWRzIHRvIGJlIGRvbmUpXHJcbiAgY29uc3QgcGFyYW1ldGVycyA9IFtcclxuICAgIFBBUkFNU19URU1QTEFURVswXS5yZXBsYWNlKCd7e2dhbWVNb2RlfX0nLCAnc2luZ2xlcGxheWVyJyksXHJcbiAgICBQQVJBTVNfVEVNUExBVEVbMV0ucmVwbGFjZSgne3tzdWJNb2RJZHN9fScsIGVuYWJsZWQubWFwKGtleSA9PiBgKiR7a2V5fWApLmpvaW4oJycpKSxcclxuICBdO1xyXG5cclxuICAvLyBUaGlzIGxhdW5jaGVyIHdpbGwgbm90IGZ1bmN0aW9uIHVubGVzcyB0aGUgcGF0aCBpcyBndWFyYW50ZWVkIHRvIHBvaW50XHJcbiAgLy8gIHRvd2FyZHMgdGhlIGJhbm5lcmxvcmQgZXhlY3V0YWJsZS4gR2l2ZW4gdGhhdCBlYXJsaWVyIHZlcnNpb25zIG9mIHRoaXNcclxuICAvLyAgZXh0ZW5zaW9uIGhhZCB0YXJnZXRlZCBUYWxlV29ybGRzLkxhdW5jaGVyLmV4ZSBpbnN0ZWFkIC0gd2UgbmVlZCB0byBtYWtlXHJcbiAgLy8gIHN1cmUgdGhpcyBpcyBzZXQgY29ycmVjdGx5LlxyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0R2FtZVBhcmFtZXRlcnMoR0FNRV9JRCwge1xyXG4gICAgZXhlY3V0YWJsZTogQkFOTkVSTE9SRF9FWEVDLFxyXG4gICAgcGFyYW1ldGVycyxcclxuICB9KSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhbGtBc3luYyhkaXIsIGxldmVsc0RlZXAgPSAyKSB7XHJcbiAgbGV0IGVudHJpZXMgPSBbXTtcclxuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGRpcikudGhlbihmaWxlcyA9PiB7XHJcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKCcudm9ydGV4X2JhY2t1cCcpKTtcclxuICAgIHJldHVybiBCbHVlYmlyZC5lYWNoKGZpbHRlcmVkLCBmaWxlID0+IHtcclxuICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBmaWxlKTtcclxuICAgICAgcmV0dXJuIGZzLnN0YXRBc3luYyhmdWxsUGF0aCkudGhlbihzdGF0cyA9PiB7XHJcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkgJiYgbGV2ZWxzRGVlcCA+IDApIHtcclxuICAgICAgICAgIHJldHVybiB3YWxrQXN5bmMoZnVsbFBhdGgsIGxldmVsc0RlZXAgLSAxKVxyXG4gICAgICAgICAgICAudGhlbihuZXN0ZWRGaWxlcyA9PiB7XHJcbiAgICAgICAgICAgICAgZW50cmllcyA9IGVudHJpZXMuY29uY2F0KG5lc3RlZEZpbGVzKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBlbnRyaWVzLnB1c2goZnVsbFBhdGgpO1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAvLyBUaGlzIGlzIGEgdmFsaWQgdXNlIGNhc2UsIHBhcnRpY3VsYXJseSBpZiB0aGUgZmlsZVxyXG4gICAgICAgIC8vICBpcyBkZXBsb3llZCBieSBWb3J0ZXggdXNpbmcgc3ltbGlua3MsIGFuZCB0aGUgbW9kIGRvZXNcclxuICAgICAgICAvLyAgbm90IGV4aXN0IHdpdGhpbiB0aGUgc3RhZ2luZyBmb2xkZXIuXHJcbiAgICAgICAgbG9nKCdlcnJvcicsICdNbkIyOiBpbnZhbGlkIHN5bWxpbmsnLCBlcnIpO1xyXG4gICAgICAgIHJldHVybiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pXHJcbiAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXMpKTtcclxufVxyXG4iXX0=