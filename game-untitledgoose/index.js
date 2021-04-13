"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const migrations_1 = require("./migrations");
const statics_1 = require("./statics");
const util_1 = require("./util");
const BIX_CONFIG = 'BepInEx.cfg';
function ensureBIXConfig(discovery) {
    const src = path_1.default.join(__dirname, BIX_CONFIG);
    const dest = path_1.default.join(discovery.path, 'BepInEx', 'config', BIX_CONFIG);
    return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(dest))
        .then(() => vortex_api_1.fs.copyAsync(src, dest))
        .catch(err => {
        if (err.code !== 'EEXIST') {
            vortex_api_1.log('warn', 'failed to write BIX config', err);
        }
        return bluebird_1.default.resolve();
    });
}
function requiresLauncher() {
    return vortex_api_1.util.epicGamesLauncher.isGameInstalled(statics_1.EPIC_APP_ID)
        .then(epic => epic
        ? { launcher: 'epic', addInfo: statics_1.EPIC_APP_ID }
        : undefined);
}
function findGame() {
    return vortex_api_1.util.epicGamesLauncher.findByAppId(statics_1.EPIC_APP_ID)
        .then(epicEntry => epicEntry.gamePath);
}
function modPath() {
    return path_1.default.join('BepInEx', 'plugins');
}
function prepareForModding(discovery) {
    if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
        return bluebird_1.default.reject(new vortex_api_1.util.ProcessCanceled('Game not discovered'));
    }
    return ensureBIXConfig(discovery)
        .then(() => vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(discovery.path, 'BepInEx', 'plugins')));
}
function main(context) {
    context.registerGame({
        id: statics_1.GAME_ID,
        name: 'Untitled Goose Game',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: modPath,
        requiresLauncher,
        logo: 'gameart.jpg',
        executable: () => 'Untitled.exe',
        requiredFiles: [
            'Untitled.exe',
            'UnityPlayer.dll',
        ],
        setup: prepareForModding,
    });
    context.registerMigration(util_1.toBlue(old => migrations_1.migrate010(context, old)));
    context.registerMigration(util_1.toBlue(old => migrations_1.migrate020(context, old)));
    context.once(() => {
        if (context.api.ext.bepinexAddGame !== undefined) {
            context.api.ext.bepinexAddGame({
                gameId: statics_1.GAME_ID,
                autoDownloadBepInEx: true,
                doorstopConfig: {
                    doorstopType: 'default',
                    ignoreDisableSwitch: true,
                },
            });
        }
    });
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQWtEO0FBRWxELDZDQUFzRDtBQUN0RCx1Q0FBaUQ7QUFDakQsaUNBQWdDO0FBRWhDLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQztBQUNqQyxTQUFTLGVBQWUsQ0FBQyxTQUFpQztJQUN4RCxNQUFNLEdBQUcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM3QyxNQUFNLElBQUksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN4RSxPQUFPLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNuQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDWCxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ3pCLGdCQUFHLENBQUMsTUFBTSxFQUFFLDRCQUE0QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ2hEO1FBRUQsT0FBTyxrQkFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVELFNBQVMsZ0JBQWdCO0lBQ3ZCLE9BQU8saUJBQUksQ0FBQyxpQkFBaUIsQ0FBQyxlQUFlLENBQUMscUJBQVcsQ0FBQztTQUN2RCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ2hCLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLHFCQUFXLEVBQUU7UUFDNUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25CLENBQUM7QUFFRCxTQUFTLFFBQVE7SUFDZixPQUFPLGlCQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLHFCQUFXLENBQUM7U0FDbkQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFFRCxTQUFTLE9BQU87SUFDZCxPQUFPLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3pDLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLFNBQWlDO0lBQzFELElBQUksQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxNQUFLLFNBQVMsRUFBRTtRQUNqQyxPQUFPLGtCQUFRLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxlQUFlLENBQUMscUJBQXFCLENBQUMsQ0FBQyxDQUFDO0tBQ3pFO0lBRUQsT0FBTyxlQUFlLENBQUMsU0FBUyxDQUFDO1NBQzlCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsc0JBQXNCLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUYsQ0FBQztBQUVELFNBQVMsSUFBSSxDQUFDLE9BQWdDO0lBQzVDLE9BQU8sQ0FBQyxZQUFZLENBQUM7UUFDbkIsRUFBRSxFQUFFLGlCQUFPO1FBQ1gsSUFBSSxFQUFFLHFCQUFxQjtRQUMzQixTQUFTLEVBQUUsSUFBSTtRQUNmLFNBQVMsRUFBRSxRQUFRO1FBQ25CLFlBQVksRUFBRSxPQUFPO1FBQ3JCLGdCQUFnQjtRQUNoQixJQUFJLEVBQUUsYUFBYTtRQUNuQixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsY0FBYztRQUNoQyxhQUFhLEVBQUU7WUFDYixjQUFjO1lBQ2QsaUJBQWlCO1NBQ2xCO1FBQ0QsS0FBSyxFQUFFLGlCQUFpQjtLQUN6QixDQUFDLENBQUM7SUFFSCxPQUFPLENBQUMsaUJBQWlCLENBQUMsYUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQVUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzFFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxhQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyx1QkFBVSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFbkUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDaEIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQ2hELE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQztnQkFDN0IsTUFBTSxFQUFFLGlCQUFPO2dCQUNmLG1CQUFtQixFQUFFLElBQUk7Z0JBQ3pCLGNBQWMsRUFBRTtvQkFDZCxZQUFZLEVBQUUsU0FBUztvQkFDdkIsbUJBQW1CLEVBQUUsSUFBSTtpQkFDMUI7YUFDRixDQUFDLENBQUM7U0FDSjtJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgbWlncmF0ZTAxMCwgbWlncmF0ZTAyMCB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcbmltcG9ydCB7IEVQSUNfQVBQX0lELCBHQU1FX0lEIH0gZnJvbSAnLi9zdGF0aWNzJztcclxuaW1wb3J0IHsgdG9CbHVlIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IEJJWF9DT05GSUcgPSAnQmVwSW5FeC5jZmcnO1xyXG5mdW5jdGlvbiBlbnN1cmVCSVhDb25maWcoZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KTogQmx1ZWJpcmQ8dm9pZD4ge1xyXG4gIGNvbnN0IHNyYyA9IHBhdGguam9pbihfX2Rpcm5hbWUsIEJJWF9DT05GSUcpO1xyXG4gIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdCZXBJbkV4JywgJ2NvbmZpZycsIEJJWF9DT05GSUcpO1xyXG4gIHJldHVybiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShkZXN0KSlcclxuICAgIC50aGVuKCgpID0+IGZzLmNvcHlBc3luYyhzcmMsIGRlc3QpKVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGlmIChlcnIuY29kZSAhPT0gJ0VFWElTVCcpIHtcclxuICAgICAgICBsb2coJ3dhcm4nLCAnZmFpbGVkIHRvIHdyaXRlIEJJWCBjb25maWcnLCBlcnIpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIG5vcCAtIHRoaXMgaXMgYSBuaWNlIHRvIGhhdmUsIG5vdCBhIG11c3QuXHJcbiAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKCk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVxdWlyZXNMYXVuY2hlcigpIHtcclxuICByZXR1cm4gdXRpbC5lcGljR2FtZXNMYXVuY2hlci5pc0dhbWVJbnN0YWxsZWQoRVBJQ19BUFBfSUQpXHJcbiAgICAudGhlbihlcGljID0+IGVwaWNcclxuICAgICAgPyB7IGxhdW5jaGVyOiAnZXBpYycsIGFkZEluZm86IEVQSUNfQVBQX0lEIH1cclxuICAgICAgOiB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpIHtcclxuICByZXR1cm4gdXRpbC5lcGljR2FtZXNMYXVuY2hlci5maW5kQnlBcHBJZChFUElDX0FQUF9JRClcclxuICAgIC50aGVuKGVwaWNFbnRyeSA9PiBlcGljRW50cnkuZ2FtZVBhdGgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb2RQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oJ0JlcEluRXgnLCAncGx1Z2lucycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcclxuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHYW1lIG5vdCBkaXNjb3ZlcmVkJykpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGVuc3VyZUJJWENvbmZpZyhkaXNjb3ZlcnkpXHJcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ0JlcEluRXgnLCAncGx1Z2lucycpKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdVbnRpdGxlZCBHb29zZSBHYW1lJyxcclxuICAgIG1lcmdlTW9kczogdHJ1ZSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6IG1vZFBhdGgsXHJcbiAgICByZXF1aXJlc0xhdW5jaGVyLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdVbnRpdGxlZC5leGUnLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnVW50aXRsZWQuZXhlJyxcclxuICAgICAgJ1VuaXR5UGxheWVyLmRsbCcsXHJcbiAgICBdLFxyXG4gICAgc2V0dXA6IHByZXBhcmVGb3JNb2RkaW5nLFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGQgPT4gbWlncmF0ZTAxMChjb250ZXh0LCBvbGQpIGFzIGFueSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24odG9CbHVlKG9sZCA9PiBtaWdyYXRlMDIwKGNvbnRleHQsIG9sZCkpKTtcclxuXHJcbiAgY29udGV4dC5vbmNlKCgpID0+IHtcclxuICAgIGlmIChjb250ZXh0LmFwaS5leHQuYmVwaW5leEFkZEdhbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb250ZXh0LmFwaS5leHQuYmVwaW5leEFkZEdhbWUoe1xyXG4gICAgICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgICAgICBhdXRvRG93bmxvYWRCZXBJbkV4OiB0cnVlLFxyXG4gICAgICAgIGRvb3JzdG9wQ29uZmlnOiB7XHJcbiAgICAgICAgICBkb29yc3RvcFR5cGU6ICdkZWZhdWx0JyxcclxuICAgICAgICAgIGlnbm9yZURpc2FibGVTd2l0Y2g6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=