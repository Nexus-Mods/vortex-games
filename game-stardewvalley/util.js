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
Object.defineProperty(exports, "__esModule", { value: true });
exports.semverCompare = exports.coerce = exports.parseManifest = void 0;
const relaxed_json_1 = require("relaxed-json");
const semver = __importStar(require("semver"));
const vortex_api_1 = require("vortex-api");
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
function coerce(input) {
    try {
        return new semver.SemVer(input);
    }
    catch (err) {
        return semver.coerce(input);
    }
}
exports.coerce = coerce;
function semverCompare(lhs, rhs) {
    const l = coerce(lhs);
    const r = coerce(rhs);
    if ((l !== null) && (r !== null)) {
        return semver.compare(l, r);
    }
    else {
        return lhs.localeCompare(rhs, 'en-US');
    }
}
exports.semverCompare = semverCompare;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQ0FBcUM7QUFDckMsK0NBQWlDO0FBQ2pDLDJDQUFzQztBQUd0QyxTQUFzQixhQUFhLENBQUMsZ0JBQXdCOztRQUMxRCxJQUFJO1lBQ0YsTUFBTSxZQUFZLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDckYsTUFBTSxRQUFRLEdBQW9CLElBQUEsb0JBQUssRUFBQyxpQkFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBb0IsQ0FBQztZQUNyRixJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNiLE1BQU0sSUFBSSxpQkFBSSxDQUFDLFdBQVcsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2FBQ3hEO1lBQ0QsT0FBTyxRQUFRLENBQUM7U0FDakI7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM1QjtJQUNILENBQUM7Q0FBQTtBQVhELHNDQVdDO0FBTUQsU0FBZ0IsTUFBTSxDQUFDLEtBQWE7SUFDbEMsSUFBSTtRQUNGLE9BQU8sSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2pDO0lBQUMsT0FBTyxHQUFHLEVBQUU7UUFDWixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDN0I7QUFDSCxDQUFDO0FBTkQsd0JBTUM7QUFFRCxTQUFnQixhQUFhLENBQUMsR0FBVyxFQUFFLEdBQVc7SUFDcEQsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN0QixJQUFJLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDN0I7U0FBTTtRQUNMLE9BQU8sR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDeEM7QUFDSCxDQUFDO0FBUkQsc0NBUUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwYXJzZSB9IGZyb20gJ3JlbGF4ZWQtanNvbic7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IGZzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBJU0RWTW9kTWFuaWZlc3QgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlTWFuaWZlc3QobWFuaWZlc3RGaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxJU0RWTW9kTWFuaWZlc3Q+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBtYW5pZmVzdERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1hbmlmZXN0RmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGYtOCcgfSk7XG4gICAgY29uc3QgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdCA9IHBhcnNlKHV0aWwuZGVCT00obWFuaWZlc3REYXRhKSkgYXMgSVNEVk1vZE1hbmlmZXN0O1xuICAgIGlmICghbWFuaWZlc3QpIHtcbiAgICAgIHRocm93IG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdNYW5pZmVzdCBmaWxlIGlzIGludmFsaWQnKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hbmlmZXN0O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG4vKipcbiAqIHNlbXZlci5jb2VyY2UgZHJvcHMgcHJlLXJlbGVhc2UgaW5mb3JtYXRpb24gZnJvbSBhXG4gKiBwZXJmZWN0bHkgdmFsaWQgc2VtYW50aWMgdmVyc2lvbiBzdHJpbmcsIGRvbid0IHdhbnQgdGhhdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29lcmNlKGlucHV0OiBzdHJpbmcpOiBzZW12ZXIuU2VtVmVyIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gbmV3IHNlbXZlci5TZW1WZXIoaW5wdXQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gc2VtdmVyLmNvZXJjZShpbnB1dCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbXZlckNvbXBhcmUobGhzOiBzdHJpbmcsIHJoczogc3RyaW5nKTogbnVtYmVyIHtcbiAgY29uc3QgbCA9IGNvZXJjZShsaHMpO1xuICBjb25zdCByID0gY29lcmNlKHJocyk7XG4gIGlmICgobCAhPT0gbnVsbCkgJiYgKHIgIT09IG51bGwpKSB7XG4gICAgcmV0dXJuIHNlbXZlci5jb21wYXJlKGwsIHIpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBsaHMubG9jYWxlQ29tcGFyZShyaHMsICdlbi1VUycpO1xuICB9XG59XG4iXX0=