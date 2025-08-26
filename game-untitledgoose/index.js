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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLHdEQUFnQztBQUNoQyxnREFBd0I7QUFDeEIsMkNBQWtEO0FBRWxELDZDQUEwQztBQUMxQyx1Q0FBaUQ7QUFDakQsaUNBQWdDO0FBRWhDLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQztBQUNqQyxTQUFTLGVBQWUsQ0FBQyxTQUFpQztJQUN4RCxNQUFNLEdBQUcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM3QyxNQUFNLElBQUksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN4RSxPQUFPLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2pELElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNuQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDWCxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQ3pCLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsNEJBQTRCLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDaEQ7UUFFRCxPQUFPLGtCQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBRUQsU0FBUyxnQkFBZ0I7SUFDdkIsT0FBTyxpQkFBSSxDQUFDLGlCQUFpQixDQUFDLGVBQWUsQ0FBQyxxQkFBVyxDQUFDO1NBQ3ZELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDaEIsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUscUJBQVcsRUFBRTtRQUM1QyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDbkIsQ0FBQztBQUVELFNBQVMsUUFBUTtJQUNmLE9BQU8saUJBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMscUJBQVcsQ0FBQztTQUNuRCxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVELFNBQVMsT0FBTztJQUNkLE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsU0FBaUM7SUFDMUQsSUFBSSxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxFQUFFO1FBQ2pDLE9BQU8sa0JBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7S0FDekU7SUFFRCxPQUFPLGVBQWUsQ0FBQyxTQUFTLENBQUM7U0FDOUIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1RixDQUFDO0FBRUQsU0FBUyxJQUFJLENBQUMsT0FBZ0M7SUFDNUMsT0FBTyxDQUFDLFlBQVksQ0FBQztRQUNuQixFQUFFLEVBQUUsaUJBQU87UUFDWCxJQUFJLEVBQUUscUJBQXFCO1FBQzNCLFNBQVMsRUFBRSxJQUFJO1FBQ2YsU0FBUyxFQUFFLFFBQVE7UUFDbkIsWUFBWSxFQUFFLE9BQU87UUFDckIsZ0JBQWdCO1FBQ2hCLElBQUksRUFBRSxhQUFhO1FBQ25CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxjQUFjO1FBQ2hDLGFBQWEsRUFBRTtZQUNiLGNBQWM7WUFDZCxpQkFBaUI7U0FDbEI7UUFDRCxLQUFLLEVBQUUsaUJBQWlCO0tBQ3pCLENBQUMsQ0FBQztJQUdILE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUEsdUJBQVUsRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRW5FLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ2hCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxLQUFLLFNBQVMsRUFBRTtZQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUM7Z0JBQzdCLE1BQU0sRUFBRSxpQkFBTztnQkFDZixtQkFBbUIsRUFBRSxJQUFJO2dCQUN6QixjQUFjLEVBQUU7b0JBQ2QsWUFBWSxFQUFFLFNBQVM7b0JBQ3ZCLG1CQUFtQixFQUFFLElBQUk7aUJBQzFCO2FBQ0YsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgZnMsIGxvZywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IG1pZ3JhdGUwMjAgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5pbXBvcnQgeyBFUElDX0FQUF9JRCwgR0FNRV9JRCB9IGZyb20gJy4vc3RhdGljcyc7XHJcbmltcG9ydCB7IHRvQmx1ZSB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBCSVhfQ09ORklHID0gJ0JlcEluRXguY2ZnJztcclxuZnVuY3Rpb24gZW5zdXJlQklYQ29uZmlnKGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCk6IEJsdWViaXJkPHZvaWQ+IHtcclxuICBjb25zdCBzcmMgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCBCSVhfQ09ORklHKTtcclxuICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnQmVwSW5FeCcsICdjb25maWcnLCBCSVhfQ09ORklHKTtcclxuICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZGVzdCkpXHJcbiAgICAudGhlbigoKSA9PiBmcy5jb3B5QXN5bmMoc3JjLCBkZXN0KSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBpZiAoZXJyLmNvZGUgIT09ICdFRVhJU1QnKSB7XHJcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ZhaWxlZCB0byB3cml0ZSBCSVggY29uZmlnJywgZXJyKTtcclxuICAgICAgfVxyXG4gICAgICAvLyBub3AgLSB0aGlzIGlzIGEgbmljZSB0byBoYXZlLCBub3QgYSBtdXN0LlxyXG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcXVpcmVzTGF1bmNoZXIoKSB7XHJcbiAgcmV0dXJuIHV0aWwuZXBpY0dhbWVzTGF1bmNoZXIuaXNHYW1lSW5zdGFsbGVkKEVQSUNfQVBQX0lEKVxyXG4gICAgLnRoZW4oZXBpYyA9PiBlcGljXHJcbiAgICAgID8geyBsYXVuY2hlcjogJ2VwaWMnLCBhZGRJbmZvOiBFUElDX0FQUF9JRCB9XHJcbiAgICAgIDogdW5kZWZpbmVkKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgcmV0dXJuIHV0aWwuZXBpY0dhbWVzTGF1bmNoZXIuZmluZEJ5QXBwSWQoRVBJQ19BUFBfSUQpXHJcbiAgICAudGhlbihlcGljRW50cnkgPT4gZXBpY0VudHJ5LmdhbWVQYXRoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW9kUGF0aCgpIHtcclxuICByZXR1cm4gcGF0aC5qb2luKCdCZXBJbkV4JywgJ3BsdWdpbnMnKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBub3QgZGlzY292ZXJlZCcpKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBlbnN1cmVCSVhDb25maWcoZGlzY292ZXJ5KVxyXG4gICAgLnRoZW4oKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdCZXBJbkV4JywgJ3BsdWdpbnMnKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnVW50aXRsZWQgR29vc2UgR2FtZScsXHJcbiAgICBtZXJnZU1vZHM6IHRydWUsXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RQYXRoLFxyXG4gICAgcmVxdWlyZXNMYXVuY2hlcixcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoKSA9PiAnVW50aXRsZWQuZXhlJyxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ1VudGl0bGVkLmV4ZScsXHJcbiAgICAgICdVbml0eVBsYXllci5kbGwnLFxyXG4gICAgXSxcclxuICAgIHNldHVwOiBwcmVwYXJlRm9yTW9kZGluZyxcclxuICB9KTtcclxuXHJcbiAgLy8gY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbih0b0JsdWUob2xkID0+IG1pZ3JhdGUwMTAoY29udGV4dCwgb2xkKSBhcyBhbnkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGQgPT4gbWlncmF0ZTAyMChjb250ZXh0LCBvbGQpKSk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBpZiAoY29udGV4dC5hcGkuZXh0LmJlcGluZXhBZGRHYW1lICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29udGV4dC5hcGkuZXh0LmJlcGluZXhBZGRHYW1lKHtcclxuICAgICAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICAgICAgYXV0b0Rvd25sb2FkQmVwSW5FeDogdHJ1ZSxcclxuICAgICAgICBkb29yc3RvcENvbmZpZzoge1xyXG4gICAgICAgICAgZG9vcnN0b3BUeXBlOiAnZGVmYXVsdCcsXHJcbiAgICAgICAgICBpZ25vcmVEaXNhYmxlU3dpdGNoOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19