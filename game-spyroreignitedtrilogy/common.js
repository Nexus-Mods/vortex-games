"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modsRelPath = exports.LO_FILE_NAME = exports.GAME_ID = exports.MOD_FILE_EXT = void 0;
const path_1 = __importDefault(require("path"));
exports.MOD_FILE_EXT = '.pak';
exports.GAME_ID = 'spyroreignitedtrilogy';
exports.LO_FILE_NAME = 'loadOrder.json';
function modsRelPath() {
    return path_1.default.join('falcon', 'content', 'paks', '~mods');
}
exports.modsRelPath = modsRelPath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUdYLFFBQUEsWUFBWSxHQUFHLE1BQU0sQ0FBQztBQUN0QixRQUFBLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQztBQUNsQyxRQUFBLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQztBQUU3QyxTQUFnQixXQUFXO0lBQ3pCLE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRkQsa0NBRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gREFIISBleHRlbnNpb24gb25seSBzdXBwb3J0IC5wYWsgbW9kcy5cbmV4cG9ydCBjb25zdCBNT0RfRklMRV9FWFQgPSAnLnBhayc7XG5leHBvcnQgY29uc3QgR0FNRV9JRCA9ICdzcHlyb3JlaWduaXRlZHRyaWxvZ3knO1xuZXhwb3J0IGNvbnN0IExPX0ZJTEVfTkFNRSA9ICdsb2FkT3JkZXIuanNvbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBtb2RzUmVsUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbignZmFsY29uJywgJ2NvbnRlbnQnLCAncGFrcycsICd+bW9kcycpO1xufVxuIl19