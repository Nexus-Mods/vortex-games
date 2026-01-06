"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LO_FILE_NAME = exports.GAME_ID = exports.MOD_FILE_EXT = void 0;
exports.modsRelPath = modsRelPath;
const path_1 = __importDefault(require("path"));
exports.MOD_FILE_EXT = '.pak';
exports.GAME_ID = 'codevein';
exports.LO_FILE_NAME = 'loadOrder.json';
function modsRelPath() {
    return path_1.default.join('CodeVein', 'content', 'paks', '~mods');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQU9BLGtDQUVDO0FBVEQsZ0RBQXdCO0FBR1gsUUFBQSxZQUFZLEdBQUcsTUFBTSxDQUFDO0FBQ3RCLFFBQUEsT0FBTyxHQUFHLFVBQVUsQ0FBQztBQUNyQixRQUFBLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQztBQUU3QyxTQUFnQixXQUFXO0lBQ3pCLE9BQU8sY0FBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMzRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG4vLyBEQUghIGV4dGVuc2lvbiBvbmx5IHN1cHBvcnQgLnBhayBtb2RzLlxyXG5leHBvcnQgY29uc3QgTU9EX0ZJTEVfRVhUID0gJy5wYWsnO1xyXG5leHBvcnQgY29uc3QgR0FNRV9JRCA9ICdjb2RldmVpbic7XHJcbmV4cG9ydCBjb25zdCBMT19GSUxFX05BTUUgPSAnbG9hZE9yZGVyLmpzb24nO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1vZHNSZWxQYXRoKCkge1xyXG4gIHJldHVybiBwYXRoLmpvaW4oJ0NvZGVWZWluJywgJ2NvbnRlbnQnLCAncGFrcycsICd+bW9kcycpO1xyXG59XHJcbiJdfQ==