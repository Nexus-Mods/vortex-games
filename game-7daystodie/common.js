"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LAUNCHER_SETTINGS = exports.gameExecutable = exports.modsRelPath = exports.loadOrderFilePath = exports.launcherSettingsFilePath = exports.INVALID_LO_MOD_TYPES = exports.I18N_NAMESPACE = exports.LO_FILE_NAME = exports.GAME_ID = exports.MOD_INFO = void 0;
const vortex_api_1 = require("vortex-api");
const path_1 = __importDefault(require("path"));
exports.MOD_INFO = 'modinfo.xml';
exports.GAME_ID = '7daystodie';
exports.LO_FILE_NAME = 'loadOrder.json';
exports.I18N_NAMESPACE = `game-${exports.GAME_ID}`;
exports.INVALID_LO_MOD_TYPES = ['collection', '7dtd-root-mod'];
function launcherSettingsFilePath() {
    return path_1.default.join(vortex_api_1.util.getVortexPath('appData'), '7DaysToDie', 'launchersettings.json');
}
exports.launcherSettingsFilePath = launcherSettingsFilePath;
function loadOrderFilePath(profileId) {
    return path_1.default.join(vortex_api_1.util.getVortexPath('appData'), '7DaysToDie', profileId + '_' + exports.LO_FILE_NAME);
}
exports.loadOrderFilePath = loadOrderFilePath;
function modsRelPath() {
    return 'Mods';
}
exports.modsRelPath = modsRelPath;
function gameExecutable() {
    return '7DaysToDie.exe';
}
exports.gameExecutable = gameExecutable;
exports.DEFAULT_LAUNCHER_SETTINGS = {
    ShowLauncher: false,
    DefaultRunConfig: {
        ExclusiveMode: false,
        Renderer: "dx11",
        UseGamesparks: true,
        UseEAC: true,
        UseNativeInput: false,
        AdditionalParameters: ""
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDJDQUFrQztBQUNsQyxnREFBd0I7QUFFWCxRQUFBLFFBQVEsR0FBRyxhQUFhLENBQUM7QUFDekIsUUFBQSxPQUFPLEdBQUcsWUFBWSxDQUFDO0FBQ3ZCLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBQ2hDLFFBQUEsY0FBYyxHQUFHLFFBQVEsZUFBTyxFQUFFLENBQUM7QUFDbkMsUUFBQSxvQkFBb0IsR0FBRyxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztBQUVwRSxTQUFnQix3QkFBd0I7SUFDdEMsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFlBQVksRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0FBQ3pGLENBQUM7QUFGRCw0REFFQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLFNBQWlCO0lBQ2pELE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxpQkFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRSxZQUFZLEVBQUUsU0FBUyxHQUFHLEdBQUcsR0FBRyxvQkFBWSxDQUFDLENBQUM7QUFDaEcsQ0FBQztBQUZELDhDQUVDO0FBRUQsU0FBZ0IsV0FBVztJQUN6QixPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRkQsa0NBRUM7QUFFRCxTQUFnQixjQUFjO0lBQzVCLE9BQU8sZ0JBQWdCLENBQUM7QUFDMUIsQ0FBQztBQUZELHdDQUVDO0FBRVksUUFBQSx5QkFBeUIsR0FBRztJQUN2QyxZQUFZLEVBQUcsS0FBSztJQUNwQixnQkFBZ0IsRUFBRztRQUNqQixhQUFhLEVBQUcsS0FBSztRQUNyQixRQUFRLEVBQUcsTUFBTTtRQUNqQixhQUFhLEVBQUcsSUFBSTtRQUNwQixNQUFNLEVBQUcsSUFBSTtRQUNiLGNBQWMsRUFBRyxLQUFLO1FBQ3RCLG9CQUFvQixFQUFHLEVBQUU7S0FDMUI7Q0FDRixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBjb25zdCBNT0RfSU5GTyA9ICdtb2RpbmZvLnhtbCc7XG5leHBvcnQgY29uc3QgR0FNRV9JRCA9ICc3ZGF5c3RvZGllJztcbmV4cG9ydCBjb25zdCBMT19GSUxFX05BTUUgPSAnbG9hZE9yZGVyLmpzb24nO1xuZXhwb3J0IGNvbnN0IEkxOE5fTkFNRVNQQUNFID0gYGdhbWUtJHtHQU1FX0lEfWA7XG5leHBvcnQgY29uc3QgSU5WQUxJRF9MT19NT0RfVFlQRVMgPSBbJ2NvbGxlY3Rpb24nLCAnN2R0ZC1yb290LW1vZCddO1xuXG5leHBvcnQgZnVuY3Rpb24gbGF1bmNoZXJTZXR0aW5nc0ZpbGVQYXRoKCk6IHN0cmluZyB7XG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdhcHBEYXRhJyksICc3RGF5c1RvRGllJywgJ2xhdW5jaGVyc2V0dGluZ3MuanNvbicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZE9yZGVyRmlsZVBhdGgocHJvZmlsZUlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnYXBwRGF0YScpLCAnN0RheXNUb0RpZScsIHByb2ZpbGVJZCArICdfJyArIExPX0ZJTEVfTkFNRSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb2RzUmVsUGF0aCgpIHtcbiAgcmV0dXJuICdNb2RzJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdhbWVFeGVjdXRhYmxlKCkge1xuICByZXR1cm4gJzdEYXlzVG9EaWUuZXhlJztcbn1cblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfTEFVTkNIRVJfU0VUVElOR1MgPSB7XG4gIFNob3dMYXVuY2hlciA6IGZhbHNlLFxuICBEZWZhdWx0UnVuQ29uZmlnIDoge1xuICAgIEV4Y2x1c2l2ZU1vZGUgOiBmYWxzZSxcbiAgICBSZW5kZXJlciA6IFwiZHgxMVwiLFxuICAgIFVzZUdhbWVzcGFya3MgOiB0cnVlLFxuICAgIFVzZUVBQyA6IHRydWUsXG4gICAgVXNlTmF0aXZlSW5wdXQgOiBmYWxzZSxcbiAgICBBZGRpdGlvbmFsUGFyYW1ldGVycyA6IFwiXCJcbiAgfVxufSJdfQ==