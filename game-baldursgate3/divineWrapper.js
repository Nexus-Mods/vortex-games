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
                if (!stdout) {
                    return resolve({ stdout: '', returnCode: 2 });
                }
                if (['error', 'fatal'].some(x => stdout.toLowerCase().indexOf(x) !== -1)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGl2aW5lV3JhcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpdmluZVdyYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBNkI7QUFDN0IsMkNBQW9EO0FBRXBELHFDQUFtQztBQUVuQyxpQ0FBcUQ7QUFFckQsK0NBQWlDO0FBQ2pDLDZEQUErQztBQUUvQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUdwRCxNQUFNLGtCQUFrQixHQUE0QixJQUFJLGlCQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBSS9GLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQztBQUV6QixNQUFhLGlCQUFrQixTQUFRLEtBQUs7SUFDMUM7UUFDRSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFtQixDQUFDO0lBQ2xDLENBQUM7Q0FDRjtBQUxELDhDQUtDO0FBRUQsTUFBYSxjQUFlLFNBQVEsS0FBSztJQUN2QztRQUNFLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUM7SUFDL0IsQ0FBQztDQUNGO0FBTEQsd0NBS0M7QUFFRCxNQUFNLFFBQVEsR0FBOEI7SUFDMUMsT0FBTyxFQUFFLFVBQVU7Q0FDcEIsQ0FBQztBQUVGLFNBQWUsU0FBUyxDQUFDLEdBQXdCLEVBQ3hCLE1BQW9CLEVBQ3BCLFVBQTBCOztRQUVqRCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLEdBQVMsRUFBRTtZQUN2RSxJQUFJO2dCQUNGLE1BQU0sTUFBTSxHQUFHLE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUMvRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN4QjtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3BCO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO0lBQ04sQ0FBQztDQUFBO0FBRUQsU0FBZSxNQUFNLENBQUMsR0FBd0IsRUFDNUMsTUFBb0IsRUFDcEIsVUFBMEIsRUFDMUIsUUFBbUM7O1FBQ25DLE9BQU8sSUFBSSxPQUFPLENBQWdCLENBQU8sT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzFELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUM3QixNQUFNLGFBQWEsR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDbkUsTUFBTSxLQUFLLEdBQWUsSUFBQSx3QkFBaUIsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUNqRCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7Z0JBQ3ZCLE1BQU0sR0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7Z0JBQ3RELEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLEtBQUssQ0FBQztnQkFDakMsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDcEI7WUFDRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsZ0JBQWdCLEVBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQ3BGLE1BQU0sSUFBSSxHQUFHO2dCQUNYLFVBQVUsRUFBRSxNQUFNO2dCQUNsQixVQUFVLEVBQUUsSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHO2dCQUNwQyxRQUFRLEVBQUUsS0FBSzthQUNoQixDQUFDO1lBRUYsSUFBSSxVQUFVLENBQUMsUUFBUSxLQUFLLFNBQVMsRUFBRTtnQkFDckMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzlDO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ2hDO1lBRUQsSUFBSSxVQUFVLENBQUMsV0FBVyxLQUFLLFNBQVMsRUFBRTtnQkFDeEMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxVQUFVLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQzthQUMzRDtZQUNELElBQUksVUFBVSxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7Z0JBQ3ZDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksVUFBVSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7YUFDekQ7WUFFRCxJQUFJO2dCQUNGLE1BQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDM0MsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRTtvQkFDWixPQUFPLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUMxRDtnQkFDRCxJQUFJLENBQUMsTUFBTSxFQUFFO29CQUNYLE9BQU8sT0FBTyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQTtpQkFDOUM7Z0JBQ0QsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7b0JBRXhFLE9BQU8sTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLHNCQUFzQixNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQzFEO3FCQUFPO29CQUNOLE9BQU8sT0FBTyxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2lCQUMzQzthQUNGO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtvQkFDekIsT0FBTyxNQUFNLENBQUMsSUFBSSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7aUJBQ3hDO2dCQUNELE1BQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLHNCQUFzQixHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDN0QsS0FBSyxDQUFDLG1CQUFtQixDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUNsQyxPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN0QjtRQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQUE7QUFFRCxTQUFzQixVQUFVLENBQUMsR0FBd0IsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU87O1FBQ25GLE9BQU8sU0FBUyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFDckMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDckUsQ0FBQztDQUFBO0FBSEQsZ0NBR0M7QUFFRCxTQUFzQixXQUFXLENBQUMsR0FBd0IsRUFBRSxPQUFlOztRQUN6RSxJQUFJLEdBQUcsQ0FBQztRQUNSLElBQUk7WUFDRixHQUFHLEdBQUcsTUFBTSxTQUFTLENBQUMsR0FBRyxFQUFFLGNBQWMsRUFBRSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDbEY7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLElBQUEsZUFBUSxFQUFDLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQy9DO1FBR0QsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFBLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxNQUFNLEtBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFJekcsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQUE7QUFkRCxrQ0FjQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgRGl2aW5lQWN0aW9uLCBJRGl2aW5lT3B0aW9ucywgSURpdmluZU91dHB1dCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgZ2V0TGF0ZXN0TFNMaWJNb2QsIGxvZ0Vycm9yIH0gZnJvbSAnLi91dGlsJztcblxuaW1wb3J0ICogYXMgbm9kZVV0aWwgZnJvbSAndXRpbCc7XG5pbXBvcnQgKiBhcyBjaGlsZF9wcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuXG5jb25zdCBleGVjID0gbm9kZVV0aWwucHJvbWlzaWZ5KGNoaWxkX3Byb2Nlc3MuZXhlYyk7XG5cbi8vIFJ1biA1IGNvbmN1cnJlbnQgRGl2aW5lIHByb2Nlc3NlcyAtIHJldHJ5IGVhY2ggcHJvY2VzcyA1IHRpbWVzIGlmIGl0IGZhaWxzLlxuY29uc3QgY29uY3VycmVuY3lMaW1pdGVyOiB1dGlsLkNvbmN1cnJlbmN5TGltaXRlciA9IG5ldyB1dGlsLkNvbmN1cnJlbmN5TGltaXRlcig1LCAoKSA9PiB0cnVlKTtcblxuLy8gVGhpcyBpcyBwcm9iYWJseSBvdmVya2lsbCAtIG1vZCBleHRyYWN0aW9uIHNob3VsZG4ndCB0YWtlXG4vLyAgbW9yZSB0aGFuIGEgZmV3IHNlY29uZHMuXG5jb25zdCBUSU1FT1VUX01TID0gMTAwMDA7XG5cbmV4cG9ydCBjbGFzcyBEaXZpbmVFeGVjTWlzc2luZyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoJ0RpdmluZSBleGVjdXRhYmxlIGlzIG1pc3NpbmcnKTtcbiAgICB0aGlzLm5hbWUgPSAnRGl2aW5lRXhlY01pc3NpbmcnO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEaXZpbmVUaW1lZE91dCBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoJ0RpdmluZSBwcm9jZXNzIHRpbWVkIG91dCcpO1xuICAgIHRoaXMubmFtZSA9ICdEaXZpbmVUaW1lZE91dCc7XG4gIH1cbn1cblxuY29uc3QgZXhlY09wdHM6IGNoaWxkX3Byb2Nlc3MuRXhlY09wdGlvbnMgPSB7XG4gIHRpbWVvdXQ6IFRJTUVPVVRfTVMsXG59O1xuXG5hc3luYyBmdW5jdGlvbiBydW5EaXZpbmUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogRGl2aW5lQWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGRpdmluZU9wdHM6IElEaXZpbmVPcHRpb25zKVxuICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTxJRGl2aW5lT3V0cHV0PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiBjb25jdXJyZW5jeUxpbWl0ZXIuZG8oYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkaXZpbmUoYXBpLCBhY3Rpb24sIGRpdmluZU9wdHMsIGV4ZWNPcHRzKTtcbiAgICAgIHJldHVybiByZXNvbHZlKHJlc3VsdCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgfVxuICB9KSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRpdmluZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gIGFjdGlvbjogRGl2aW5lQWN0aW9uLFxuICBkaXZpbmVPcHRzOiBJRGl2aW5lT3B0aW9ucyxcbiAgZXhlY09wdHM6IGNoaWxkX3Byb2Nlc3MuRXhlY09wdGlvbnMpOiBQcm9taXNlPElEaXZpbmVPdXRwdXQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPElEaXZpbmVPdXRwdXQ+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBsc0xpYjogdHlwZXMuSU1vZCA9IGdldExhdGVzdExTTGliTW9kKGFwaSk7XG4gICAgaWYgKGxzTGliID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGVyciA9IG5ldyBFcnJvcignTFNMaWIvRGl2aW5lIHRvb2wgaXMgbWlzc2luZycpO1xuICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gZmFsc2U7XG4gICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgfVxuICAgIGNvbnN0IGV4ZSA9IHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBsc0xpYi5pbnN0YWxsYXRpb25QYXRoLCAndG9vbHMnLCAnZGl2aW5lLmV4ZScpO1xuICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICAnLS1hY3Rpb24nLCBhY3Rpb24sXG4gICAgICAnLS1zb3VyY2UnLCBgXCIke2RpdmluZU9wdHMuc291cmNlfVwiYCxcbiAgICAgICctLWdhbWUnLCAnYmczJyxcbiAgICBdO1xuXG4gICAgaWYgKGRpdmluZU9wdHMubG9nbGV2ZWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXJncy5wdXNoKCctLWxvZ2xldmVsJywgZGl2aW5lT3B0cy5sb2dsZXZlbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFyZ3MucHVzaCgnLS1sb2dsZXZlbCcsICdvZmYnKTtcbiAgICB9XG5cbiAgICBpZiAoZGl2aW5lT3B0cy5kZXN0aW5hdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhcmdzLnB1c2goJy0tZGVzdGluYXRpb24nLCBgXCIke2RpdmluZU9wdHMuZGVzdGluYXRpb259XCJgKTtcbiAgICB9XG4gICAgaWYgKGRpdmluZU9wdHMuZXhwcmVzc2lvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhcmdzLnB1c2goJy0tZXhwcmVzc2lvbicsIGBcIiR7ZGl2aW5lT3B0cy5leHByZXNzaW9ufVwiYCk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBgJHtleGV9ICR7YXJncy5qb2luKCcgJyl9YDtcbiAgICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWMoY29tbWFuZCwgZXhlY09wdHMpO1xuICAgICAgaWYgKCEhc3RkZXJyKSB7XG4gICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtzdGRlcnJ9YCkpO1xuICAgICAgfVxuICAgICAgaWYgKCFzdGRvdXQpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBzdGRvdXQ6ICcnLCByZXR1cm5Db2RlOiAyIH0pXG4gICAgICB9XG4gICAgICBpZiAoWydlcnJvcicsICdmYXRhbCddLnNvbWUoeCA9PiBzdGRvdXQudG9Mb3dlckNhc2UoKS5pbmRleE9mKHgpICE9PSAtMSkpIHtcbiAgICAgICAgLy8gUmVhbGx5P1xuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihgZGl2aW5lLmV4ZSBmYWlsZWQ6ICR7c3Rkb3V0fWApKTtcbiAgICAgIH0gZWxzZSAge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IHN0ZG91dCwgcmV0dXJuQ29kZTogMCB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcbiAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRGl2aW5lRXhlY01pc3NpbmcoKSk7XG4gICAgICB9XG4gICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgZGl2aW5lLmV4ZSBmYWlsZWQ6ICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICBlcnJvclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IHRydWU7XG4gICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBhayhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGgsIGRlc3RQYXRoLCBwYXR0ZXJuKSB7XG4gIHJldHVybiBydW5EaXZpbmUoYXBpLCAnZXh0cmFjdC1wYWNrYWdlJyxcbiAgICB7IHNvdXJjZTogcGFrUGF0aCwgZGVzdGluYXRpb246IGRlc3RQYXRoLCBleHByZXNzaW9uOiBwYXR0ZXJuIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlzdFBhY2thZ2UoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGxldCByZXM7XG4gIHRyeSB7XG4gICAgcmVzID0gYXdhaXQgcnVuRGl2aW5lKGFwaSwgJ2xpc3QtcGFja2FnZScsIHsgc291cmNlOiBwYWtQYXRoLCBsb2dsZXZlbDogJ29mZicgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nRXJyb3IoYGxpc3RQYWNrYWdlIGNhdWdodCBlcnJvcjogYCwgZXJyb3IpO1xuICB9XG5cbiAgLy9sb2dEZWJ1ZyhgbGlzdFBhY2thZ2UgcmVzPWAsIHJlcyk7XG4gIGNvbnN0IGxpbmVzID0gKHJlcz8uc3Rkb3V0IHx8ICcnKS5zcGxpdCgnXFxuJykubWFwKGxpbmUgPT4gbGluZS50cmltKCkpLmZpbHRlcihsaW5lID0+IGxpbmUubGVuZ3RoICE9PSAwKTtcblxuICAvL2xvZ0RlYnVnKGBsaXN0UGFja2FnZSBsaW5lcz1gLCBsaW5lcyk7XG5cbiAgcmV0dXJuIGxpbmVzO1xufSJdfQ==