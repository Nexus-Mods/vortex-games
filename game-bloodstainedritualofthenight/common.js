"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LO_FILE_NAME = exports.GAME_ID = exports.MOD_FILE_EXT = void 0;
exports.modsRelPath = modsRelPath;
const path_1 = __importDefault(require("path"));
exports.MOD_FILE_EXT = '.pak';
exports.GAME_ID = 'bloodstainedritualofthenight';
exports.LO_FILE_NAME = 'loadOrder.json';
function modsRelPath() {
    return path_1.default.join('BloodstainedRotN', 'Content', 'Paks', '~mods');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQU9BLGtDQUVDO0FBVEQsZ0RBQXdCO0FBR1gsUUFBQSxZQUFZLEdBQUcsTUFBTSxDQUFDO0FBQ3RCLFFBQUEsT0FBTyxHQUFHLDhCQUE4QixDQUFDO0FBQ3pDLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBRTdDLFNBQWdCLFdBQVc7SUFDekIsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDbkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuLy8gREFIISBleHRlbnNpb24gb25seSBzdXBwb3J0IC5wYWsgbW9kcy5cclxuZXhwb3J0IGNvbnN0IE1PRF9GSUxFX0VYVCA9ICcucGFrJztcclxuZXhwb3J0IGNvbnN0IEdBTUVfSUQgPSAnYmxvb2RzdGFpbmVkcml0dWFsb2Z0aGVuaWdodCc7XHJcbmV4cG9ydCBjb25zdCBMT19GSUxFX05BTUUgPSAnbG9hZE9yZGVyLmpzb24nO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1vZHNSZWxQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oJ0Jsb29kc3RhaW5lZFJvdE4nLCAnQ29udGVudCcsICdQYWtzJywgJ35tb2RzJyk7XHJcbn1cclxuIl19