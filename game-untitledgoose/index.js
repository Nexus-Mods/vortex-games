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
            (0, vortex_api_1.log)('warn', 'failed to write BIX config', err);
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
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate020)(context, old)));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQWtEO0FBRWxELDZDQUEwQztBQUMxQyx1Q0FBaUQ7QUFDakQsaUNBQWdDO0FBRWhDLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQztBQUNqQyxTQUFTLGVBQWUsQ0FBQyxTQUFpQztJQUN4RCxNQUFNLEdBQUcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM3QyxNQUFNLElBQUksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN4RSxPQUFPLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNuQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDWCxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ3pCLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDaEQ7UUFFRCxPQUFPLGtCQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsU0FBUyxnQkFBZ0I7SUFDdkIsT0FBTyxpQkFBSSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxxQkFBVyxDQUFDO1NBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDaEIsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUscUJBQVcsRUFBRTtRQUM1QyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkIsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMscUJBQVcsQ0FBQztTQUNuRCxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVELFNBQVMsT0FBTztJQUNkLE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsU0FBaUM7SUFDMUQsSUFBSSxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxFQUFFO1FBQ2pDLE9BQU8sa0JBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7S0FDekU7SUFFRCxPQUFPLGVBQWUsQ0FBQyxTQUFTLENBQUM7U0FDOUIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1RixDQUFDO0FBRUQsU0FBUyxJQUFJLENBQUMsT0FBZ0M7SUFDNUMsT0FBTyxDQUFDLFlBQVksQ0FBQztRQUNuQixFQUFFLEVBQUUsaUJBQU87UUFDWCxJQUFJLEVBQUUscUJBQXFCO1FBQzNCLFNBQVMsRUFBRSxJQUFJO1FBQ2YsU0FBUyxFQUFFLFFBQVE7UUFDbkIsWUFBWSxFQUFFLE9BQU87UUFDckIsZ0JBQWdCO1FBQ2hCLElBQUksRUFBRSxhQUFhO1FBQ25CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO1FBQ2hDLGFBQWEsRUFBRTtZQUNiLGNBQWM7WUFDZCxpQkFBaUI7U0FDbEI7UUFDRCxLQUFLLEVBQUUsaUJBQWlCO0tBQ3pCLENBQUMsQ0FBQztJQUdILE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUEsdUJBQVUsRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRW5FLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ2hCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxLQUFLLFNBQVMsRUFBRTtZQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7Z0JBQzdCLE1BQU0sRUFBRSxpQkFBTztnQkFDZixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6QixjQUFjLEVBQUU7b0JBQ2QsWUFBWSxFQUFFLFNBQVM7b0JBQ3ZCLG1CQUFtQixFQUFFLElBQUk7aUJBQzFCO2FBQ0YsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmcywgbG9nLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBtaWdyYXRlMDIwIH0gZnJvbSAnLi9taWdyYXRpb25zJztcbmltcG9ydCB7IEVQSUNfQVBQX0lELCBHQU1FX0lEIH0gZnJvbSAnLi9zdGF0aWNzJztcbmltcG9ydCB7IHRvQmx1ZSB9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IEJJWF9DT05GSUcgPSAnQmVwSW5FeC5jZmcnO1xuZnVuY3Rpb24gZW5zdXJlQklYQ29uZmlnKGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCk6IEJsdWViaXJkPHZvaWQ+IHtcbiAgY29uc3Qgc3JjID0gcGF0aC5qb2luKF9fZGlybmFtZSwgQklYX0NPTkZJRyk7XG4gIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdCZXBJbkV4JywgJ2NvbmZpZycsIEJJWF9DT05GSUcpO1xuICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZGVzdCkpXG4gICAgLnRoZW4oKCkgPT4gZnMuY29weUFzeW5jKHNyYywgZGVzdCkpXG4gICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICBpZiAoZXJyLmNvZGUgIT09ICdFRVhJU1QnKSB7XG4gICAgICAgIGxvZygnd2FybicsICdmYWlsZWQgdG8gd3JpdGUgQklYIGNvbmZpZycsIGVycik7XG4gICAgICB9XG4gICAgICAvLyBub3AgLSB0aGlzIGlzIGEgbmljZSB0byBoYXZlLCBub3QgYSBtdXN0LlxuICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcmVxdWlyZXNMYXVuY2hlcigpIHtcbiAgcmV0dXJuIHV0aWwuZXBpY0dhbWVzTGF1bmNoZXIuaXNHYW1lSW5zdGFsbGVkKEVQSUNfQVBQX0lEKVxuICAgIC50aGVuKGVwaWMgPT4gZXBpY1xuICAgICAgPyB7IGxhdW5jaGVyOiAnZXBpYycsIGFkZEluZm86IEVQSUNfQVBQX0lEIH1cbiAgICAgIDogdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XG4gIHJldHVybiB1dGlsLmVwaWNHYW1lc0xhdW5jaGVyLmZpbmRCeUFwcElkKEVQSUNfQVBQX0lEKVxuICAgIC50aGVuKGVwaWNFbnRyeSA9PiBlcGljRW50cnkuZ2FtZVBhdGgpO1xufVxuXG5mdW5jdGlvbiBtb2RQYXRoKCkge1xuICByZXR1cm4gcGF0aC5qb2luKCdCZXBJbkV4JywgJ3BsdWdpbnMnKTtcbn1cblxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBCbHVlYmlyZC5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHYW1lIG5vdCBkaXNjb3ZlcmVkJykpO1xuICB9XG5cbiAgcmV0dXJuIGVuc3VyZUJJWENvbmZpZyhkaXNjb3ZlcnkpXG4gICAgLnRoZW4oKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdCZXBJbkV4JywgJ3BsdWdpbnMnKSkpO1xufVxuXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnVW50aXRsZWQgR29vc2UgR2FtZScsXG4gICAgbWVyZ2VNb2RzOiB0cnVlLFxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RQYXRoLFxuICAgIHJlcXVpcmVzTGF1bmNoZXIsXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnVW50aXRsZWQuZXhlJyxcbiAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICAnVW50aXRsZWQuZXhlJyxcbiAgICAgICdVbml0eVBsYXllci5kbGwnLFxuICAgIF0sXG4gICAgc2V0dXA6IHByZXBhcmVGb3JNb2RkaW5nLFxuICB9KTtcblxuICAvLyBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGQgPT4gbWlncmF0ZTAxMChjb250ZXh0LCBvbGQpIGFzIGFueSkpO1xuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGQgPT4gbWlncmF0ZTAyMChjb250ZXh0LCBvbGQpKSk7XG5cbiAgY29udGV4dC5vbmNlKCgpID0+IHtcbiAgICBpZiAoY29udGV4dC5hcGkuZXh0LmJlcGluZXhBZGRHYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnRleHQuYXBpLmV4dC5iZXBpbmV4QWRkR2FtZSh7XG4gICAgICAgIGdhbWVJZDogR0FNRV9JRCxcbiAgICAgICAgYXV0b0Rvd25sb2FkQmVwSW5FeDogdHJ1ZSxcbiAgICAgICAgZG9vcnN0b3BDb25maWc6IHtcbiAgICAgICAgICBkb29yc3RvcFR5cGU6ICdkZWZhdWx0JyxcbiAgICAgICAgICBpZ25vcmVEaXNhYmxlU3dpdGNoOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRlZmF1bHQ6IG1haW4sXG59O1xuIl19