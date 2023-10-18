"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.migrate13 = exports.migrate = void 0;
const semver = __importStar(require("semver"));
const vortex_api_1 = require("vortex-api");
const loadOrder_1 = require("./loadOrder");
const path_1 = __importDefault(require("path"));
function migrate(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const settingsPath = path_1.default.join((0, loadOrder_1.profilesPath)(), 'Public', 'modsettings.lsx');
        const backupPath = settingsPath + '.backup';
        try {
            yield vortex_api_1.fs.statAsync(backupPath);
        }
        catch (err) {
            console.log(`${backupPath} doesn't exist.`);
            try {
                yield vortex_api_1.fs.statAsync(settingsPath);
                yield vortex_api_1.fs.copyAsync(settingsPath, backupPath, { overwrite: true });
                console.log(`backup created`);
                yield (0, loadOrder_1.importModSettingsGame)(api);
            }
            catch (err) {
                console.log(`${settingsPath} doesn't exist`);
            }
        }
    });
}
exports.migrate = migrate;
function migrate13(api, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const newVersion = '1.4.0';
        if (semver.gte(oldVersion, newVersion)) {
            console.log('skipping migration');
            return Promise.reject();
        }
        console.log('perform migration');
        try {
            yield (0, loadOrder_1.importModSettingsGame)(api);
            return Promise.reject();
        }
        catch (_a) {
            return Promise.reject();
        }
        return Promise.reject();
    });
}
exports.migrate13 = migrate13;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQWlDO0FBQ2pDLDJDQUF1QztBQUN2QywyQ0FBa0U7QUFDbEUsZ0RBQXdCO0FBRXhCLFNBQXNCLE9BQU8sQ0FBQyxHQUF3Qjs7UUFFcEQsTUFBTSxZQUFZLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFBLHdCQUFZLEdBQUUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUM1RSxNQUFNLFVBQVUsR0FBRyxZQUFZLEdBQUcsU0FBUyxDQUFDO1FBRzVDLElBQUk7WUFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDaEM7UUFDRCxPQUFPLEdBQUcsRUFBRTtZQUVWLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxVQUFVLGlCQUFpQixDQUFDLENBQUM7WUFFNUMsSUFBSTtnQkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFFLENBQUM7Z0JBRW5FLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztnQkFHOUIsTUFBTSxJQUFBLGlDQUFxQixFQUFDLEdBQUcsQ0FBQyxDQUFDO2FBR2xDO1lBQ0QsT0FBTyxHQUFHLEVBQUU7Z0JBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFlBQVksZ0JBQWdCLENBQUMsQ0FBQzthQUM5QztTQUNGO0lBR0gsQ0FBQztDQUFBO0FBOUJELDBCQThCQztBQUVELFNBQXNCLFNBQVMsQ0FBQyxHQUF3QixFQUFFLFVBQWtCOztRQUUxRSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUM7UUFHM0IsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRTtZQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDbEMsT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDekI7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFJakMsSUFBSTtZQUNGLE1BQU0sSUFBQSxpQ0FBcUIsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUNqQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUN6QjtRQUNELFdBQU07WUFDSixPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUN6QjtRQUVELE9BQU8sT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzFCLENBQUM7Q0FBQTtBQXZCRCw4QkF1QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgZnMsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IGltcG9ydE1vZFNldHRpbmdzR2FtZSwgcHJvZmlsZXNQYXRoIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xyXG4gIFxyXG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgJ1B1YmxpYycsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuICBjb25zdCBiYWNrdXBQYXRoID0gc2V0dGluZ3NQYXRoICsgJy5iYWNrdXAnO1xyXG5cclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnN0YXRBc3luYyhiYWNrdXBQYXRoKTsgLy8gaWYgaXQgZG9lc24ndCBleGlzdCwgbWFrZSBhIGJhY2t1cFxyXG4gIH0gXHJcbiAgY2F0Y2ggKGVycikge1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGAke2JhY2t1cFBhdGh9IGRvZXNuJ3QgZXhpc3QuYCk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHNldHRpbmdzUGF0aCk7IFxyXG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoc2V0dGluZ3NQYXRoLCBiYWNrdXBQYXRoLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9ICk7XHJcbiAgICAgIFxyXG4gICAgICBjb25zb2xlLmxvZyhgYmFja3VwIGNyZWF0ZWRgKTtcclxuICAgICAgXHJcbiAgICAgIC8vIGltcG9ydFxyXG4gICAgICBhd2FpdCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpKTtcclxuICAgICAgXHJcbiAgICAgIC8vY29uc29sZS5sb2coYCR7YmFja3VwUGF0aH0gZG9lc24ndCBleGlzdGApO1xyXG4gICAgfSBcclxuICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgY29uc29sZS5sb2coYCR7c2V0dGluZ3NQYXRofSBkb2Vzbid0IGV4aXN0YCk7XHJcbiAgICB9ICAgIFxyXG4gIH1cclxuXHJcbiAgLy8gYmFjayB1cCBtYWRlIGp1c3QgaW4gY2FzZVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZTEzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgb2xkVmVyc2lvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gIGNvbnN0IG5ld1ZlcnNpb24gPSAnMS40LjAnOyAvLyBGT1JDSU5HIE1JR1JBVElPTlxyXG5cclxuICAvLyBpZiBvbGQgdmVyc2lvbiBpcyBuZXdlciwgdGhlbiBza2lwXHJcbiAgaWYgKHNlbXZlci5ndGUob2xkVmVyc2lvbiwgbmV3VmVyc2lvbikpIHtcclxuICAgIGNvbnNvbGUubG9nKCdza2lwcGluZyBtaWdyYXRpb24nKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gIH1cclxuXHJcbiAgY29uc29sZS5sb2coJ3BlcmZvcm0gbWlncmF0aW9uJyk7XHJcblxyXG4gIC8vIGRvIHdlIGp1c3QgYSBmb3JjZSBhIGltcG9ydCBmcm9tIGdhbWU/IVxyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGFwaSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTsgLy8gRk9SQ0UgTk9UIFJFQ09SRCBWRVJTSU9OIE5VTUJFUlxyXG4gIH0gXHJcbiAgY2F0Y2gge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTsgIFxyXG59XHJcbiJdfQ==