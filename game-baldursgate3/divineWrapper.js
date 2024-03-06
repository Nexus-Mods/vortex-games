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
exports.listPackage = exports.extractPak = exports.DivineTimedOut = exports.DivineExecMissing = void 0;
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
                const command = `${exe} ${args.join(' ')}`;
                const { stdout, stderr } = yield exec(command, execOpts);
                if (!!stderr) {
                    return reject(new Error(`divine.exe failed: ${stderr}`));
                }
                if (!stdout && action !== 'list-package') {
                    return resolve({ stdout: '', returnCode: 2 });
                }
                if (['error', 'fatal'].some(x => stdout.toLowerCase().startsWith(x))) {
                    return reject(new Error(`divine.exe failed: ${stdout}`));
                }
                else {
                    return resolve({ stdout, returnCode: 0 });
                }
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    return reject(new DivineExecMissing());
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
exports.extractPak = extractPak;
function listPackage(api, pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let res;
        try {
            res = yield runDivine(api, 'list-package', { source: pakPath, loglevel: 'off' });
        }
        catch (error) {
            (0, util_1.logError)(`listPackage caught error: `, error);
        }
        const lines = ((res === null || res === void 0 ? void 0 : res.stdout) || '').split('\n').map(line => line.trim()).filter(line => line.length !== 0);
        return lines;
    });
}
exports.listPackage = listPackage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGl2aW5lV3JhcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpdmluZVdyYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBNkI7QUFDN0IsMkNBQW9EO0FBRXBELHFDQUFtQztBQUVuQyxpQ0FBcUQ7QUFFckQsK0NBQWlDO0FBQ2pDLDZEQUErQztBQUUvQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUdwRCxNQUFNLGtCQUFrQixHQUE0QixJQUFJLGlCQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBSS9GLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQztBQUV6QixNQUFhLGlCQUFrQixTQUFRLEtBQUs7SUFDMUM7UUFDRSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFtQixDQUFDO0lBQ2xDLENBQUM7Q0FDRjtBQUxELDhDQUtDO0FBRUQsTUFBYSxjQUFlLFNBQVEsS0FBSztJQUN2QztRQUNFLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUM7SUFDL0IsQ0FBQztDQUNGO0FBTEQsd0NBS0M7QUFFRCxNQUFNLFFBQVEsR0FBOEI7SUFDMUMsT0FBTyxFQUFFLFVBQVU7Q0FDcEIsQ0FBQztBQUVGLFNBQWUsU0FBUyxDQUFDLEdBQXdCLEVBQ3hCLE1BQW9CLEVBQ3BCLFVBQTBCOztRQUVqRCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLEdBQVMsRUFBRTtZQUN2RSxJQUFJO2dCQUNGLE1BQU0sTUFBTSxHQUFHLE1B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RTtZQUNkLElBQUEsZUFBUSxFQUFDLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQy9DO1FBR0QsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFBLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxNQUFNLEtBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFJekcsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQUE7QUFkRCxrQ0FjQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IERpdmluZUFjdGlvbiwgSURpdmluZU9wdGlvbnMsIElEaXZpbmVPdXRwdXQgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2V0TGF0ZXN0TFNMaWJNb2QsIGxvZ0Vycm9yIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCAqIGFzIG5vZGVVdGlsIGZyb20gJ3V0aWwnO1xyXG5pbXBvcnQgKiBhcyBjaGlsZF9wcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5cclxuY29uc3QgZXhlYyA9IG5vZGVVdGlsLnByb21pc2lmeShjaGlsZF9wcm9jZXNzLmV4ZWMpO1xyXG5cclxuLy8gUnVuIDUgY29uY3VycmVudCBEaXZpbmUgcHJvY2Vzc2VzIC0gcmV0cnkgZWFjaCBwcm9jZXNzIDUgdGltZXMgaWYgaXQgZmFpbHMuXHJcbmNvbnN0IGNvbmN1cnJlbmN5TGltaXRlcjogdXRpbC5Db25jdXJyZW5jeUxpbWl0ZXIgPSBuZXcgdXRpbC5Db25jdXJyZW5jeUxpbWl0ZXIoNSwgKCkgPT4gdHJ1ZSk7XHJcblxyXG4vLyBUaGlzIGlzIHByb2JhYmx5IG92ZXJraWxsIC0gbW9kIGV4dHJhY3Rpb24gc2hvdWxkbid0IHRha2VcclxuLy8gIG1vcmUgdGhhbiBhIGZldyBzZWNvbmRzLlxyXG5jb25zdCBUSU1FT1VUX01TID0gMTAwMDA7XHJcblxyXG5leHBvcnQgY2xhc3MgRGl2aW5lRXhlY01pc3NpbmcgZXh0ZW5kcyBFcnJvciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzdXBlcignRGl2aW5lIGV4ZWN1dGFibGUgaXMgbWlzc2luZycpO1xyXG4gICAgdGhpcy5uYW1lID0gJ0RpdmluZUV4ZWNNaXNzaW5nJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBEaXZpbmVUaW1lZE91dCBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3RvcigpIHtcclxuICAgIHN1cGVyKCdEaXZpbmUgcHJvY2VzcyB0aW1lZCBvdXQnKTtcclxuICAgIHRoaXMubmFtZSA9ICdEaXZpbmVUaW1lZE91dCc7XHJcbiAgfVxyXG59XHJcblxyXG5jb25zdCBleGVjT3B0czogY2hpbGRfcHJvY2Vzcy5FeGVjT3B0aW9ucyA9IHtcclxuICB0aW1lb3V0OiBUSU1FT1VUX01TLFxyXG59O1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gcnVuRGl2aW5lKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogRGl2aW5lQWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgZGl2aW5lT3B0czogSURpdmluZU9wdGlvbnMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8SURpdmluZU91dHB1dD4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiBjb25jdXJyZW5jeUxpbWl0ZXIuZG8oYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZGl2aW5lKGFwaSwgYWN0aW9uLCBkaXZpbmVPcHRzLCBleGVjT3B0cyk7XHJcbiAgICAgIHJldHVybiByZXNvbHZlKHJlc3VsdCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xyXG4gICAgfVxyXG4gIH0pKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZGl2aW5lKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICBhY3Rpb246IERpdmluZUFjdGlvbixcclxuICBkaXZpbmVPcHRzOiBJRGl2aW5lT3B0aW9ucyxcclxuICBleGVjT3B0czogY2hpbGRfcHJvY2Vzcy5FeGVjT3B0aW9ucyk6IFByb21pc2U8SURpdmluZU91dHB1dD4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZTxJRGl2aW5lT3V0cHV0Pihhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgbHNMaWI6IHR5cGVzLklNb2QgPSBnZXRMYXRlc3RMU0xpYk1vZChhcGkpO1xyXG4gICAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKCdMU0xpYi9EaXZpbmUgdG9vbCBpcyBtaXNzaW5nJyk7XHJcbiAgICAgIGVyclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IGZhbHNlO1xyXG4gICAgICByZXR1cm4gcmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgICBjb25zdCBleGUgPSBwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgbHNMaWIuaW5zdGFsbGF0aW9uUGF0aCwgJ3Rvb2xzJywgJ2RpdmluZS5leGUnKTtcclxuICAgIGNvbnN0IGFyZ3MgPSBbXHJcbiAgICAgICctLWFjdGlvbicsIGFjdGlvbixcclxuICAgICAgJy0tc291cmNlJywgYFwiJHtkaXZpbmVPcHRzLnNvdXJjZX1cImAsXHJcbiAgICAgICctLWdhbWUnLCAnYmczJyxcclxuICAgIF07XHJcblxyXG4gICAgaWYgKGRpdmluZU9wdHMubG9nbGV2ZWwgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhcmdzLnB1c2goJy0tbG9nbGV2ZWwnLCBkaXZpbmVPcHRzLmxvZ2xldmVsKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1sb2dsZXZlbCcsICdvZmYnKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoZGl2aW5lT3B0cy5kZXN0aW5hdGlvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1kZXN0aW5hdGlvbicsIGBcIiR7ZGl2aW5lT3B0cy5kZXN0aW5hdGlvbn1cImApO1xyXG4gICAgfVxyXG4gICAgaWYgKGRpdmluZU9wdHMuZXhwcmVzc2lvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1leHByZXNzaW9uJywgYFwiJHtkaXZpbmVPcHRzLmV4cHJlc3Npb259XCJgKTtcclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBjb21tYW5kID0gYCR7ZXhlfSAke2FyZ3Muam9pbignICcpfWA7XHJcbiAgICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWMoY29tbWFuZCwgZXhlY09wdHMpO1xyXG4gICAgICBpZiAoISFzdGRlcnIpIHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihgZGl2aW5lLmV4ZSBmYWlsZWQ6ICR7c3RkZXJyfWApKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIXN0ZG91dCAmJiBhY3Rpb24gIT09ICdsaXN0LXBhY2thZ2UnKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBzdGRvdXQ6ICcnLCByZXR1cm5Db2RlOiAyIH0pXHJcbiAgICAgIH1cclxuICAgICAgaWYgKFsnZXJyb3InLCAnZmF0YWwnXS5zb21lKHggPT4gc3Rkb3V0LnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCh4KSkpIHtcclxuICAgICAgICAvLyBSZWFsbHk/XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoYGRpdmluZS5leGUgZmFpbGVkOiAke3N0ZG91dH1gKSk7XHJcbiAgICAgIH0gZWxzZSAge1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKHsgc3Rkb3V0LCByZXR1cm5Db2RlOiAwIH0pO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xyXG4gICAgICAgIHJldHVybiByZWplY3QobmV3IERpdmluZUV4ZWNNaXNzaW5nKCkpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtlcnIubWVzc2FnZX1gKTtcclxuICAgICAgZXJyb3JbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSB0cnVlO1xyXG4gICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWsoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoLCBkZXN0UGF0aCwgcGF0dGVybikge1xyXG4gIHJldHVybiBydW5EaXZpbmUoYXBpLCAnZXh0cmFjdC1wYWNrYWdlJyxcclxuICAgIHsgc291cmNlOiBwYWtQYXRoLCBkZXN0aW5hdGlvbjogZGVzdFBhdGgsIGV4cHJlc3Npb246IHBhdHRlcm4gfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0UGFja2FnZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBsZXQgcmVzO1xyXG4gIHRyeSB7XHJcbiAgICByZXMgPSBhd2FpdCBydW5EaXZpbmUoYXBpLCAnbGlzdC1wYWNrYWdlJywgeyBzb3VyY2U6IHBha1BhdGgsIGxvZ2xldmVsOiAnb2ZmJyB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgbG9nRXJyb3IoYGxpc3RQYWNrYWdlIGNhdWdodCBlcnJvcjogYCwgZXJyb3IpO1xyXG4gIH1cclxuXHJcbiAgLy9sb2dEZWJ1ZyhgbGlzdFBhY2thZ2UgcmVzPWAsIHJlcyk7XHJcbiAgY29uc3QgbGluZXMgPSAocmVzPy5zdGRvdXQgfHwgJycpLnNwbGl0KCdcXG4nKS5tYXAobGluZSA9PiBsaW5lLnRyaW0oKSkuZmlsdGVyKGxpbmUgPT4gbGluZS5sZW5ndGggIT09IDApO1xyXG5cclxuICAvL2xvZ0RlYnVnKGBsaXN0UGFja2FnZSBsaW5lcz1gLCBsaW5lcyk7XHJcblxyXG4gIHJldHVybiBsaW5lcztcclxufSJdfQ==