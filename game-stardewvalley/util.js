"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUFxQztBQUNyQywrQ0FBaUM7QUFDakMsMkNBQXNDO0FBR3RDLFNBQXNCLGFBQWEsQ0FBQyxnQkFBd0I7O1FBQzFELElBQUk7WUFDRixNQUFNLFlBQVksR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNyRixNQUFNLFFBQVEsR0FBb0IsSUFBQSxvQkFBSyxFQUFDLGlCQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFvQixDQUFDO1lBQ3JGLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2IsTUFBTSxJQUFJLGlCQUFJLENBQUMsV0FBVyxDQUFDLDBCQUEwQixDQUFDLENBQUM7YUFDeEQ7WUFDRCxPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUFDLE9BQU8sR0FBRyxFQUFFO1lBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztDQUFBO0FBWEQsc0NBV0M7QUFNRCxTQUFnQixNQUFNLENBQUMsS0FBYTtJQUNsQyxJQUFJO1FBQ0YsT0FBTyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDakM7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM3QjtBQUNILENBQUM7QUFORCx3QkFNQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxHQUFXLEVBQUUsR0FBVztJQUNwRCxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEIsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEVBQUU7UUFDaEMsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUM3QjtTQUFNO1FBQ0wsT0FBTyxHQUFHLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN4QztBQUNILENBQUM7QUFSRCxzQ0FRQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHBhcnNlIH0gZnJvbSAncmVsYXhlZC1qc29uJztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGZzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IElTRFZNb2RNYW5pZmVzdCB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlTWFuaWZlc3QobWFuaWZlc3RGaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxJU0RWTW9kTWFuaWZlc3Q+IHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgbWFuaWZlc3REYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtYW5pZmVzdEZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pO1xyXG4gICAgY29uc3QgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdCA9IHBhcnNlKHV0aWwuZGVCT00obWFuaWZlc3REYXRhKSkgYXMgSVNEVk1vZE1hbmlmZXN0O1xyXG4gICAgaWYgKCFtYW5pZmVzdCkge1xyXG4gICAgICB0aHJvdyBuZXcgdXRpbC5EYXRhSW52YWxpZCgnTWFuaWZlc3QgZmlsZSBpcyBpbnZhbGlkJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbWFuaWZlc3Q7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBzZW12ZXIuY29lcmNlIGRyb3BzIHByZS1yZWxlYXNlIGluZm9ybWF0aW9uIGZyb20gYVxyXG4gKiBwZXJmZWN0bHkgdmFsaWQgc2VtYW50aWMgdmVyc2lvbiBzdHJpbmcsIGRvbid0IHdhbnQgdGhhdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNvZXJjZShpbnB1dDogc3RyaW5nKTogc2VtdmVyLlNlbVZlciB7XHJcbiAgdHJ5IHtcclxuICAgIHJldHVybiBuZXcgc2VtdmVyLlNlbVZlcihpbnB1dCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gc2VtdmVyLmNvZXJjZShpbnB1dCk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2VtdmVyQ29tcGFyZShsaHM6IHN0cmluZywgcmhzOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gIGNvbnN0IGwgPSBjb2VyY2UobGhzKTtcclxuICBjb25zdCByID0gY29lcmNlKHJocyk7XHJcbiAgaWYgKChsICE9PSBudWxsKSAmJiAociAhPT0gbnVsbCkpIHtcclxuICAgIHJldHVybiBzZW12ZXIuY29tcGFyZShsLCByKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIGxocy5sb2NhbGVDb21wYXJlKHJocywgJ2VuLVVTJyk7XHJcbiAgfVxyXG59XHJcblxyXG4iXX0=