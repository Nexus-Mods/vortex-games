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
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        if (discovery === undefined) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIsMkNBQXdEO0FBRXhELHFDQUF1RDtBQUV2RCxNQUFNLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztBQUNqQyxTQUFzQixRQUFRLENBQUMsR0FBd0I7O1FBQ3JELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQzVELElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUMzQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMkJBQWtCLENBQUMsQ0FBQztRQUNwRSxJQUFJO1lBQ0YsTUFBTSxXQUFXLEdBQUcsTUFBTSxlQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3pELElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxxQkFBcUIsRUFBRTtnQkFDOUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3BDO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixNQUFNLE1BQU0sR0FBc0I7Z0JBQ2hDLFdBQVcsRUFBRTtvQkFDWCxLQUFLLEVBQUUsdUNBQXVDO29CQUM5QyxJQUFJLEVBQUUsNkdBQTZHOzBCQUM3Ryx1R0FBdUc7MEJBQ3ZHLGdIQUFnSDtvQkFDdEgsT0FBTyxFQUFFO3dCQUNQLE9BQU8sRUFBRSxhQUFhO3FCQUN2QjtpQkFDRjtnQkFDRCxRQUFRLEVBQUUsU0FBUzthQUNwQixDQUFBO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ2hDO0lBQ0gsQ0FBQztDQUFBO0FBN0JELDRCQTZCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgSEFMTzFfTUFQU19SRUxQQVRIIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuY29uc3QgTUFQX05VTUJFUl9DT05TVFJBSU5UID0gMjg7XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0Q0VNUChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHR5cGVzLklUZXN0UmVzdWx0PiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBpZiAoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGhhbG8xTWFwc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIEhBTE8xX01BUFNfUkVMUEFUSCk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGZpbGVFbnRyaWVzID0gYXdhaXQgZnMucmVhZGRpckFzeW5jKGhhbG8xTWFwc1BhdGgpO1xyXG4gICAgaWYgKGZpbGVFbnRyaWVzLmxlbmd0aCA8IE1BUF9OVU1CRVJfQ09OU1RSQUlOVCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBlbm91Z2ggbWFwcycpOyBcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnN0IHJlc3VsdDogdHlwZXMuSVRlc3RSZXN1bHQgPSB7XHJcbiAgICAgIGRlc2NyaXB0aW9uOiB7XHJcbiAgICAgICAgc2hvcnQ6ICdIYWxvOiBDRSBNdWx0aXBsYXllciBtYXBzIGFyZSBtaXNzaW5nJyxcclxuICAgICAgICBsb25nOiAnWW91ciBcInt7ZGlyUGF0aH19XCIgZm9sZGVyIGlzIGVpdGhlciBtaXNzaW5nL2luYWNjZXNzaWJsZSwgb3IgYXBwZWFycyB0byBub3QgY29udGFpbiBhbGwgdGhlIHJlcXVpcmVkIG1hcHMuICdcclxuICAgICAgICAgICAgKyAnVGhpcyBpcyB1c3VhbGx5IGFuIGluZGljYXRpb24gdGhhdCB5b3UgZG8gbm90IGhhdmUgSGFsbzogQ0UgTXVsdGlwbGF5ZXIgaW5zdGFsbGVkLiBTb21lIG1vZHMgbWF5IG5vdCAnXHJcbiAgICAgICAgICAgICsgJ3dvcmsgcHJvcGVybHkgZHVlIHRvIGEgYnVnIGluIHRoZSBnYW1lIGVuZ2luZS4gUGxlYXNlIGVuc3VyZSB5b3UgaGF2ZSBpbnN0YWxsZWQgQ0UgTVAgdGhyb3VnaCB5b3VyIGdhbWUgc3RvcmUuJyxcclxuICAgICAgICByZXBsYWNlOiB7XHJcbiAgICAgICAgICBkaXJQYXRoOiBoYWxvMU1hcHNQYXRoLFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0KTtcclxuICB9XHJcbn0iXX0=