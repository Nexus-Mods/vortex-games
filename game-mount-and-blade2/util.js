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
exports.walkAsync = exports.getCleanVersion = exports.refreshGameParams = exports.getElementValue = exports.genProps = exports.getXMLData = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
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
function getCleanVersion(subModId, unsanitized) {
    if (!unsanitized) {
        (0, vortex_api_1.log)('debug', 'failed to sanitize/coerce version', { subModId, unsanitized });
        return undefined;
    }
    try {
        const sanitized = unsanitized.replace(/[a-z]|[A-Z]/g, '');
        const coerced = semver_1.default.coerce(sanitized);
        return coerced.version;
    }
    catch (err) {
        (0, vortex_api_1.log)('debug', 'failed to sanitize/coerce version', { subModId, unsanitized, error: err.message });
        return undefined;
    }
}
exports.getCleanVersion = getCleanVersion;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGdEQUF3QjtBQUN4QixvREFBNEI7QUFDNUIsMkNBQXNFO0FBQ3RFLG1DQUE0QztBQUU1QyxxQ0FBb0Q7QUFDcEQsK0NBQTBEO0FBTTFELE1BQU0sZUFBZSxHQUFHLENBQUMsZUFBZSxFQUFFLGtDQUFrQyxDQUFDLENBQUM7QUFFOUUsU0FBc0IsVUFBVSxDQUFDLFdBQW1COztRQUNsRCxPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDO2FBQ2pDLElBQUksQ0FBQyxDQUFNLElBQUksRUFBQyxFQUFFO1lBQ2pCLElBQUk7Z0JBQ0YsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFBLDJCQUFrQixFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDakM7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUMxRDtRQUNILENBQUMsQ0FBQSxDQUFDO2FBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztZQUNuQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0NBQUE7QUFiRCxnQ0FhQztBQUVELFNBQWdCLFFBQVEsQ0FB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LFdBQVcsQ0FBQyxFQUFFOzRCQUNsQixPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQzs0QkFDdEMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQzNCLENBQUMsQ0FBQyxDQUFDO3FCQUNOO3lCQUFNO3dCQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ3ZCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO3FCQUMxQjtnQkFDSCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBSWIsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO3dCQUM1QixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTt3QkFDbkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzFCLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7YUFDRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FBQTtBQTdCRCw4QkE2QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xuXG5pbXBvcnQgeyBCQU5ORVJMT1JEX0VYRUMsIEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBnZXRDYWNoZSwgZ2V0TGF1bmNoZXJEYXRhIH0gZnJvbSAnLi9zdWJNb2RDYWNoZSc7XG5pbXBvcnQgeyBJTG9hZE9yZGVyLCBJUHJvcHMgfSBmcm9tICcuL3R5cGVzJztcblxuLy8gVXNlZCBmb3IgdGhlIFwiY3VzdG9tIGxhdW5jaGVyXCIgdG9vbHMuXG4vLyAgZ2FtZU1vZGU6IHNpbmdsZXBsYXllciBvciBtdWx0aXBsYXllclxuLy8gIHN1Yk1vZElkczogdGhlIG1vZCBpZHMgd2Ugd2FudCB0byBsb2FkIGludG8gdGhlIGdhbWUuXG5jb25zdCBQQVJBTVNfVEVNUExBVEUgPSBbJy97e2dhbWVNb2RlfX0nLCAnX01PRFVMRVNfe3tzdWJNb2RJZHN9fSpfTU9EVUxFU18nXTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFhNTERhdGEoeG1sRmlsZVBhdGg6IHN0cmluZykge1xuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyh4bWxGaWxlUGF0aClcbiAgICAudGhlbihhc3luYyBkYXRhID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHhtbERhdGEgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoZGF0YSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeG1sRGF0YSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGVyci5tZXNzYWdlKSk7XG4gICAgICB9XG4gICAgfSlcbiAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXG4gICAgICA/IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLk5vdEZvdW5kKHhtbEZpbGVQYXRoKSlcbiAgICAgIDogUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoZXJyLm1lc3NhZ2UpKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5Qcm9wcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZD86IHN0cmluZyk6IElQcm9wcyB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSAocHJvZmlsZUlkICE9PSB1bmRlZmluZWQpXG4gICAgPyBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZClcbiAgICA6IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcblxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPVxuICAgIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kcylcbiAgICAuZmlsdGVyKGlkID0+IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJywgaWQsICdlbmFibGVkJ10sIGZhbHNlKSlcbiAgICAucmVkdWNlKChhY2N1bSwgaWQpID0+IHtcbiAgICAgIGFjY3VtW2lkXSA9IG1vZHNbaWRdO1xuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIHt9KTtcblxuICByZXR1cm4geyBzdGF0ZSwgcHJvZmlsZSwgZGlzY292ZXJ5LCBlbmFibGVkTW9kcyB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RWxlbWVudFZhbHVlKHN1Yk1vZHVsZUZpbGVQYXRoOiBzdHJpbmcsIGVsZW1lbnROYW1lOiBzdHJpbmcpIHtcbiAgY29uc3QgbG9nQW5kQ29udGludWUgPSAoKSA9PiB7XG4gICAgbG9nKCdlcnJvcicsICdVbmFibGUgdG8gcGFyc2UgeG1sIGVsZW1lbnQnLCBlbGVtZW50TmFtZSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9O1xuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhzdWJNb2R1bGVGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KVxuICAgIC50aGVuKGFzeW5jIHhtbERhdGEgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgbW9kSW5mbyA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZSh4bWxEYXRhKTtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IG1vZEluZm8/Lk1vZHVsZT8uW2VsZW1lbnROYW1lXTtcbiAgICAgICAgcmV0dXJuICgoZWxlbWVudCAhPT0gdW5kZWZpbmVkKSAmJiAoZWxlbWVudD8uWzBdPy4kPy52YWx1ZSAhPT0gdW5kZWZpbmVkKSlcbiAgICAgICAgICA/IFByb21pc2UucmVzb2x2ZShlbGVtZW50Py5bMF0/LiQ/LnZhbHVlKVxuICAgICAgICAgIDogbG9nQW5kQ29udGludWUoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSAnVm9ydGV4IHdhcyB1bmFibGUgdG8gcGFyc2U6ICcgKyBzdWJNb2R1bGVGaWxlUGF0aCArICc7IHBsZWFzZSBpbmZvcm0gdGhlIG1vZCBhdXRob3InO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoZXJyb3JNZXNzYWdlKSk7XG4gICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWZyZXNoR2FtZVBhcmFtcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgbG9hZE9yZGVyOiBJTG9hZE9yZGVyKSB7XG4gIGNvbnN0IExBVU5DSEVSX0RBVEEgPSBnZXRMYXVuY2hlckRhdGEoKTtcbiAgLy8gR28gdGhyb3VnaCB0aGUgZW5hYmxlZCBlbnRyaWVzIHNvIHdlIGNhbiBmb3JtIG91ciBnYW1lIHBhcmFtZXRlcnMuXG4gIGNvbnN0IGVuYWJsZWQgPSAoISFsb2FkT3JkZXIgJiYgT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGggPiAwKVxuICAgID8gT2JqZWN0LmtleXMobG9hZE9yZGVyKVxuICAgICAgICAuZmlsdGVyKGtleSA9PiBsb2FkT3JkZXJba2V5XS5lbmFibGVkKVxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IGxvYWRPcmRlcltsaHNdLnBvcyAtIGxvYWRPcmRlcltyaHNdLnBvcylcbiAgICAgICAgLnJlZHVjZSgoYWNjdW0sIGtleSkgPT4ge1xuICAgICAgICAgIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcbiAgICAgICAgICBjb25zdCBjYWNoZUtleXMgPSBPYmplY3Qua2V5cyhDQUNIRSk7XG4gICAgICAgICAgY29uc3QgZW50cnkgPSBjYWNoZUtleXMuZmluZChjYWNoZUVsZW1lbnQgPT4gQ0FDSEVbY2FjaGVFbGVtZW50XS52b3J0ZXhJZCA9PT0ga2V5KTtcbiAgICAgICAgICBpZiAoISFlbnRyeSkge1xuICAgICAgICAgICAgYWNjdW0ucHVzaChlbnRyeSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBhY2N1bTtcbiAgICAgICAgfSwgW10pXG4gICAgOiBMQVVOQ0hFUl9EQVRBLnNpbmdsZVBsYXllclN1Yk1vZHNcbiAgICAgICAgLmZpbHRlcihzdWJNb2QgPT4gc3ViTW9kLmVuYWJsZWQpXG4gICAgICAgIC5tYXAoc3ViTW9kID0+IHN1Yk1vZC5zdWJNb2RJZCk7XG5cbiAgLy8gQ3VycmVudGx5IFNpbmdsZXBsYXllciBvbmx5ISAobW9yZSByZXNlYXJjaCBpbnRvIE1QIG5lZWRzIHRvIGJlIGRvbmUpXG4gIGNvbnN0IHBhcmFtZXRlcnMgPSBbXG4gICAgUEFSQU1TX1RFTVBMQVRFWzBdLnJlcGxhY2UoJ3t7Z2FtZU1vZGV9fScsICdzaW5nbGVwbGF5ZXInKSxcbiAgICBQQVJBTVNfVEVNUExBVEVbMV0ucmVwbGFjZSgne3tzdWJNb2RJZHN9fScsIGVuYWJsZWQubWFwKGtleSA9PiBgKiR7a2V5fWApLmpvaW4oJycpKSxcbiAgXTtcblxuICAvLyBUaGlzIGxhdW5jaGVyIHdpbGwgbm90IGZ1bmN0aW9uIHVubGVzcyB0aGUgcGF0aCBpcyBndWFyYW50ZWVkIHRvIHBvaW50XG4gIC8vICB0b3dhcmRzIHRoZSBiYW5uZXJsb3JkIGV4ZWN1dGFibGUuIEdpdmVuIHRoYXQgZWFybGllciB2ZXJzaW9ucyBvZiB0aGlzXG4gIC8vICBleHRlbnNpb24gaGFkIHRhcmdldGVkIFRhbGVXb3JsZHMuTGF1bmNoZXIuZXhlIGluc3RlYWQgLSB3ZSBuZWVkIHRvIG1ha2VcbiAgLy8gIHN1cmUgdGhpcyBpcyBzZXQgY29ycmVjdGx5LlxuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldEdhbWVQYXJhbWV0ZXJzKEdBTUVfSUQsIHtcbiAgICBleGVjdXRhYmxlOiBCQU5ORVJMT1JEX0VYRUMsXG4gICAgcGFyYW1ldGVycyxcbiAgfSkpO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENsZWFuVmVyc2lvbihzdWJNb2RJZDogc3RyaW5nLCB1bnNhbml0aXplZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCF1bnNhbml0aXplZCkge1xuICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIHNhbml0aXplL2NvZXJjZSB2ZXJzaW9uJywgeyBzdWJNb2RJZCwgdW5zYW5pdGl6ZWQgfSk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICB0cnkge1xuICAgIGNvbnN0IHNhbml0aXplZCA9IHVuc2FuaXRpemVkLnJlcGxhY2UoL1thLXpdfFtBLVpdL2csICcnKTtcbiAgICBjb25zdCBjb2VyY2VkID0gc2VtdmVyLmNvZXJjZShzYW5pdGl6ZWQpO1xuICAgIHJldHVybiBjb2VyY2VkLnZlcnNpb247XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZygnZGVidWcnLCAnZmFpbGVkIHRvIHNhbml0aXplL2NvZXJjZSB2ZXJzaW9uJyxcbiAgICAgIHsgc3ViTW9kSWQsIHVuc2FuaXRpemVkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSk7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2Fsa0FzeW5jKGRpciwgbGV2ZWxzRGVlcCA9IDIpIHtcbiAgbGV0IGVudHJpZXMgPSBbXTtcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhkaXIpLnRoZW4oZmlsZXMgPT4ge1xuICAgIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgoJy52b3J0ZXhfYmFja3VwJykpO1xuICAgIHJldHVybiBCbHVlYmlyZC5lYWNoKGZpbHRlcmVkLCBmaWxlID0+IHtcbiAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKGRpciwgZmlsZSk7XG4gICAgICByZXR1cm4gZnMuc3RhdEFzeW5jKGZ1bGxQYXRoKS50aGVuKHN0YXRzID0+IHtcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkgJiYgbGV2ZWxzRGVlcCA+IDApIHtcbiAgICAgICAgICByZXR1cm4gd2Fsa0FzeW5jKGZ1bGxQYXRoLCBsZXZlbHNEZWVwIC0gMSlcbiAgICAgICAgICAgIC50aGVuKG5lc3RlZEZpbGVzID0+IHtcbiAgICAgICAgICAgICAgZW50cmllcyA9IGVudHJpZXMuY29uY2F0KG5lc3RlZEZpbGVzKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZW50cmllcy5wdXNoKGZ1bGxQYXRoKTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSB2YWxpZCB1c2UgY2FzZSwgcGFydGljdWxhcmx5IGlmIHRoZSBmaWxlXG4gICAgICAgIC8vICBpcyBkZXBsb3llZCBieSBWb3J0ZXggdXNpbmcgc3ltbGlua3MsIGFuZCB0aGUgbW9kIGRvZXNcbiAgICAgICAgLy8gIG5vdCBleGlzdCB3aXRoaW4gdGhlIHN0YWdpbmcgZm9sZGVyLlxuICAgICAgICBsb2coJ2Vycm9yJywgJ01uQjI6IGludmFsaWQgc3ltbGluaycsIGVycik7XG4gICAgICAgIHJldHVybiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgICA6IFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSlcbiAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXMpKTtcbn1cbiJdfQ==