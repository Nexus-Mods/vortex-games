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
        console.log(`new migration ${settingsPath} ${backupPath}`);
        try {
            yield vortex_api_1.fs.statAsync(backupPath);
        }
        catch (err) {
            console.log(`${backupPath} doesn't exist`);
            try {
                yield vortex_api_1.fs.statAsync(settingsPath);
                yield vortex_api_1.fs.copyAsync(settingsPath, backupPath, { overwrite: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQWlDO0FBQ2pDLDJDQUF1QztBQUN2QywyQ0FBa0U7QUFDbEUsZ0RBQXdCO0FBRXhCLFNBQXNCLE9BQU8sQ0FBQyxHQUF3Qjs7UUFFcEQsTUFBTSxZQUFZLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFBLHdCQUFZLEdBQUUsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUM1RSxNQUFNLFVBQVUsR0FBRyxZQUFZLEdBQUcsU0FBUyxDQUFDO1FBRTVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLFlBQVksSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBRTNELElBQUk7WUFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDaEM7UUFDRCxPQUFPLEdBQUcsRUFBRTtZQUVWLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxVQUFVLGdCQUFnQixDQUFDLENBQUM7WUFFM0MsSUFBSTtnQkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFFLENBQUM7Z0JBR25FLE1BQU0sSUFBQSxpQ0FBcUIsRUFBQyxHQUFHLENBQUMsQ0FBQzthQUdsQztZQUNELE9BQU8sR0FBRyxFQUFFO2dCQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxZQUFZLGdCQUFnQixDQUFDLENBQUM7YUFDOUM7U0FDRjtJQUlILENBQUM7Q0FBQTtBQTlCRCwwQkE4QkM7QUFFRCxTQUFzQixTQUFTLENBQUMsR0FBd0IsRUFBRSxVQUFrQjs7UUFFMUUsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDO1FBRzNCLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEVBQUU7WUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQ2xDLE9BQU8sT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ3pCO1FBRUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBSWpDLElBQUk7WUFDRixNQUFNLElBQUEsaUNBQXFCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDekI7UUFDRCxXQUFNO1lBQ0osT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDekI7UUFFRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMxQixDQUFDO0NBQUE7QUF2QkQsOEJBdUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGZzLCB0eXBlcyB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBpbXBvcnRNb2RTZXR0aW5nc0dhbWUsIHByb2ZpbGVzUGF0aCB9IGZyb20gJy4vbG9hZE9yZGVyJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBcclxuICBjb25zdCBzZXR0aW5nc1BhdGggPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksICdQdWJsaWMnLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgY29uc3QgYmFja3VwUGF0aCA9IHNldHRpbmdzUGF0aCArICcuYmFja3VwJztcclxuXHJcbiAgY29uc29sZS5sb2coYG5ldyBtaWdyYXRpb24gJHtzZXR0aW5nc1BhdGh9ICR7YmFja3VwUGF0aH1gKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnN0YXRBc3luYyhiYWNrdXBQYXRoKTsgLy8gaWYgaXQgZG9lc24ndCBleGlzdCwgbWFrZSBhIGJhY2t1cFxyXG4gIH0gXHJcbiAgY2F0Y2ggKGVycikge1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGAke2JhY2t1cFBhdGh9IGRvZXNuJ3QgZXhpc3RgKTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5zdGF0QXN5bmMoc2V0dGluZ3NQYXRoKTsgXHJcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhzZXR0aW5nc1BhdGgsIGJhY2t1cFBhdGgsIHsgb3ZlcndyaXRlOiB0cnVlIH0gKTtcclxuICAgICAgXHJcbiAgICAgIC8vIGltcG9ydFxyXG4gICAgICBhd2FpdCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpKTtcclxuICAgICAgXHJcbiAgICAgIC8vY29uc29sZS5sb2coYCR7YmFja3VwUGF0aH0gZG9lc24ndCBleGlzdGApO1xyXG4gICAgfSBcclxuICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgY29uc29sZS5sb2coYCR7c2V0dGluZ3NQYXRofSBkb2Vzbid0IGV4aXN0YCk7XHJcbiAgICB9ICAgIFxyXG4gIH1cclxuXHJcbiAgLy8gYmFjayB1cCBtYWRlIGp1c3QgaW4gY2FzZVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxMyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG9sZFZlcnNpb246IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG5cclxuICBjb25zdCBuZXdWZXJzaW9uID0gJzEuNC4wJzsgLy8gRk9SQ0lORyBNSUdSQVRJT05cclxuXHJcbiAgLy8gaWYgb2xkIHZlcnNpb24gaXMgbmV3ZXIsIHRoZW4gc2tpcFxyXG4gIGlmIChzZW12ZXIuZ3RlKG9sZFZlcnNpb24sIG5ld1ZlcnNpb24pKSB7XHJcbiAgICBjb25zb2xlLmxvZygnc2tpcHBpbmcgbWlncmF0aW9uJyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICB9XHJcblxyXG4gIGNvbnNvbGUubG9nKCdwZXJmb3JtIG1pZ3JhdGlvbicpO1xyXG5cclxuICAvLyBkbyB3ZSBqdXN0IGEgZm9yY2UgYSBpbXBvcnQgZnJvbSBnYW1lPyFcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGltcG9ydE1vZFNldHRpbmdzR2FtZShhcGkpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7IC8vIEZPUkNFIE5PVCBSRUNPUkQgVkVSU0lPTiBOVU1CRVJcclxuICB9IFxyXG4gIGNhdGNoIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7ICBcclxufVxyXG4iXX0=