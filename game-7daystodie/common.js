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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDJDQUFrQztBQUNsQyxnREFBd0I7QUFFWCxRQUFBLFFBQVEsR0FBRyxhQUFhLENBQUM7QUFDekIsUUFBQSxPQUFPLEdBQUcsWUFBWSxDQUFDO0FBQ3ZCLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBQ2hDLFFBQUEsY0FBYyxHQUFHLFFBQVEsZUFBTyxFQUFFLENBQUM7QUFDbkMsUUFBQSxvQkFBb0IsR0FBRyxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztBQUVwRSxTQUFnQix3QkFBd0I7SUFDdEMsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFlBQVksRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0FBQ3pGLENBQUM7QUFGRCw0REFFQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLFNBQWlCO0lBQ2pELE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxpQkFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRSxZQUFZLEVBQUUsU0FBUyxHQUFHLEdBQUcsR0FBRyxvQkFBWSxDQUFDLENBQUM7QUFDaEcsQ0FBQztBQUZELDhDQUVDO0FBRUQsU0FBZ0IsV0FBVztJQUN6QixPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRkQsa0NBRUM7QUFFRCxTQUFnQixjQUFjO0lBQzVCLE9BQU8sZ0JBQWdCLENBQUM7QUFDMUIsQ0FBQztBQUZELHdDQUVDO0FBRVksUUFBQSx5QkFBeUIsR0FBRztJQUN2QyxZQUFZLEVBQUcsS0FBSztJQUNwQixnQkFBZ0IsRUFBRztRQUNqQixhQUFhLEVBQUcsS0FBSztRQUNyQixRQUFRLEVBQUcsTUFBTTtRQUNqQixhQUFhLEVBQUcsSUFBSTtRQUNwQixNQUFNLEVBQUcsSUFBSTtRQUNiLGNBQWMsRUFBRyxLQUFLO1FBQ3RCLG9CQUFvQixFQUFHLEVBQUU7S0FDMUI7Q0FDRixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbmV4cG9ydCBjb25zdCBNT0RfSU5GTyA9ICdtb2RpbmZvLnhtbCc7XHJcbmV4cG9ydCBjb25zdCBHQU1FX0lEID0gJzdkYXlzdG9kaWUnO1xyXG5leHBvcnQgY29uc3QgTE9fRklMRV9OQU1FID0gJ2xvYWRPcmRlci5qc29uJztcclxuZXhwb3J0IGNvbnN0IEkxOE5fTkFNRVNQQUNFID0gYGdhbWUtJHtHQU1FX0lEfWA7XHJcbmV4cG9ydCBjb25zdCBJTlZBTElEX0xPX01PRF9UWVBFUyA9IFsnY29sbGVjdGlvbicsICc3ZHRkLXJvb3QtbW9kJ107XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbGF1bmNoZXJTZXR0aW5nc0ZpbGVQYXRoKCk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2FwcERhdGEnKSwgJzdEYXlzVG9EaWUnLCAnbGF1bmNoZXJzZXR0aW5ncy5qc29uJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsb2FkT3JkZXJGaWxlUGF0aChwcm9maWxlSWQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2FwcERhdGEnKSwgJzdEYXlzVG9EaWUnLCBwcm9maWxlSWQgKyAnXycgKyBMT19GSUxFX05BTUUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbW9kc1JlbFBhdGgoKSB7XHJcbiAgcmV0dXJuICdNb2RzJztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdhbWVFeGVjdXRhYmxlKCkge1xyXG4gIHJldHVybiAnN0RheXNUb0RpZS5leGUnO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgREVGQVVMVF9MQVVOQ0hFUl9TRVRUSU5HUyA9IHtcclxuICBTaG93TGF1bmNoZXIgOiBmYWxzZSxcclxuICBEZWZhdWx0UnVuQ29uZmlnIDoge1xyXG4gICAgRXhjbHVzaXZlTW9kZSA6IGZhbHNlLFxyXG4gICAgUmVuZGVyZXIgOiBcImR4MTFcIixcclxuICAgIFVzZUdhbWVzcGFya3MgOiB0cnVlLFxyXG4gICAgVXNlRUFDIDogdHJ1ZSxcclxuICAgIFVzZU5hdGl2ZUlucHV0IDogZmFsc2UsXHJcbiAgICBBZGRpdGlvbmFsUGFyYW1ldGVycyA6IFwiXCJcclxuICB9XHJcbn0iXX0=