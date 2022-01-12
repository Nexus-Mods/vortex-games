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
const libxmljs_1 = require("libxmljs");
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const subModCache_1 = require("./subModCache");
const PARAMS_TEMPLATE = ['/{{gameMode}}', '_MODULES_{{subModIds}}*_MODULES_'];
function getXMLData(xmlFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return vortex_api_1.fs.readFileAsync(xmlFilePath)
            .then(data => {
            try {
                const xmlData = (0, libxmljs_1.parseXmlString)(data);
                return Promise.resolve(xmlData);
            }
            catch (err) {
                return Promise.reject(new vortex_api_1.util.DataInvalid(err.message));
            }
        })
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
            .then(xmlData => {
            try {
                const modInfo = (0, libxmljs_1.parseXmlString)(xmlData);
                const element = modInfo.get(`//${elementName}`);
                return ((element !== undefined) && (element.attr('value').value() !== undefined))
                    ? Promise.resolve(element.attr('value').value())
                    : logAndContinue();
            }
            catch (err) {
                const errorMessage = 'Vortex was unable to parse: ' + subModuleFilePath + '; please inform the mod author';
                return Promise.reject(new vortex_api_1.util.DataInvalid(errorMessage));
            }
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLHVDQUFtRDtBQUNuRCxnREFBd0I7QUFDeEIsMkNBQXNFO0FBRXRFLHFDQUFvRDtBQUNwRCwrQ0FBMEQ7QUFNMUQsTUFBTSxlQUFlLEdBQUcsQ0FBQyxlQUFlLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztBQUU5RSxTQUFzQixVQUFVLENBQUMsV0FBbUI7O1FBQ2xELE9BQU8sZUFBRSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUM7YUFDakMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ1gsSUFBSTtnQkFDRixNQUFNLE9BQU8sR0FBRyxJQUFBLHlCQUFjLEVBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUNqQztZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2FBQzFEO1FBQ0gsQ0FBQyxDQUFDO2FBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQztZQUNuQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0NBQUE7QUFiRCxnQ0FhQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxHQUF3QixFQUFFLFNBQWtCO0lBQ25FLE1BQU0s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bXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgeyBFbGVtZW50LCBwYXJzZVhtbFN0cmluZyB9IGZyb20gJ2xpYnhtbGpzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEJBTk5FUkxPUkRfRVhFQywgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgZ2V0Q2FjaGUsIGdldExhdW5jaGVyRGF0YSB9IGZyb20gJy4vc3ViTW9kQ2FjaGUnO1xyXG5pbXBvcnQgeyBJTG9hZE9yZGVyLCBJUHJvcHMgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbi8vIFVzZWQgZm9yIHRoZSBcImN1c3RvbSBsYXVuY2hlclwiIHRvb2xzLlxyXG4vLyAgZ2FtZU1vZGU6IHNpbmdsZXBsYXllciBvciBtdWx0aXBsYXllclxyXG4vLyAgc3ViTW9kSWRzOiB0aGUgbW9kIGlkcyB3ZSB3YW50IHRvIGxvYWQgaW50byB0aGUgZ2FtZS5cclxuY29uc3QgUEFSQU1TX1RFTVBMQVRFID0gWycve3tnYW1lTW9kZX19JywgJ19NT0RVTEVTX3t7c3ViTW9kSWRzfX0qX01PRFVMRVNfJ107XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0WE1MRGF0YSh4bWxGaWxlUGF0aDogc3RyaW5nKSB7XHJcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMoeG1sRmlsZVBhdGgpXHJcbiAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB4bWxEYXRhID0gcGFyc2VYbWxTdHJpbmcoZGF0YSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh4bWxEYXRhKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGVyci5tZXNzYWdlKSk7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpXHJcbiAgICAgID8gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuTm90Rm91bmQoeG1sRmlsZVBhdGgpKVxyXG4gICAgICA6IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGVyci5tZXNzYWdlKSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VuUHJvcHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ/OiBzdHJpbmcpOiBJUHJvcHMge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IChwcm9maWxlSWQgIT09IHVuZGVmaW5lZClcclxuICAgID8gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpXHJcbiAgICA6IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuXHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPVxyXG4gICAgdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcblxyXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kcylcclxuICAgIC5maWx0ZXIoaWQgPT4gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnLCBpZCwgJ2VuYWJsZWQnXSwgZmFsc2UpKVxyXG4gICAgLnJlZHVjZSgoYWNjdW0sIGlkKSA9PiB7XHJcbiAgICAgIGFjY3VtW2lkXSA9IG1vZHNbaWRdO1xyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCB7fSk7XHJcblxyXG4gIHJldHVybiB7IHN0YXRlLCBwcm9maWxlLCBkaXNjb3ZlcnksIGVuYWJsZWRNb2RzIH07XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRFbGVtZW50VmFsdWUoc3ViTW9kdWxlRmlsZVBhdGg6IHN0cmluZywgZWxlbWVudE5hbWU6IHN0cmluZykge1xyXG4gIGNvbnN0IGxvZ0FuZENvbnRpbnVlID0gKCkgPT4ge1xyXG4gICAgbG9nKCdlcnJvcicsICdVbmFibGUgdG8gcGFyc2UgeG1sIGVsZW1lbnQnLCBlbGVtZW50TmFtZSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfTtcclxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhzdWJNb2R1bGVGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KVxyXG4gICAgLnRoZW4oeG1sRGF0YSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgbW9kSW5mbyA9IHBhcnNlWG1sU3RyaW5nKHhtbERhdGEpO1xyXG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSBtb2RJbmZvLmdldDxFbGVtZW50PihgLy8ke2VsZW1lbnROYW1lfWApO1xyXG4gICAgICAgIHJldHVybiAoKGVsZW1lbnQgIT09IHVuZGVmaW5lZCkgJiYgKGVsZW1lbnQuYXR0cigndmFsdWUnKS52YWx1ZSgpICE9PSB1bmRlZmluZWQpKVxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoZWxlbWVudC5hdHRyKCd2YWx1ZScpLnZhbHVlKCkpXHJcbiAgICAgICAgICA6IGxvZ0FuZENvbnRpbnVlKCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGNvbnN0IGVycm9yTWVzc2FnZSA9ICdWb3J0ZXggd2FzIHVuYWJsZSB0byBwYXJzZTogJyArIHN1Yk1vZHVsZUZpbGVQYXRoICsgJzsgcGxlYXNlIGluZm9ybSB0aGUgbW9kIGF1dGhvcic7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGVycm9yTWVzc2FnZSkpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZnJlc2hHYW1lUGFyYW1zKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBsb2FkT3JkZXI6IElMb2FkT3JkZXIpIHtcclxuICBjb25zdCBMQVVOQ0hFUl9EQVRBID0gZ2V0TGF1bmNoZXJEYXRhKCk7XHJcbiAgLy8gR28gdGhyb3VnaCB0aGUgZW5hYmxlZCBlbnRyaWVzIHNvIHdlIGNhbiBmb3JtIG91ciBnYW1lIHBhcmFtZXRlcnMuXHJcbiAgY29uc3QgZW5hYmxlZCA9ICghIWxvYWRPcmRlciAmJiBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmxlbmd0aCA+IDApXHJcbiAgICA/IE9iamVjdC5rZXlzKGxvYWRPcmRlcilcclxuICAgICAgICAuZmlsdGVyKGtleSA9PiBsb2FkT3JkZXJba2V5XS5lbmFibGVkKVxyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gbG9hZE9yZGVyW2xoc10ucG9zIC0gbG9hZE9yZGVyW3Joc10ucG9zKVxyXG4gICAgICAgIC5yZWR1Y2UoKGFjY3VtLCBrZXkpID0+IHtcclxuICAgICAgICAgIGNvbnN0IENBQ0hFID0gZ2V0Q2FjaGUoKTtcclxuICAgICAgICAgIGNvbnN0IGNhY2hlS2V5cyA9IE9iamVjdC5rZXlzKENBQ0hFKTtcclxuICAgICAgICAgIGNvbnN0IGVudHJ5ID0gY2FjaGVLZXlzLmZpbmQoY2FjaGVFbGVtZW50ID0+IENBQ0hFW2NhY2hlRWxlbWVudF0udm9ydGV4SWQgPT09IGtleSk7XHJcbiAgICAgICAgICBpZiAoISFlbnRyeSkge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBhY2N1bTtcclxuICAgICAgICB9LCBbXSlcclxuICAgIDogTEFVTkNIRVJfREFUQS5zaW5nbGVQbGF5ZXJTdWJNb2RzXHJcbiAgICAgICAgLmZpbHRlcihzdWJNb2QgPT4gc3ViTW9kLmVuYWJsZWQpXHJcbiAgICAgICAgLm1hcChzdWJNb2QgPT4gc3ViTW9kLnN1Yk1vZElkKTtcclxuXHJcbiAgLy8gQ3VycmVudGx5IFNpbmdsZXBsYXllciBvbmx5ISAobW9yZSByZXNlYXJjaCBpbnRvIE1QIG5lZWRzIHRvIGJlIGRvbmUpXHJcbiAgY29uc3QgcGFyYW1ldGVycyA9IFtcclxuICAgIFBBUkFNU19URU1QTEFURVswXS5yZXBsYWNlKCd7e2dhbWVNb2RlfX0nLCAnc2luZ2xlcGxheWVyJyksXHJcbiAgICBQQVJBTVNfVEVNUExBVEVbMV0ucmVwbGFjZSgne3tzdWJNb2RJZHN9fScsIGVuYWJsZWQubWFwKGtleSA9PiBgKiR7a2V5fWApLmpvaW4oJycpKSxcclxuICBdO1xyXG5cclxuICAvLyBUaGlzIGxhdW5jaGVyIHdpbGwgbm90IGZ1bmN0aW9uIHVubGVzcyB0aGUgcGF0aCBpcyBndWFyYW50ZWVkIHRvIHBvaW50XHJcbiAgLy8gIHRvd2FyZHMgdGhlIGJhbm5lcmxvcmQgZXhlY3V0YWJsZS4gR2l2ZW4gdGhhdCBlYXJsaWVyIHZlcnNpb25zIG9mIHRoaXNcclxuICAvLyAgZXh0ZW5zaW9uIGhhZCB0YXJnZXRlZCBUYWxlV29ybGRzLkxhdW5jaGVyLmV4ZSBpbnN0ZWFkIC0gd2UgbmVlZCB0byBtYWtlXHJcbiAgLy8gIHN1cmUgdGhpcyBpcyBzZXQgY29ycmVjdGx5LlxyXG4gIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0R2FtZVBhcmFtZXRlcnMoR0FNRV9JRCwge1xyXG4gICAgZXhlY3V0YWJsZTogQkFOTkVSTE9SRF9FWEVDLFxyXG4gICAgcGFyYW1ldGVycyxcclxuICB9KSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhbGtBc3luYyhkaXIsIGxldmVsc0RlZXAgPSAyKSB7XHJcbiAgbGV0IGVudHJpZXMgPSBbXTtcclxuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGRpcikudGhlbihmaWxlcyA9PiB7XHJcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKCcudm9ydGV4X2JhY2t1cCcpKTtcclxuICAgIHJldHVybiBCbHVlYmlyZC5lYWNoKGZpbHRlcmVkLCBmaWxlID0+IHtcclxuICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBmaWxlKTtcclxuICAgICAgcmV0dXJuIGZzLnN0YXRBc3luYyhmdWxsUGF0aCkudGhlbihzdGF0cyA9PiB7XHJcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkgJiYgbGV2ZWxzRGVlcCA+IDApIHtcclxuICAgICAgICAgIHJldHVybiB3YWxrQXN5bmMoZnVsbFBhdGgsIGxldmVsc0RlZXAgLSAxKVxyXG4gICAgICAgICAgICAudGhlbihuZXN0ZWRGaWxlcyA9PiB7XHJcbiAgICAgICAgICAgICAgZW50cmllcyA9IGVudHJpZXMuY29uY2F0KG5lc3RlZEZpbGVzKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBlbnRyaWVzLnB1c2goZnVsbFBhdGgpO1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAvLyBUaGlzIGlzIGEgdmFsaWQgdXNlIGNhc2UsIHBhcnRpY3VsYXJseSBpZiB0aGUgZmlsZVxyXG4gICAgICAgIC8vICBpcyBkZXBsb3llZCBieSBWb3J0ZXggdXNpbmcgc3ltbGlua3MsIGFuZCB0aGUgbW9kIGRvZXNcclxuICAgICAgICAvLyAgbm90IGV4aXN0IHdpdGhpbiB0aGUgc3RhZ2luZyBmb2xkZXIuXHJcbiAgICAgICAgbG9nKCdlcnJvcicsICdNbkIyOiBpbnZhbGlkIHN5bWxpbmsnLCBlcnIpO1xyXG4gICAgICAgIHJldHVybiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKVxyXG4gICAgICAgICAgPyBQcm9taXNlLnJlc29sdmUoKVxyXG4gICAgICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pXHJcbiAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXMpKTtcclxufVxyXG4iXX0=