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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.DivineTimedOut = exports.DivineMissingDotNet = exports.DivineExecMissing = void 0;
exports.extractPak = extractPak;
exports.listPackage = listPackage;
const path = __importStar(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
const nodeUtil = __importStar(require("util"));
const child_process = __importStar(require("child_process"));
const exec = nodeUtil.promisify(child_process.exec);
const concurrencyLimiter = new vortex_api_1.util.ConcurrencyLimiter(5, () => true);
const TIMEOUT_MS = 10000;
class DivineExecMissing extends Error {
    constructor() {
        super('Divine executable is missing');
        this.name = 'DivineExecMissing';
    }
}
exports.DivineExecMissing = DivineExecMissing;
class DivineMissingDotNet extends Error {
    constructor() {
        super('LSLib requires .NET 8 Desktop Runtime to be installed.');
        this.name = 'DivineMissingDotNet';
    }
}
exports.DivineMissingDotNet = DivineMissingDotNet;
class DivineTimedOut extends Error {
    constructor() {
        super('Divine process timed out');
        this.name = 'DivineTimedOut';
    }
}
exports.DivineTimedOut = DivineTimedOut;
const execOpts = {
    timeout: TIMEOUT_MS,
};
function runDivine(api, action, divineOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => concurrencyLimiter.do(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield divine(api, action, divineOpts, execOpts);
                return resolve(result);
            }
            catch (err) {
                return reject(err);
            }
        })));
    });
}
function divine(api, action, divineOpts, execOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const state = api.getState();
            const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const lsLib = (0, util_1.getLatestLSLibMod)(api);
            if (lsLib === undefined) {
                const err = new Error('LSLib/Divine tool is missing');
                err['attachLogOnReport'] = false;
                return reject(err);
            }
            const exe = path.join(stagingFolder, lsLib.installationPath, 'tools', 'divine.exe');
            const args = [
                '--action', action,
                '--source', `"${divineOpts.source}"`,
                '--game', 'bg3',
            ];
            if (divineOpts.loglevel !== undefined) {
                args.push('--loglevel', divineOpts.loglevel);
            }
            else {
                args.push('--loglevel', 'off');
            }
            if (divineOpts.destination !== undefined) {
                args.push('--destination', `"${divineOpts.destination}"`);
            }
            if (divineOpts.expression !== undefined) {
                args.push('--expression', `"${divineOpts.expression}"`);
            }
            try {
                const command = `"${exe}" ${args.join(' ')}`;
                const { stdout, stderr } = yield exec(command, execOpts);
                if (!!stderr) {
                    return reject(new Error(`divine.exe failed: ${stderr}`));
                }
                if (!stdout && action !== 'list-package') {
                    return resolve({ stdout: '', returnCode: 2 });
                }
                const stdoutStr = typeof stdout === 'string' ? stdout : (_b = (_a = stdout === null || stdout === void 0 ? void 0 : stdout.toString) === null || _a === void 0 ? void 0 : _a.call(stdout)) !== null && _b !== void 0 ? _b : '';
                if (['error', 'fatal'].some(x => stdoutStr.toLowerCase().startsWith(x))) {
                    return reject(new Error(`divine.exe failed: ${stdoutStr}`));
                }
                else {
                    return resolve({ stdout: stdoutStr, returnCode: 0 });
                }
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    return reject(new DivineExecMissing());
                }
                if (err.message.includes('You must install or update .NET')) {
                    return reject(new DivineMissingDotNet());
                }
                const error = new Error(`divine.exe failed: ${err.message}`);
                error['attachLogOnReport'] = true;
                return reject(error);
            }
        }));
    });
}
function extractPak(api, pakPath, destPath, pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        return runDivine(api, 'extract-package', { source: pakPath, destination: destPath, expression: pattern });
    });
}
function listPackage(api, pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let res;
        try {
            res = yield runDivine(api, 'list-package', { source: pakPath, loglevel: 'off' });
        }
        catch (error) {
            (0, util_1.logError)(`listPackage caught error: `, { error });
            if (error instanceof DivineMissingDotNet) {
                (0, vortex_api_1.log)('error', 'Missing .NET', error.message);
                api.dismissNotification('bg3-reading-paks-activity');
                api.showErrorNotification('LSLib requires .NET 8', 'LSLib requires .NET 8 Desktop Runtime to be installed.' +
                    '[br][/br][br][/br]' +
                    '[list=1][*]Download and Install [url=https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/runtime-desktop-8.0.3-windows-x64-installer].NET 8.0 Desktop Runtime from Microsoft[/url]' +
                    '[*]Close Vortex' +
                    '[*]Restart Computer' +
                    '[*]Open Vortex[/list]', { id: 'bg3-dotnet-error', allowReport: false, isBBCode: true });
            }
        }
        const lines = ((res === null || res === void 0 ? void 0 : res.stdout) || '').split('\n').map(line => line.trim()).filter(line => line.length !== 0);
        return lines;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGl2aW5lV3JhcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpdmluZVdyYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNEhBLGdDQUdDO0FBRUQsa0NBNEJDO0FBNUpELDJDQUE2QjtBQUM3QiwyQ0FBeUQ7QUFFekQscUNBQW1DO0FBRW5DLGlDQUFxRDtBQUVyRCwrQ0FBaUM7QUFDakMsNkRBQStDO0FBRS9DLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBR3BELE1BQU0sa0JBQWtCLEdBQTRCLElBQUksaUJBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7QUFJL0YsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBRXpCLE1BQWEsaUJBQWtCLFNBQVEsS0FBSztJQUMxQztRQUNFLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUM7SUFDbEMsQ0FBQztDQUNGO0FBTEQsOENBS0M7QUFFRCxNQUFhLG1CQUFvQixTQUFRLEtBQUs7SUFDNUM7UUFDRSxLQUFLLENBQUMsd0RBQXdELENBQUMsQ0FBQztRQUNoRSxJQUFJLENBQUMsSUFBSSxHQUFHLHFCQUFxQixDQUFDO0lBQ3BDLENBQUM7Q0FDRjtBQUxELGtEQUtDO0FBRUQsTUFBYSxjQUFlLFNBQVEsS0FBSztJQUN2QztRQUNFLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUM7SUFDL0IsQ0FBQztDQUNGO0FBTEQsd0NBS0M7QUFFRCxNQUFNLFFBQVEsR0FBOEI7SUFDMUMsT0FBTyxFQUFFLFVBQVU7Q0FDcEIsQ0FBQztBQUVGLFNBQWUsU0FB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QUFxQjtvQkFDckIsdUJBQXVCLEVBQ3RCLEVBQUUsRUFBRSxFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDbkUsQ0FBQztRQUNILENBQUM7UUFHRCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLE1BQU0sS0FBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUl6RyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgRGl2aW5lQWN0aW9uLCBJRGl2aW5lT3B0aW9ucywgSURpdmluZU91dHB1dCB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBnZXRMYXRlc3RMU0xpYk1vZCwgbG9nRXJyb3IgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuaW1wb3J0ICogYXMgbm9kZVV0aWwgZnJvbSAndXRpbCc7XHJcbmltcG9ydCAqIGFzIGNoaWxkX3Byb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcblxyXG5jb25zdCBleGVjID0gbm9kZVV0aWwucHJvbWlzaWZ5KGNoaWxkX3Byb2Nlc3MuZXhlYyk7XHJcblxyXG4vLyBSdW4gNSBjb25jdXJyZW50IERpdmluZSBwcm9jZXNzZXMgLSByZXRyeSBlYWNoIHByb2Nlc3MgNSB0aW1lcyBpZiBpdCBmYWlscy5cclxuY29uc3QgY29uY3VycmVuY3lMaW1pdGVyOiB1dGlsLkNvbmN1cnJlbmN5TGltaXRlciA9IG5ldyB1dGlsLkNvbmN1cnJlbmN5TGltaXRlcig1LCAoKSA9PiB0cnVlKTtcclxuXHJcbi8vIFRoaXMgaXMgcHJvYmFibHkgb3ZlcmtpbGwgLSBtb2QgZXh0cmFjdGlvbiBzaG91bGRuJ3QgdGFrZVxyXG4vLyAgbW9yZSB0aGFuIGEgZmV3IHNlY29uZHMuXHJcbmNvbnN0IFRJTUVPVVRfTVMgPSAxMDAwMDtcclxuXHJcbmV4cG9ydCBjbGFzcyBEaXZpbmVFeGVjTWlzc2luZyBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHN1cGVyKCdEaXZpbmUgZXhlY3V0YWJsZSBpcyBtaXNzaW5nJyk7XHJcbiAgICB0aGlzLm5hbWUgPSAnRGl2aW5lRXhlY01pc3NpbmcnO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERpdmluZU1pc3NpbmdEb3ROZXQgZXh0ZW5kcyBFcnJvciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzdXBlcignTFNMaWIgcmVxdWlyZXMgLk5FVCA4IERlc2t0b3AgUnVudGltZSB0byBiZSBpbnN0YWxsZWQuJyk7XHJcbiAgICB0aGlzLm5hbWUgPSAnRGl2aW5lTWlzc2luZ0RvdE5ldCc7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRGl2aW5lVGltZWRPdXQgZXh0ZW5kcyBFcnJvciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzdXBlcignRGl2aW5lIHByb2Nlc3MgdGltZWQgb3V0Jyk7XHJcbiAgICB0aGlzLm5hbWUgPSAnRGl2aW5lVGltZWRPdXQnO1xyXG4gIH1cclxufVxyXG5cclxuY29uc3QgZXhlY09wdHM6IGNoaWxkX3Byb2Nlc3MuRXhlY09wdGlvbnMgPSB7XHJcbiAgdGltZW91dDogVElNRU9VVF9NUyxcclxufTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJ1bkRpdmluZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246IERpdmluZUFjdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGRpdmluZU9wdHM6IElEaXZpbmVPcHRpb25zKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPElEaXZpbmVPdXRwdXQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gY29uY3VycmVuY3lMaW1pdGVyLmRvKGFzeW5jICgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGRpdmluZShhcGksIGFjdGlvbiwgZGl2aW5lT3B0cywgZXhlY09wdHMpO1xyXG4gICAgICByZXR1cm4gcmVzb2x2ZShyZXN1bHQpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgIH1cclxuICB9KSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGRpdmluZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgYWN0aW9uOiBEaXZpbmVBY3Rpb24sXHJcbiAgZGl2aW5lT3B0czogSURpdmluZU9wdGlvbnMsXHJcbiAgZXhlY09wdHM6IGNoaWxkX3Byb2Nlc3MuRXhlY09wdGlvbnMpOiBQcm9taXNlPElEaXZpbmVPdXRwdXQ+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2U8SURpdmluZU91dHB1dD4oYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGxzTGliOiB0eXBlcy5JTW9kID0gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpKTtcclxuICAgIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignTFNMaWIvRGl2aW5lIHRvb2wgaXMgbWlzc2luZycpO1xyXG4gICAgICBlcnJbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSBmYWxzZTtcclxuICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZXhlID0gcGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIGxzTGliLmluc3RhbGxhdGlvblBhdGgsICd0b29scycsICdkaXZpbmUuZXhlJyk7XHJcbiAgICBjb25zdCBhcmdzID0gW1xyXG4gICAgICAnLS1hY3Rpb24nLCBhY3Rpb24sXHJcbiAgICAgICctLXNvdXJjZScsIGBcIiR7ZGl2aW5lT3B0cy5zb3VyY2V9XCJgLFxyXG4gICAgICAnLS1nYW1lJywgJ2JnMycsXHJcbiAgICBdO1xyXG5cclxuICAgIGlmIChkaXZpbmVPcHRzLmxvZ2xldmVsICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXJncy5wdXNoKCctLWxvZ2xldmVsJywgZGl2aW5lT3B0cy5sb2dsZXZlbCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBhcmdzLnB1c2goJy0tbG9nbGV2ZWwnLCAnb2ZmJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGRpdmluZU9wdHMuZGVzdGluYXRpb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhcmdzLnB1c2goJy0tZGVzdGluYXRpb24nLCBgXCIke2RpdmluZU9wdHMuZGVzdGluYXRpb259XCJgKTtcclxuICAgIH1cclxuICAgIGlmIChkaXZpbmVPcHRzLmV4cHJlc3Npb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhcmdzLnB1c2goJy0tZXhwcmVzc2lvbicsIGBcIiR7ZGl2aW5lT3B0cy5leHByZXNzaW9ufVwiYCk7XHJcbiAgICB9XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgY29tbWFuZCA9IGBcIiR7ZXhlfVwiICR7YXJncy5qb2luKCcgJyl9YDtcclxuICAgICAgY29uc3QgeyBzdGRvdXQsIHN0ZGVyciB9ID0gYXdhaXQgZXhlYyhjb21tYW5kLCBleGVjT3B0cyk7XHJcbiAgICAgIGlmICghIXN0ZGVycikge1xyXG4gICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtzdGRlcnJ9YCkpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghc3Rkb3V0ICYmIGFjdGlvbiAhPT0gJ2xpc3QtcGFja2FnZScpIHtcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IHN0ZG91dDogJycsIHJldHVybkNvZGU6IDIgfSlcclxuICAgICAgfSAgICAgIFxyXG4gICAgICBjb25zdCBzdGRvdXRTdHIgPSB0eXBlb2Ygc3Rkb3V0ID09PSAnc3RyaW5nJyA/IHN0ZG91dCA6IHN0ZG91dD8udG9TdHJpbmc/LigpID8/ICcnO1xyXG4gICAgICBpZiAoWydlcnJvcicsICdmYXRhbCddLnNvbWUoeCA9PiBzdGRvdXRTdHIudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKHgpKSkge1xyXG4gICAgICAgIC8vIFJlYWxseT9cclxuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihgZGl2aW5lLmV4ZSBmYWlsZWQ6ICR7c3Rkb3V0U3RyfWApKTtcclxuICAgICAgfSBlbHNlICB7XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBzdGRvdXQ6IHN0ZG91dFN0ciwgcmV0dXJuQ29kZTogMCB9KTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBEaXZpbmVFeGVjTWlzc2luZygpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ1lvdSBtdXN0IGluc3RhbGwgb3IgdXBkYXRlIC5ORVQnKSkge1xyXG4gICAgICAgIHJldHVybiByZWplY3QobmV3IERpdmluZU1pc3NpbmdEb3ROZXQoKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtlcnIubWVzc2FnZX1gKTtcclxuICAgICAgZXJyb3JbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSB0cnVlO1xyXG4gICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWsoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoLCBkZXN0UGF0aCwgcGF0dGVybikge1xyXG4gIHJldHVybiBydW5EaXZpbmUoYXBpLCAnZXh0cmFjdC1wYWNrYWdlJyxcclxuICAgIHsgc291cmNlOiBwYWtQYXRoLCBkZXN0aW5hdGlvbjogZGVzdFBhdGgsIGV4cHJlc3Npb246IHBhdHRlcm4gfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0UGFja2FnZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBsZXQgcmVzO1xyXG4gIHRyeSB7XHJcbiAgICByZXMgPSBhd2FpdCBydW5EaXZpbmUoYXBpLCAnbGlzdC1wYWNrYWdlJywgeyBzb3VyY2U6IHBha1BhdGgsIGxvZ2xldmVsOiAnb2ZmJyB9KTtcclxuICB9IGNhdGNoIChlcnJvcikgeyAgICBcclxuICAgIGxvZ0Vycm9yKGBsaXN0UGFja2FnZSBjYXVnaHQgZXJyb3I6IGAsIHsgZXJyb3IgfSk7XHJcbiAgICAvL2xvZygnZGVidWcnLCAnbGlzdFBhY2thZ2UgZXJyb3InLCBlcnJvci5tZXNzYWdlKTtcclxuXHJcbiAgICBpZihlcnJvciBpbnN0YW5jZW9mIERpdmluZU1pc3NpbmdEb3ROZXQpIHsgIFxyXG4gICAgICBsb2coJ2Vycm9yJywgJ01pc3NpbmcgLk5FVCcsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignYmczLXJlYWRpbmctcGFrcy1hY3Rpdml0eScpO1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdMU0xpYiByZXF1aXJlcyAuTkVUIDgnLCBcclxuICAgICAgJ0xTTGliIHJlcXVpcmVzIC5ORVQgOCBEZXNrdG9wIFJ1bnRpbWUgdG8gYmUgaW5zdGFsbGVkLicgK1xyXG4gICAgICAnW2JyXVsvYnJdW2JyXVsvYnJdJyArXHJcbiAgICAgICdbbGlzdD0xXVsqXURvd25sb2FkIGFuZCBJbnN0YWxsIFt1cmw9aHR0cHM6Ly9kb3RuZXQubWljcm9zb2Z0LmNvbS9lbi11cy9kb3dubG9hZC9kb3RuZXQvdGhhbmsteW91L3J1bnRpbWUtZGVza3RvcC04LjAuMy13aW5kb3dzLXg2NC1pbnN0YWxsZXJdLk5FVCA4LjAgRGVza3RvcCBSdW50aW1lIGZyb20gTWljcm9zb2Z0Wy91cmxdJyAgKyBcclxuICAgICAgJ1sqXUNsb3NlIFZvcnRleCcgKyBcclxuICAgICAgJ1sqXVJlc3RhcnQgQ29tcHV0ZXInICsgXHJcbiAgICAgICdbKl1PcGVuIFZvcnRleFsvbGlzdF0nLFxyXG4gICAgICAgeyBpZDogJ2JnMy1kb3RuZXQtZXJyb3InLCBhbGxvd1JlcG9ydDogZmFsc2UsIGlzQkJDb2RlOiB0cnVlIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy9sb2dEZWJ1ZyhgbGlzdFBhY2thZ2UgcmVzPWAsIHJlcyk7XHJcbiAgY29uc3QgbGluZXMgPSAocmVzPy5zdGRvdXQgfHwgJycpLnNwbGl0KCdcXG4nKS5tYXAobGluZSA9PiBsaW5lLnRyaW0oKSkuZmlsdGVyKGxpbmUgPT4gbGluZS5sZW5ndGggIT09IDApO1xyXG5cclxuICAvL2xvZ0RlYnVnKGBsaXN0UGFja2FnZSBsaW5lcz1gLCBsaW5lcyk7XHJcblxyXG4gIHJldHVybiBsaW5lcztcclxufSJdfQ==