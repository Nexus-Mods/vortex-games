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
exports.testCEMP = testCEMP;
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const MAP_NUMBER_CONSTRAINT = 28;
function testCEMP(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const activeGameMode = vortex_api_1.selectors.activeGameId(state);
        if (activeGameMode !== common_1.GAME_ID) {
            return Promise.resolve(undefined);
        }
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        if (discovery === undefined) {
            return Promise.resolve(undefined);
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const ceMods = Object.keys(mods).filter(modId => { var _a, _b; return (_b = (_a = mods[modId]) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.haloGames.includes(common_1.HALO_GAMES.halo1.internalId); });
        if (ceMods.length === 0) {
            return Promise.resolve(undefined);
        }
        const halo1MapsPath = path_1.default.join(discovery.path, common_1.HALO1_MAPS_RELPATH);
        try {
            const fileEntries = yield vortex_api_1.fs.readdirAsync(halo1MapsPath);
            if (fileEntries.length < MAP_NUMBER_CONSTRAINT) {
                throw new Error('Not enough maps');
            }
            return Promise.resolve(undefined);
        }
        catch (err) {
            const result = {
                description: {
                    short: 'Halo: CE Multiplayer maps are missing',
                    long: 'Your "{{dirPath}}" folder is either missing/inaccessible, or appears to not contain all the required maps. '
                        + 'This is usually an indication that you do not have Halo: CE Multiplayer installed. Some mods may not '
                        + 'work properly due to a bug in the game engine. Please ensure you have installed CE MP through your game store.',
                    replace: {
                        dirPath: halo1MapsPath,
                    }
                },
                severity: 'warning',
            };
            return Promise.resolve(result);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQU9BLDRCQXNDQztBQTVDRCxnREFBd0I7QUFDeEIsMkNBQXdEO0FBRXhELHFDQUFtRTtBQUVuRSxNQUFNLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztBQUNqQyxTQUFzQixRQUFRLENBQUMsR0FBd0I7O1FBQ3JELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLGNBQWMsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyRCxJQUFJLGNBQWMsS0FBSyxnQkFBTyxFQUFFLENBQUM7WUFDL0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDRCxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQzVELElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzVCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsZUFBQyxPQUFBLE1BQUEsTUFBQSxJQUFJLENBQUMsS0FBSyxDQUFDLDBDQUFFLFVBQVUsMENBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxtQkFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQSxFQUFBLENBQUMsQ0FBQztRQUMzSCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDeEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDRCxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMkJBQWtCLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUM7WUFDSCxNQUFNLFdBQVcsR0FBRyxNQUFNLGVBQUUsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDekQsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLHFCQUFxQixFQUFFLENBQUM7Z0JBQy9DLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNyQyxDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsTUFBTSxNQUFNLEdBQXNCO2dCQUNoQyxXQUFXLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLHVDQUF1QztvQkFDOUMsSUFBSSxFQUFFLDZHQUE2RzswQkFDN0csdUdBQXVHOzBCQUN2RyxnSEFBZ0g7b0JBQ3RILE9BQU8sRUFBRTt3QkFDUCxPQUFPLEVBQUUsYUFBYTtxQkFDdkI7aUJBQ0Y7Z0JBQ0QsUUFBUSxFQUFFLFNBQVM7YUFDcEIsQ0FBQTtZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQyxDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBIQUxPMV9NQVBTX1JFTFBBVEgsIEhBTE9fR0FNRVMgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5jb25zdCBNQVBfTlVNQkVSX0NPTlNUUkFJTlQgPSAyODtcclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RDRU1QKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dHlwZXMuSVRlc3RSZXN1bHQ+IHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGFjdGl2ZUdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgaWYgKGFjdGl2ZUdhbWVNb2RlICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGlmIChkaXNjb3ZlcnkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IGNlTW9kcyA9IE9iamVjdC5rZXlzKG1vZHMpLmZpbHRlcihtb2RJZCA9PiBtb2RzW21vZElkXT8uYXR0cmlidXRlcz8uaGFsb0dhbWVzLmluY2x1ZGVzKEhBTE9fR0FNRVMuaGFsbzEuaW50ZXJuYWxJZCkpO1xyXG4gIGlmIChjZU1vZHMubGVuZ3RoID09PSAwKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG4gIGNvbnN0IGhhbG8xTWFwc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIEhBTE8xX01BUFNfUkVMUEFUSCk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGZpbGVFbnRyaWVzID0gYXdhaXQgZnMucmVhZGRpckFzeW5jKGhhbG8xTWFwc1BhdGgpO1xyXG4gICAgaWYgKGZpbGVFbnRyaWVzLmxlbmd0aCA8IE1BUF9OVU1CRVJfQ09OU1RSQUlOVCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBlbm91Z2ggbWFwcycpOyBcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHJlc3VsdDogdHlwZXMuSVRlc3RSZXN1bHQgPSB7XHJcbiAgICAgIGRlc2NyaXB0aW9uOiB7XHJcbiAgICAgICAgc2hvcnQ6ICdIYWxvOiBDRSBNdWx0aXBsYXllciBtYXBzIGFyZSBtaXNzaW5nJyxcclxuICAgICAgICBsb25nOiAnWW91ciBcInt7ZGlyUGF0aH19XCIgZm9sZGVyIGlzIGVpdGhlciBtaXNzaW5nL2luYWNjZXNzaWJsZSwgb3IgYXBwZWFycyB0byBub3QgY29udGFpbiBhbGwgdGhlIHJlcXVpcmVkIG1hcHMuICdcclxuICAgICAgICAgICAgKyAnVGhpcyBpcyB1c3VhbGx5IGFuIGluZGljYXRpb24gdGhhdCB5b3UgZG8gbm90IGhhdmUgSGFsbzogQ0UgTXVsdGlwbGF5ZXIgaW5zdGFsbGVkLiBTb21lIG1vZHMgbWF5IG5vdCAnXHJcbiAgICAgICAgICAgICsgJ3dvcmsgcHJvcGVybHkgZHVlIHRvIGEgYnVnIGluIHRoZSBnYW1lIGVuZ2luZS4gUGxlYXNlIGVuc3VyZSB5b3UgaGF2ZSBpbnN0YWxsZWQgQ0UgTVAgdGhyb3VnaCB5b3VyIGdhbWUgc3RvcmUuJyxcclxuICAgICAgICByZXBsYWNlOiB7XHJcbiAgICAgICAgICBkaXJQYXRoOiBoYWxvMU1hcHNQYXRoLFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0KTtcclxuICB9XHJcbn0iXX0=