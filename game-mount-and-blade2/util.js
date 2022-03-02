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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGdEQUF3QjtBQUN4QixvREFBNEI7QUFDNUIsMkNBQXNFO0FBQ3RFLG1DQUE0QztBQUU1QyxxQ0FBb0Q7QUFDcEQsK0NBQTBEO0FBTTFELE1BQU0sZUFBZSxHQUFHLENBQUMsZUFBZSxFQUFFLGtDQUFrQyxDQUFDLENBQUM7QUFFOUUsU0FBc0IsVUFBVSxDQUFDLFdBQW1COztRQUNsRCxPQUFPLGVBQUUsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDO2FBQ2pDLElBQUksQ0FBQyxDQUFNLElBQUksRUFBQyxFQUFFO1lBQ2pCLElBQUk7Z0JBQ0YsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFBLDJCQUFrQixFQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMvQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDakM7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQzthQUMxRDtRQUNILENBQUMsQ0FBQSxDQUFDO2FBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztZQUNuQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0NBQUE7QUFiRCxnQ0FhQztBQUVELFNBQWdCLFFBQVEsQ0FB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LFdBQVcsQ0FBQyxFQUFFOzRCQUNsQixPQUFPLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQzs0QkFDdEMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7d0JBQzNCLENBQUMsQ0FBQyxDQUFDO3FCQUNOO3lCQUFNO3dCQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7d0JBQ3ZCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO3FCQUMxQjtnQkFDSCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBSWIsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDM0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDO3dCQUM1QixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRTt3QkFDbkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzFCLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7YUFDRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FBQTtBQTdCRCw4QkE2QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XHJcblxyXG5pbXBvcnQgeyBCQU5ORVJMT1JEX0VYRUMsIEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IGdldENhY2hlLCBnZXRMYXVuY2hlckRhdGEgfSBmcm9tICcuL3N1Yk1vZENhY2hlJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlciwgSVByb3BzIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG4vLyBVc2VkIGZvciB0aGUgXCJjdXN0b20gbGF1bmNoZXJcIiB0b29scy5cclxuLy8gIGdhbWVNb2RlOiBzaW5nbGVwbGF5ZXIgb3IgbXVsdGlwbGF5ZXJcclxuLy8gIHN1Yk1vZElkczogdGhlIG1vZCBpZHMgd2Ugd2FudCB0byBsb2FkIGludG8gdGhlIGdhbWUuXHJcbmNvbnN0IFBBUkFNU19URU1QTEFURSA9IFsnL3t7Z2FtZU1vZGV9fScsICdfTU9EVUxFU197e3N1Yk1vZElkc319Kl9NT0RVTEVTXyddO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFhNTERhdGEoeG1sRmlsZVBhdGg6IHN0cmluZykge1xyXG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKHhtbEZpbGVQYXRoKVxyXG4gICAgLnRoZW4oYXN5bmMgZGF0YSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgeG1sRGF0YSA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShkYXRhKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHhtbERhdGEpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoZXJyLm1lc3NhZ2UpKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgPyBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Ob3RGb3VuZCh4bWxGaWxlUGF0aCkpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoZXJyLm1lc3NhZ2UpKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZW5Qcm9wcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHByb2ZpbGVJZD86IHN0cmluZyk6IElQcm9wcyB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZClcclxuICAgIDogc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG5cclxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9XHJcbiAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuXHJcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RzKVxyXG4gICAgLmZpbHRlcihpZCA9PiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZScsIGlkLCAnZW5hYmxlZCddLCBmYWxzZSkpXHJcbiAgICAucmVkdWNlKChhY2N1bSwgaWQpID0+IHtcclxuICAgICAgYWNjdW1baWRdID0gbW9kc1tpZF07XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIHsgc3RhdGUsIHByb2ZpbGUsIGRpc2NvdmVyeSwgZW5hYmxlZE1vZHMgfTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEVsZW1lbnRWYWx1ZShzdWJNb2R1bGVGaWxlUGF0aDogc3RyaW5nLCBlbGVtZW50TmFtZTogc3RyaW5nKSB7XHJcbiAgY29uc3QgbG9nQW5kQ29udGludWUgPSAoKSA9PiB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ1VuYWJsZSB0byBwYXJzZSB4bWwgZWxlbWVudCcsIGVsZW1lbnROYW1lKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9O1xyXG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKHN1Yk1vZHVsZUZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pXHJcbiAgICAudGhlbihhc3luYyB4bWxEYXRhID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBtb2RJbmZvID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKHhtbERhdGEpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBtb2RJbmZvPy5Nb2R1bGU/LltlbGVtZW50TmFtZV07XHJcbiAgICAgICAgcmV0dXJuICgoZWxlbWVudCAhPT0gdW5kZWZpbmVkKSAmJiAoZWxlbWVudD8uWzBdPy4kPy52YWx1ZSAhPT0gdW5kZWZpbmVkKSlcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKGVsZW1lbnQ/LlswXT8uJD8udmFsdWUpXHJcbiAgICAgICAgICA6IGxvZ0FuZENvbnRpbnVlKCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9ICdWb3J0ZXggd2FzIHVuYWJsZSB0byBwYXJzZTogJyArIHN1Yk1vZHVsZUZpbGVQYXRoICsgJzsgcGxlYXNlIGluZm9ybSB0aGUgbW9kIGF1dGhvcic7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGVycm9yTWVzc2FnZSkpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBsb2FkT3JkZXI6IElMb2FkT3JkZXIpIHtcclxuICBjb25zdCBMQVVOQ0hFUl9EQVRBID0gZ2V0TGF1bmNoZXJEYXRhKCk7XHJcbiAgLy8gR28gdGhyb3VnaCB0aGUgZW5hYmxlZCBlbnRyaWVzIHNvIHdlIGNhbiBmb3JtIG91ciBnYW1lIHBhcmFtZXRlcnMuXHJcbiAgY29uc3QgZW5hYmxlZCA9ICghIWxvYWRPcmRlciAmJiBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmxlbmd0aCA+IDApXHJcbiAgICA/IE9iamVjdC5rZXlzKGxvYWRPcmRlcilcclxuICAgICAgICAuZmlsdGVyKGtleSA9PiBsb2FkT3JkZXJba2V5XS5lbmFibGVkKVxyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gbG9hZE9yZGVyW2xoc10ucG9zIC0gbG9hZE9yZGVyW3Joc10ucG9zKVxyXG4gICAgICAgIC5yZWR1Y2UoKGFjY3VtLCBrZXkpID0+IHtcclxuICAgICAgICAgIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICAgICAgICAgIGNvbnN0IGNhY2hlS2V5cyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgICAgICAgIGNvbnN0IGVudHJ5ID0gY2FjaGVLZXlzLmZpbmQoY2FjaGVFbGVtZW50ID0+IENBQ0hFW2NhY2hlRWxlbWVudF0udm9ydGV4SWQgPT09IGtleSk7XHJcbiAgICAgICAgICBpZiAoISFlbnRyeSkge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICB9LCBbXSlcclxuICAgIDogTEFVTkNIRVJfREFUQS5zaW5nbGVQbGF5ZXJTdWJNb2RzXHJcbiAgICAgICAgLmZpbHRlcihzdWJNb2QgPT4gc3ViTW9kLmVuYWJsZWQpXHJcbiAgICAgICAgLm1hcChzdWJNb2QgPT4gc3ViTW9kLnN1Yk1vZElkKTtcclxuXHJcbiAgLy8gQ3VycmVudGx5IFNpbmdsZXBsYXllciBvbmx5ISAobW9yZSByZXNlYXJjaCBpbnRvIE1QIG5lZWRzIHRvIGJlIGRvbmUpXHJcbiAgY29uc3QgcGFyYW1ldGVycyA9IFtcclxuICAgIFBBUkFNU19URU1QTEFURVswXS5yZXBsYWNlKCd7e2dhbWVNb2RlfX0nLCAnc2luZ2xlcGxheWVyJyksXHJcbiAgICBQQVJBTVNfVEVNUExBVEVbMV0ucmVwbGFjZSgne3tzdWJNb2RJZHN9fScsIGVuYWJsZWQubWFwKGtleSA9PiBgKiR7a2V5fWApLmpvaW4oJycpKSxcclxuICBdO1xyXG5cclxuICAvLyBUaGlzIGxhdW5jaGVyIHdpbGwgbm90IGZ1bmN0aW9uIHVubGVzcyB0aGUgcGF0aCBpcyBndWFyYW50ZWVkIHRvIHBvaW50XHJcbiAgLy8gIHRvd2FyZHMgdGhlIGJhbm5lcmxvcmQgZXhlY3V0YWJsZS4gR2l2ZW4gdGhhdCBlYXJsaWVyIHZlcnNpb25zIG9mIHRoaXNcclxuICAvLyAgZXh0ZW5zaW9uIGhhZCB0YXJnZXRlZCBUYWxlV29ybGRzLkxhdW5jaGVyLmV4ZSBpbnN0ZWFkIC0gd2UgbmVlZCB0byBtYWtlXHJcbiAgLy8gIHN1cmUgdGhpcyBpcyBzZXQgY29ycmVjdGx5LlxyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0R2FtZVBhcmFtZXRlcnMoR0FNRV9JRCwge1xyXG4gICAgZXhlY3V0YWJsZTogQkFOTkVSTE9SRF9FWEVDLFxyXG4gICAgcGFyYW1ldGVycyxcclxuICB9KSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldENsZWFuVmVyc2lvbihzdWJNb2RJZDogc3RyaW5nLCB1bnNhbml0aXplZDogc3RyaW5nKTogc3RyaW5nIHtcclxuICBpZiAoIXVuc2FuaXRpemVkKSB7XHJcbiAgICBsb2coJ2RlYnVnJywgJ2ZhaWxlZCB0byBzYW5pdGl6ZS9jb2VyY2UgdmVyc2lvbicsIHsgc3ViTW9kSWQsIHVuc2FuaXRpemVkIH0pO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHNhbml0aXplZCA9IHVuc2FuaXRpemVkLnJlcGxhY2UoL1thLXpdfFtBLVpdL2csICcnKTtcclxuICAgIGNvbnN0IGNvZXJjZWQgPSBzZW12ZXIuY29lcmNlKHNhbml0aXplZCk7XHJcbiAgICByZXR1cm4gY29lcmNlZC52ZXJzaW9uO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgbG9nKCdkZWJ1ZycsICdmYWlsZWQgdG8gc2FuaXRpemUvY29lcmNlIHZlcnNpb24nLFxyXG4gICAgICB7IHN1Yk1vZElkLCB1bnNhbml0aXplZCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3YWxrQXN5bmMoZGlyLCBsZXZlbHNEZWVwID0gMikge1xyXG4gIGxldCBlbnRyaWVzID0gW107XHJcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhkaXIpLnRoZW4oZmlsZXMgPT4ge1xyXG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aCgnLnZvcnRleF9iYWNrdXAnKSk7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChmaWx0ZXJlZCwgZmlsZSA9PiB7XHJcbiAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKGRpciwgZmlsZSk7XHJcbiAgICAgIHJldHVybiBmcy5zdGF0QXN5bmMoZnVsbFBhdGgpLnRoZW4oc3RhdHMgPT4ge1xyXG4gICAgICAgIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpICYmIGxldmVsc0RlZXAgPiAwKSB7XHJcbiAgICAgICAgICByZXR1cm4gd2Fsa0FzeW5jKGZ1bGxQYXRoLCBsZXZlbHNEZWVwIC0gMSlcclxuICAgICAgICAgICAgLnRoZW4obmVzdGVkRmlsZXMgPT4ge1xyXG4gICAgICAgICAgICAgIGVudHJpZXMgPSBlbnRyaWVzLmNvbmNhdChuZXN0ZWRGaWxlcyk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZW50cmllcy5wdXNoKGZ1bGxQYXRoKTtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgLy8gVGhpcyBpcyBhIHZhbGlkIHVzZSBjYXNlLCBwYXJ0aWN1bGFybHkgaWYgdGhlIGZpbGVcclxuICAgICAgICAvLyAgaXMgZGVwbG95ZWQgYnkgVm9ydGV4IHVzaW5nIHN5bWxpbmtzLCBhbmQgdGhlIG1vZCBkb2VzXHJcbiAgICAgICAgLy8gIG5vdCBleGlzdCB3aXRoaW4gdGhlIHN0YWdpbmcgZm9sZGVyLlxyXG4gICAgICAgIGxvZygnZXJyb3InLCAnTW5CMjogaW52YWxpZCBzeW1saW5rJywgZXJyKTtcclxuICAgICAgICByZXR1cm4gKGVyci5jb2RlID09PSAnRU5PRU5UJylcclxuICAgICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KVxyXG4gIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShlbnRyaWVzKSk7XHJcbn1cclxuIl19