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
exports.testCEMP = void 0;
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
exports.testCEMP = testCEMP;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIsMkNBQXdEO0FBRXhELHFDQUFtRTtBQUVuRSxNQUFNLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztBQUNqQyxTQUFzQixRQUFRLENBQUMsR0FBd0I7O1FBQ3JELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLGNBQWMsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyRCxJQUFJLGNBQWMsS0FBSyxnQkFBTyxFQUFFO1lBQzlCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUNELE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDNUQsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFO1lBQzNCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUVELE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLGVBQUMsT0FBQSxNQUFBLE1BQUEsSUFBSSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxVQUFVLDBDQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsbUJBQVUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUEsRUFBQSxDQUFDLENBQUM7UUFDM0gsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUN2QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFDRCxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMkJBQWtCLENBQUMsQ0FBQztRQUNwRSxJQUFJO1lBQ0YsTUFBTSxXQUFXLEdBQUcsTUFBTSxlQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3pELElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxxQkFBcUIsRUFBRTtnQkFDOUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3BDO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixNQUFNLE1BQU0sR0FBc0I7Z0JBQ2hDLFdBQVcsRUFBRTtvQkFDWCxLQUFLLEVBQUUsdUNBQXVDO29CQUM5QyxJQUFJLEVBQUUsNkdBQTZHOzBCQUM3Ryx1R0FBdUc7MEJBQ3ZHLGdIQUFnSDtvQkFDdEgsT0FBTyxFQUFFO3dCQUNQLE9BQU8sRUFBRSxhQUFhO3FCQUN2QjtpQkFDRjtnQkFDRCxRQUFRLEVBQUUsU0FBUzthQUNwQixDQUFBO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ2hDO0lBQ0gsQ0FBQztDQUFBO0FBdENELDRCQXNDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgSEFMTzFfTUFQU19SRUxQQVRILCBIQUxPX0dBTUVTIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuY29uc3QgTUFQX05VTUJFUl9DT05TVFJBSU5UID0gMjg7XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0Q0VNUChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHR5cGVzLklUZXN0UmVzdWx0PiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBhY3RpdmVHYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gIGlmIChhY3RpdmVHYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBpZiAoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBjZU1vZHMgPSBPYmplY3Qua2V5cyhtb2RzKS5maWx0ZXIobW9kSWQgPT4gbW9kc1ttb2RJZF0/LmF0dHJpYnV0ZXM/LmhhbG9HYW1lcy5pbmNsdWRlcyhIQUxPX0dBTUVTLmhhbG8xLmludGVybmFsSWQpKTtcclxuICBpZiAoY2VNb2RzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuICBjb25zdCBoYWxvMU1hcHNQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBIQUxPMV9NQVBTX1JFTFBBVEgpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBmaWxlRW50cmllcyA9IGF3YWl0IGZzLnJlYWRkaXJBc3luYyhoYWxvMU1hcHNQYXRoKTtcclxuICAgIGlmIChmaWxlRW50cmllcy5sZW5ndGggPCBNQVBfTlVNQkVSX0NPTlNUUkFJTlQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgZW5vdWdoIG1hcHMnKTsgXHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zdCByZXN1bHQ6IHR5cGVzLklUZXN0UmVzdWx0ID0ge1xyXG4gICAgICBkZXNjcmlwdGlvbjoge1xyXG4gICAgICAgIHNob3J0OiAnSGFsbzogQ0UgTXVsdGlwbGF5ZXIgbWFwcyBhcmUgbWlzc2luZycsXHJcbiAgICAgICAgbG9uZzogJ1lvdXIgXCJ7e2RpclBhdGh9fVwiIGZvbGRlciBpcyBlaXRoZXIgbWlzc2luZy9pbmFjY2Vzc2libGUsIG9yIGFwcGVhcnMgdG8gbm90IGNvbnRhaW4gYWxsIHRoZSByZXF1aXJlZCBtYXBzLiAnXHJcbiAgICAgICAgICAgICsgJ1RoaXMgaXMgdXN1YWxseSBhbiBpbmRpY2F0aW9uIHRoYXQgeW91IGRvIG5vdCBoYXZlIEhhbG86IENFIE11bHRpcGxheWVyIGluc3RhbGxlZC4gU29tZSBtb2RzIG1heSBub3QgJ1xyXG4gICAgICAgICAgICArICd3b3JrIHByb3Blcmx5IGR1ZSB0byBhIGJ1ZyBpbiB0aGUgZ2FtZSBlbmdpbmUuIFBsZWFzZSBlbnN1cmUgeW91IGhhdmUgaW5zdGFsbGVkIENFIE1QIHRocm91Z2ggeW91ciBnYW1lIHN0b3JlLicsXHJcbiAgICAgICAgcmVwbGFjZToge1xyXG4gICAgICAgICAgZGlyUGF0aDogaGFsbzFNYXBzUGF0aCxcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XHJcbiAgfVxyXG59Il19