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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestLSLibMod = exports.getLatestInstalledLSLibVer = exports.forceRefresh = exports.logDebug = exports.logError = exports.globalProfilePath = exports.profilesPath = exports.modsPath = exports.documentsPath = exports.getGameDataPath = exports.getGamePath = void 0;
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
function getGamePath(api) {
    var _a, _b;
    const state = api.getState();
    return (_b = (_a = state.settings.gameMode.discovered) === null || _a === void 0 ? void 0 : _a[common_1.GAME_ID]) === null || _b === void 0 ? void 0 : _b.path;
}
exports.getGamePath = getGamePath;
function getGameDataPath(api) {
    var _a, _b;
    const state = api.getState();
    const gamePath = (_b = (_a = state.settings.gameMode.discovered) === null || _a === void 0 ? void 0 : _a[common_1.GAME_ID]) === null || _b === void 0 ? void 0 : _b.path;
    if (gamePath !== undefined) {
        return path.join(gamePath, 'Data');
    }
    else {
        return undefined;
    }
}
exports.getGameDataPath = getGameDataPath;
function documentsPath() {
    return path.join(vortex_api_1.util.getVortexPath('localAppData'), 'Larian Studios', 'Baldur\'s Gate 3');
}
exports.documentsPath = documentsPath;
function modsPath() {
    return path.join(documentsPath(), 'Mods');
}
exports.modsPath = modsPath;
function profilesPath() {
    return path.join(documentsPath(), 'PlayerProfiles');
}
exports.profilesPath = profilesPath;
function globalProfilePath() {
    return path.join(documentsPath(), 'global');
}
exports.globalProfilePath = globalProfilePath;
const resolveMeta = (metadata) => {
    return (metadata !== undefined)
        ? typeof metadata === 'string'
            ? metadata
            : JSON.stringify(metadata)
        : undefined;
};
function logError(message, metadata) {
    const meta = resolveMeta(metadata);
    (0, vortex_api_1.log)('debug', message, meta);
}
exports.logError = logError;
function logDebug(message, metadata) {
    if (common_1.DEBUG) {
        const meta = resolveMeta(metadata);
        (0, vortex_api_1.log)('debug', message, meta);
    }
}
exports.logDebug = logDebug;
function forceRefresh(api) {
    const state = api.getState();
    const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
    const action = {
        type: 'SET_FB_FORCE_UPDATE',
        payload: {
            profileId,
        },
    };
    api.store.dispatch(action);
}
exports.forceRefresh = forceRefresh;
function getLatestInstalledLSLibVer(api) {
    const state = api.getState();
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    return Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === 'bg3-lslib-divine-tool') {
            const arcId = mods[id].archiveId;
            const dl = vortex_api_1.util.getSafe(state, ['persistent', 'downloads', 'files', arcId], undefined);
            const storedVer = vortex_api_1.util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
            try {
                if (semver.gt(storedVer, prev)) {
                    prev = storedVer;
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'invalid version stored for lslib mod', { id, version: storedVer });
            }
            if (dl !== undefined) {
                const fileName = path.basename(dl.localPath, path.extname(dl.localPath));
                const idx = fileName.indexOf('-v');
                try {
                    const ver = semver.coerce(fileName.slice(idx + 2)).version;
                    if (semver.valid(ver) && ver !== storedVer) {
                        api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', ver));
                        prev = ver;
                    }
                }
                catch (err) {
                    api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', '1.0.0'));
                    prev = '1.0.0';
                }
            }
        }
        return prev;
    }, '0.0.0');
}
exports.getLatestInstalledLSLibVer = getLatestInstalledLSLibVer;
function getLatestLSLibMod(api) {
    const state = api.getState();
    const mods = state.persistent.mods[common_1.GAME_ID];
    if (mods === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    const lsLib = Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === common_1.MOD_TYPE_LSLIB) {
            const latestVer = vortex_api_1.util.getSafe(prev, ['attributes', 'version'], '0.0.0');
            const currentVer = vortex_api_1.util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
            try {
                if (semver.gt(currentVer, latestVer)) {
                    prev = mods[id];
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'invalid mod version', { modId: id, version: currentVer });
            }
        }
        return prev;
    }, undefined);
    if (lsLib === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    return lsLib;
}
exports.getLatestLSLibMod = getLatestLSLibMod;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBNkI7QUFDN0IsK0NBQWlDO0FBQ2pDLDJDQUFrRTtBQUNsRSxxQ0FBMEQ7QUFFMUQsU0FBZ0IsV0FBVyxDQUFDLEdBQUc7O0lBQzdCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixPQUFPLE1BQUEsTUFBQSxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLDBDQUFHLGdCQUFPLENBQUMsMENBQUUsSUFBYyxDQUFDO0FBQ3ZFLENBQUM7QUFIRCxrQ0FHQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxHQUFHOztJQUNqQyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxRQUFRLEdBQUcsTUFBQSxNQUFBLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsMENBQUcsZ0JBQU8sQ0FBQywwQ0FBRSxJQUFJLENBQUM7SUFDckUsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO1FBQzFCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDcEM7U0FBTTtRQUNMLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQztBQVJELDBDQVFDO0FBRUQsU0FBZ0IsYUFBYTtJQUMzQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLEVBQUUsZ0JBQWdCLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztBQUM3RixDQUFDO0FBRkQsc0NBRUM7QUFFRCxTQUFnQixRQUFRO0lBQ3RCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRkQsNEJB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SSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3ZCLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUN0QyxPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQTVCRCw4Q0E0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgYWN0aW9ucywgdHlwZXMsIHNlbGVjdG9ycywgbG9nLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IERFQlVHLCBNT0RfVFlQRV9MU0xJQiwgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRHYW1lUGF0aChhcGkpOiBzdHJpbmcge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgcmV0dXJuIHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWQ/LltHQU1FX0lEXT8ucGF0aCBhcyBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRHYW1lRGF0YVBhdGgoYXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBnYW1lUGF0aCA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWQ/LltHQU1FX0lEXT8ucGF0aDtcclxuICBpZiAoZ2FtZVBhdGggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIHBhdGguam9pbihnYW1lUGF0aCwgJ0RhdGEnKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBkb2N1bWVudHNQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdsb2NhbEFwcERhdGEnKSwgJ0xhcmlhbiBTdHVkaW9zJywgJ0JhbGR1clxcJ3MgR2F0ZSAzJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtb2RzUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ01vZHMnKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHByb2ZpbGVzUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ1BsYXllclByb2ZpbGVzJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnbG9iYWxQcm9maWxlUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKGRvY3VtZW50c1BhdGgoKSwgJ2dsb2JhbCcpO1xyXG59XHJcblxyXG5jb25zdCByZXNvbHZlTWV0YSA9IChtZXRhZGF0YT86IGFueSkgPT4ge1xyXG4gIHJldHVybiAobWV0YWRhdGEgIT09IHVuZGVmaW5lZClcclxuICAgID8gdHlwZW9mIG1ldGFkYXRhID09PSAnc3RyaW5nJ1xyXG4gICAgICA/IG1ldGFkYXRhXHJcbiAgICAgIDogSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEpXHJcbiAgICA6IHVuZGVmaW5lZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvZ0Vycm9yKG1lc3NhZ2U6IHN0cmluZywgbWV0YWRhdGE/OiBhbnkpIHtcclxuICBjb25zdCBtZXRhID0gcmVzb2x2ZU1ldGEobWV0YWRhdGEpO1xyXG4gICAgbG9nKCdkZWJ1ZycsIG1lc3NhZ2UsIG1ldGEpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbG9nRGVidWcobWVzc2FnZTogc3RyaW5nLCBtZXRhZGF0YT86IGFueSkge1xyXG4gIGlmIChERUJVRykge1xyXG4gICAgLy8gc28gbWV0YVxyXG4gICAgY29uc3QgbWV0YSA9IHJlc29sdmVNZXRhKG1ldGFkYXRhKTtcclxuICAgIGxvZygnZGVidWcnLCBtZXNzYWdlLCBtZXRhKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmb3JjZVJlZnJlc2goYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBhY3Rpb24gPSB7XHJcbiAgICB0eXBlOiAnU0VUX0ZCX0ZPUkNFX1VQREFURScsXHJcbiAgICBwYXlsb2FkOiB7XHJcbiAgICAgIHByb2ZpbGVJZCxcclxuICAgIH0sXHJcbiAgfTtcclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9uKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldExhdGVzdEluc3RhbGxlZExTTGliVmVyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9XHJcbiAgICB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG1vZHMpLnJlZHVjZSgocHJldiwgaWQpID0+IHtcclxuICAgIGlmIChtb2RzW2lkXS50eXBlID09PSAnYmczLWxzbGliLWRpdmluZS10b29sJykge1xyXG4gICAgICBjb25zdCBhcmNJZCA9IG1vZHNbaWRdLmFyY2hpdmVJZDtcclxuICAgICAgY29uc3QgZGw6IHR5cGVzLklEb3dubG9hZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgICAgICBbJ3BlcnNpc3RlbnQnLCAnZG93bmxvYWRzJywgJ2ZpbGVzJywgYXJjSWRdLCB1bmRlZmluZWQpO1xyXG4gICAgICBjb25zdCBzdG9yZWRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBpZiAoc2VtdmVyLmd0KHN0b3JlZFZlciwgcHJldikpIHtcclxuICAgICAgICAgIHByZXYgPSBzdG9yZWRWZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBsb2coJ3dhcm4nLCAnaW52YWxpZCB2ZXJzaW9uIHN0b3JlZCBmb3IgbHNsaWIgbW9kJywgeyBpZCwgdmVyc2lvbjogc3RvcmVkVmVyIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoZGwgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIFRoZSBMU0xpYiBkZXZlbG9wZXIgZG9lc24ndCBhbHdheXMgdXBkYXRlIHRoZSB2ZXJzaW9uIG9uIHRoZSBleGVjdXRhYmxlXHJcbiAgICAgICAgLy8gIGl0c2VsZiAtIHdlJ3JlIGdvaW5nIHRvIHRyeSB0byBleHRyYWN0IGl0IGZyb20gdGhlIGFyY2hpdmUgd2hpY2ggdGVuZHNcclxuICAgICAgICAvLyAgdG8gdXNlIHRoZSBjb3JyZWN0IHZlcnNpb24uXHJcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGRsLmxvY2FsUGF0aCwgcGF0aC5leHRuYW1lKGRsLmxvY2FsUGF0aCkpO1xyXG4gICAgICAgIGNvbnN0IGlkeCA9IGZpbGVOYW1lLmluZGV4T2YoJy12Jyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGNvbnN0IHZlciA9IHNlbXZlci5jb2VyY2UoZmlsZU5hbWUuc2xpY2UoaWR4ICsgMikpLnZlcnNpb247XHJcbiAgICAgICAgICBpZiAoc2VtdmVyLnZhbGlkKHZlcikgJiYgdmVyICE9PSBzdG9yZWRWZXIpIHtcclxuICAgICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGlkLCAndmVyc2lvbicsIHZlcikpO1xyXG4gICAgICAgICAgICBwcmV2ID0gdmVyO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgLy8gV2UgZmFpbGVkIHRvIGdldCB0aGUgdmVyc2lvbi4uLiBPaCB3ZWxsLi4gU2V0IGEgYm9ndXMgdmVyc2lvbiBzaW5jZVxyXG4gICAgICAgICAgLy8gIHdlIGNsZWFybHkgaGF2ZSBsc2xpYiBpbnN0YWxsZWQgLSB0aGUgdXBkYXRlIGZ1bmN0aW9uYWxpdHkgc2hvdWxkIHRha2VcclxuICAgICAgICAgIC8vICBjYXJlIG9mIHRoZSByZXN0ICh3aGVuIHRoZSB1c2VyIGNsaWNrcyB0aGUgY2hlY2sgZm9yIHVwZGF0ZXMgYnV0dG9uKVxyXG4gICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKEdBTUVfSUQsIGlkLCAndmVyc2lvbicsICcxLjAuMCcpKTtcclxuICAgICAgICAgIHByZXYgPSAnMS4wLjAnO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByZXY7XHJcbiAgfSwgJzAuMC4wJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXRlc3RMU0xpYk1vZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSBzdGF0ZS5wZXJzaXN0ZW50Lm1vZHNbR0FNRV9JRF07XHJcbiAgaWYgKG1vZHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgbG9nKCd3YXJuJywgJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKTtcclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgfVxyXG4gIGNvbnN0IGxzTGliOiB0eXBlcy5JTW9kID0gT2JqZWN0LmtleXMobW9kcykucmVkdWNlKChwcmV2OiB0eXBlcy5JTW9kLCBpZDogc3RyaW5nKSA9PiB7XHJcbiAgICBpZiAobW9kc1tpZF0udHlwZSA9PT0gTU9EX1RZUEVfTFNMSUIpIHtcclxuICAgICAgY29uc3QgbGF0ZXN0VmVyID0gdXRpbC5nZXRTYWZlKHByZXYsIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xyXG4gICAgICBjb25zdCBjdXJyZW50VmVyID0gdXRpbC5nZXRTYWZlKG1vZHNbaWRdLCBbJ2F0dHJpYnV0ZXMnLCAndmVyc2lvbiddLCAnMC4wLjAnKTtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBpZiAoc2VtdmVyLmd0KGN1cnJlbnRWZXIsIGxhdGVzdFZlcikpIHtcclxuICAgICAgICAgIHByZXYgPSBtb2RzW2lkXTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIGxvZygnd2FybicsICdpbnZhbGlkIG1vZCB2ZXJzaW9uJywgeyBtb2RJZDogaWQsIHZlcnNpb246IGN1cnJlbnRWZXIgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBwcmV2O1xyXG4gIH0sIHVuZGVmaW5lZCk7XHJcblxyXG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICBsb2coJ3dhcm4nLCAnTFNMaWIgaXMgbm90IGluc3RhbGxlZCcpO1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHJldHVybiBsc0xpYjtcclxufSJdfQ==