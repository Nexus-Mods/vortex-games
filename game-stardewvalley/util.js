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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseManifest = void 0;
const vortex_api_1 = require("vortex-api");
const relaxed_json_1 = require("relaxed-json");
function parseManifest(manifestFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const manifestData = yield vortex_api_1.fs.readFileAsync(manifestFilePath, { encoding: 'utf-8' });
            const manifest = (0, relaxed_json_1.parse)(vortex_api_1.util.deBOM(manifestData));
            if (!manifest) {
                throw new vortex_api_1.util.DataInvalid('Manifest file is invalid');
            }
            return manifest;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.parseManifest = parseManifest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXNDO0FBQ3RDLCtDQUFxQztBQUdyQyxTQUFzQixhQUFhLENBQUMsZ0JBQXdCOztRQUMxRCxJQUFJO1lBQ0YsTUFBTSxZQUFZLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDckYsTUFBTSxRQUFRLEdBQW9CLElBQUEsb0JBQUssRUFBQyxpQkFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBb0IsQ0FBQztZQUNyRixJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNiLE1BQU0sSUFBSSxpQkFBSSxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2FBQ3hEO1lBQ0QsT0FBTyxRQUFRLENBQUM7U0FDakI7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQTtBQVhELHNDQVdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgcGFyc2UgfSBmcm9tICdyZWxheGVkLWpzb24nO1xyXG5pbXBvcnQgeyBJU0RWTW9kTWFuaWZlc3QgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZU1hbmlmZXN0KG1hbmlmZXN0RmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8SVNEVk1vZE1hbmlmZXN0PiB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1hbmlmZXN0RGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMobWFuaWZlc3RGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KTtcclxuICAgIGNvbnN0IG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3QgPSBwYXJzZSh1dGlsLmRlQk9NKG1hbmlmZXN0RGF0YSkpIGFzIElTRFZNb2RNYW5pZmVzdDtcclxuICAgIGlmICghbWFuaWZlc3QpIHtcclxuICAgICAgdGhyb3cgbmV3IHV0aWwuRGF0YUludmFsaWQoJ01hbmlmZXN0IGZpbGUgaXMgaW52YWxpZCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG1hbmlmZXN0O1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59Il19