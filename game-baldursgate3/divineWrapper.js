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
exports.listPackage = exports.extractPak = exports.DivineTimedOut = exports.DivineMissingDotNet = exports.DivineExecMissing = void 0;
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
exports.extractPak = extractPak;
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
exports.listPackage = listPackage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGl2aW5lV3JhcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpdmluZVdyYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwyQ0FBNkI7QUFDN0IsMkNBQXlEO0FBRXpELHFDQUFtQztBQUVuQyxpQ0FBcUQ7QUFFckQsK0NBQWlDO0FBQ2pDLDZEQUErQztBQUUvQyxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUdwRCxNQUFNLGtCQUFrQixHQUE0QixJQUFJLGlCQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBSS9GLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQztBQUV6QixNQUFhLGlCQUFrQixTQUFRLEtBQUs7SUFDMUM7UUFDRSxLQUFLLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFtQixDQUFDO0lBQ2xDLENBQUM7Q0FDRjtBQUxELDhDQUtDO0FBRUQsTUFBYSxtQkFBb0IsU0FBUSxLQUFLO0lBQzVDO1FBQ0UsS0FBSyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7UUFDaEUsSUFBSSxDQUFDLElBQUksR0FBRyxxQkFBcUIsQ0FBQztJQUNwQyxDQUFDO0NBQ0Y7QUFMRCxrREFLQztBQUVELE1BQWEsY0FBZSxTQUFRLEtBQUs7SUFDdkM7UUFDRSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLGdCQUFnQixDQUFDO0lBQy9CLENBQUM7Q0FDRjtBQUxELHdDQUtDO0FBRUQsTUFBTSxRQUFRLEdBQThCO0lBQzFDLE9BQU8sRUFBRSxVQUFVO0NBQ3BCLENBQUM7QUFFRixTQUFlLFNBQVMsQ0FBQyxHQUF3QixFQUN4QixNQUFvQixFQUNwQixVQUEwQjs7UUFFakQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxHQUFTLEVBQUU7WUFDdkUsSUFBSTtnQkFDRixNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDL0QsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDeEI7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNwQjtRQUNILENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztJQUNOLENBQUM7Q0FBQTtBQUVELFNBQWUsTUFBTSxDQUFDLEdBQXdCLEVBQzVDLE1BQW9CLEVBQ3BCLFVBQTBCLEVBQzFCLFFBQW1DOztRQUNuQyxPQUFPLElBQUksT0FBTyxDQUFnQixDQUFPLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUMxRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDN0IsTUFBTSxhQUFhLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ25FLE1BQU0sS0FBSyxHQUFlLElBQUEsd0JBQWlCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDakQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO2dCQUN2QixNQUFNLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO2dCQUN0RCxHQUFHLENBQUMsbUJBQW1CLENBQUMsR0FBRyxLQUFLLENBQUM7Z0JBQ2pDLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3BCO1lBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixFQUFFLE9BQU8sRUFBRSxZQUFZLENBQUMsQ0FBQztZQUNwRixNQUFNLElBQUksR0FBRztnQkFDWCxVQUFVLEVBQUUsTUFBTTtnQkFDbEIsVUFBVSxFQUFFLElBQUksVUFBVSxDQUFDLE1BQU0sR0FBRztnQkFDcEMsUUFBUSxFQUFFLEtBQUs7YUFDaEIsQ0FBQztZQUVGLElBQUksVUFBVSxDQUFDLFFBQVEsS0FBSyxTQUFTLEVBQUU7Z0JBQ3JDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUM5QztpQkFBTTtnQkFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQzthQUNoQztZQUVELElBQUksVUFBVSxDQUFDLFdBQVcsS0FBSyxTQUFTLEVBQUU7Z0JBQ3hDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksVUFBVSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7YUFDM0Q7WUFDRCxJQUFJLFVBQVUsQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLFVBQVUsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO2FBQ3pEO1lBRUQsSUFBSTtnQkFDRixNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzdDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUU7b0JBQ1osT0FBTyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztpQkFDMUQ7Z0JBQ0QsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLEtBQUssY0FBYyxFQUFFO29CQUN4QyxPQUFPLE9BQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7aUJBQzlDO2dCQUNELElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO29CQUVwRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUMxRDtxQkFBTztvQkFDTixPQUFPLE9BQU8sQ0FBQyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFDM0M7YUFDRjtZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7b0JBQ3pCLE9BQU8sTUFBTSxDQUFDLElBQUksaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO2lCQUN4QztnQkFFRCxJQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGlDQUFpQyxDQUFDLEVBQUU7b0JBQzFELE9BQU8sTUFBTSxDQUFDLElBQUksbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO2lCQUMxQztnQkFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQzdELEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDbEMsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdEI7UUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUFBO0FBRUQsU0FBc0IsVUFBVSxDQUFDLEdBQXdCLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPOztRQUNuRixPQUFPLFNBQVMsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQ3JDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7Q0FBQTtBQUhELGdDQUdDO0FBRUQsU0FBc0IsV0FBVyxDQUFDLEdBQXdCLEVBQUUsT0FBZTs7UUFDekUsSUFBSSxHQUFHLENBQUM7UUFDUixJQUFJO1lBQ0YsR0FBRyxHQUFHLE1BQU0sU0FBUyxDQUFDLEdBQUcsRUFBRSxjQUFjLEVBQUUsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1NBQ2xGO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxJQUFBLGVBQVEsRUFBQyw0QkFBNEIsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFHbEQsSUFBRyxLQUFLLFlBQVksbUJBQW1CLEVBQUU7Z0JBQ3ZDLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsY0FBYyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDNUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLDJCQUEyQixDQUFDLENBQUM7Z0JBQ3JELEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFDakQsd0RBQXdEO29CQUN4RCxvQkFBb0I7b0JBQ3BCLDZMQUE2TDtvQkFDN0wsaUJBQWlCO29CQUNqQixxQkFBcUI7b0JBQ3JCLHVCQUF1QixFQUN0QixFQUFFLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2FBQ2xFO1NBQ0Y7UUFHRCxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLE1BQU0sS0FBSSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQztRQUl6RyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FBQTtBQTVCRCxrQ0E0QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IERpdmluZUFjdGlvbiwgSURpdmluZU9wdGlvbnMsIElEaXZpbmVPdXRwdXQgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2V0TGF0ZXN0TFNMaWJNb2QsIGxvZ0Vycm9yIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCAqIGFzIG5vZGVVdGlsIGZyb20gJ3V0aWwnO1xyXG5pbXBvcnQgKiBhcyBjaGlsZF9wcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5cclxuY29uc3QgZXhlYyA9IG5vZGVVdGlsLnByb21pc2lmeShjaGlsZF9wcm9jZXNzLmV4ZWMpO1xyXG5cclxuLy8gUnVuIDUgY29uY3VycmVudCBEaXZpbmUgcHJvY2Vzc2VzIC0gcmV0cnkgZWFjaCBwcm9jZXNzIDUgdGltZXMgaWYgaXQgZmFpbHMuXHJcbmNvbnN0IGNvbmN1cnJlbmN5TGltaXRlcjogdXRpbC5Db25jdXJyZW5jeUxpbWl0ZXIgPSBuZXcgdXRpbC5Db25jdXJyZW5jeUxpbWl0ZXIoNSwgKCkgPT4gdHJ1ZSk7XHJcblxyXG4vLyBUaGlzIGlzIHByb2JhYmx5IG92ZXJraWxsIC0gbW9kIGV4dHJhY3Rpb24gc2hvdWxkbid0IHRha2VcclxuLy8gIG1vcmUgdGhhbiBhIGZldyBzZWNvbmRzLlxyXG5jb25zdCBUSU1FT1VUX01TID0gMTAwMDA7XHJcblxyXG5leHBvcnQgY2xhc3MgRGl2aW5lRXhlY01pc3NpbmcgZXh0ZW5kcyBFcnJvciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzdXBlcignRGl2aW5lIGV4ZWN1dGFibGUgaXMgbWlzc2luZycpO1xyXG4gICAgdGhpcy5uYW1lID0gJ0RpdmluZUV4ZWNNaXNzaW5nJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBEaXZpbmVNaXNzaW5nRG90TmV0IGV4dGVuZHMgRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgc3VwZXIoJ0xTTGliIHJlcXVpcmVzIC5ORVQgOCBEZXNrdG9wIFJ1bnRpbWUgdG8gYmUgaW5zdGFsbGVkLicpO1xyXG4gICAgdGhpcy5uYW1lID0gJ0RpdmluZU1pc3NpbmdEb3ROZXQnO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERpdmluZVRpbWVkT3V0IGV4dGVuZHMgRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgc3VwZXIoJ0RpdmluZSBwcm9jZXNzIHRpbWVkIG91dCcpO1xyXG4gICAgdGhpcy5uYW1lID0gJ0RpdmluZVRpbWVkT3V0JztcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGV4ZWNPcHRzOiBjaGlsZF9wcm9jZXNzLkV4ZWNPcHRpb25zID0ge1xyXG4gIHRpbWVvdXQ6IFRJTUVPVVRfTVMsXHJcbn07XHJcblxyXG5hc3luYyBmdW5jdGlvbiBydW5EaXZpbmUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBEaXZpbmVBY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBkaXZpbmVPcHRzOiBJRGl2aW5lT3B0aW9ucylcclxuICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTxJRGl2aW5lT3V0cHV0PiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IGNvbmN1cnJlbmN5TGltaXRlci5kbyhhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkaXZpbmUoYXBpLCBhY3Rpb24sIGRpdmluZU9wdHMsIGV4ZWNPcHRzKTtcclxuICAgICAgcmV0dXJuIHJlc29sdmUocmVzdWx0KTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gcmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBkaXZpbmUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gIGFjdGlvbjogRGl2aW5lQWN0aW9uLFxyXG4gIGRpdmluZU9wdHM6IElEaXZpbmVPcHRpb25zLFxyXG4gIGV4ZWNPcHRzOiBjaGlsZF9wcm9jZXNzLkV4ZWNPcHRpb25zKTogUHJvbWlzZTxJRGl2aW5lT3V0cHV0PiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPElEaXZpbmVPdXRwdXQ+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBsc0xpYjogdHlwZXMuSU1vZCA9IGdldExhdGVzdExTTGliTW9kKGFwaSk7XHJcbiAgICBpZiAobHNMaWIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0xTTGliL0RpdmluZSB0b29sIGlzIG1pc3NpbmcnKTtcclxuICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGV4ZSA9IHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBsc0xpYi5pbnN0YWxsYXRpb25QYXRoLCAndG9vbHMnLCAnZGl2aW5lLmV4ZScpO1xyXG4gICAgY29uc3QgYXJncyA9IFtcclxuICAgICAgJy0tYWN0aW9uJywgYWN0aW9uLFxyXG4gICAgICAnLS1zb3VyY2UnLCBgXCIke2RpdmluZU9wdHMuc291cmNlfVwiYCxcclxuICAgICAgJy0tZ2FtZScsICdiZzMnLFxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAoZGl2aW5lT3B0cy5sb2dsZXZlbCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1sb2dsZXZlbCcsIGRpdmluZU9wdHMubG9nbGV2ZWwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYXJncy5wdXNoKCctLWxvZ2xldmVsJywgJ29mZicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkaXZpbmVPcHRzLmRlc3RpbmF0aW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXJncy5wdXNoKCctLWRlc3RpbmF0aW9uJywgYFwiJHtkaXZpbmVPcHRzLmRlc3RpbmF0aW9ufVwiYCk7XHJcbiAgICB9XHJcbiAgICBpZiAoZGl2aW5lT3B0cy5leHByZXNzaW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXJncy5wdXNoKCctLWV4cHJlc3Npb24nLCBgXCIke2RpdmluZU9wdHMuZXhwcmVzc2lvbn1cImApO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBgXCIke2V4ZX1cIiAke2FyZ3Muam9pbignICcpfWA7XHJcbiAgICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWMoY29tbWFuZCwgZXhlY09wdHMpO1xyXG4gICAgICBpZiAoISFzdGRlcnIpIHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihgZGl2aW5lLmV4ZSBmYWlsZWQ6ICR7c3RkZXJyfWApKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoIXN0ZG91dCAmJiBhY3Rpb24gIT09ICdsaXN0LXBhY2thZ2UnKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBzdGRvdXQ6ICcnLCByZXR1cm5Db2RlOiAyIH0pXHJcbiAgICAgIH0gICAgICBcclxuICAgICAgaWYgKFsnZXJyb3InLCAnZmF0YWwnXS5zb21lKHggPT4gc3Rkb3V0LnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aCh4KSkpIHtcclxuICAgICAgICAvLyBSZWFsbHk/XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoYGRpdmluZS5leGUgZmFpbGVkOiAke3N0ZG91dH1gKSk7XHJcbiAgICAgIH0gZWxzZSAge1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKHsgc3Rkb3V0LCByZXR1cm5Db2RlOiAwIH0pO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xyXG4gICAgICAgIHJldHVybiByZWplY3QobmV3IERpdmluZUV4ZWNNaXNzaW5nKCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZihlcnIubWVzc2FnZS5pbmNsdWRlcygnWW91IG11c3QgaW5zdGFsbCBvciB1cGRhdGUgLk5FVCcpKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRGl2aW5lTWlzc2luZ0RvdE5ldCgpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoYGRpdmluZS5leGUgZmFpbGVkOiAke2Vyci5tZXNzYWdlfWApO1xyXG4gICAgICBlcnJvclsnYXR0YWNoTG9nT25SZXBvcnQnXSA9IHRydWU7XHJcbiAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBhayhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGgsIGRlc3RQYXRoLCBwYXR0ZXJuKSB7XHJcbiAgcmV0dXJuIHJ1bkRpdmluZShhcGksICdleHRyYWN0LXBhY2thZ2UnLFxyXG4gICAgeyBzb3VyY2U6IHBha1BhdGgsIGRlc3RpbmF0aW9uOiBkZXN0UGF0aCwgZXhwcmVzc2lvbjogcGF0dGVybiB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpc3RQYWNrYWdlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gIGxldCByZXM7XHJcbiAgdHJ5IHtcclxuICAgIHJlcyA9IGF3YWl0IHJ1bkRpdmluZShhcGksICdsaXN0LXBhY2thZ2UnLCB7IHNvdXJjZTogcGFrUGF0aCwgbG9nbGV2ZWw6ICdvZmYnIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7ICAgIFxyXG4gICAgbG9nRXJyb3IoYGxpc3RQYWNrYWdlIGNhdWdodCBlcnJvcjogYCwgeyBlcnJvciB9KTtcclxuICAgIC8vbG9nKCdkZWJ1ZycsICdsaXN0UGFja2FnZSBlcnJvcicsIGVycm9yLm1lc3NhZ2UpO1xyXG5cclxuICAgIGlmKGVycm9yIGluc3RhbmNlb2YgRGl2aW5lTWlzc2luZ0RvdE5ldCkgeyAgXHJcbiAgICAgIGxvZygnZXJyb3InLCAnTWlzc2luZyAuTkVUJywgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdiZzMtcmVhZGluZy1wYWtzLWFjdGl2aXR5Jyk7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0xTTGliIHJlcXVpcmVzIC5ORVQgOCcsIFxyXG4gICAgICAnTFNMaWIgcmVxdWlyZXMgLk5FVCA4IERlc2t0b3AgUnVudGltZSB0byBiZSBpbnN0YWxsZWQuJyArXHJcbiAgICAgICdbYnJdWy9icl1bYnJdWy9icl0nICtcclxuICAgICAgJ1tsaXN0PTFdWypdRG93bmxvYWQgYW5kIEluc3RhbGwgW3VybD1odHRwczovL2RvdG5ldC5taWNyb3NvZnQuY29tL2VuLXVzL2Rvd25sb2FkL2RvdG5ldC90aGFuay15b3UvcnVudGltZS1kZXNrdG9wLTguMC4zLXdpbmRvd3MteDY0LWluc3RhbGxlcl0uTkVUIDguMCBEZXNrdG9wIFJ1bnRpbWUgZnJvbSBNaWNyb3NvZnRbL3VybF0nICArIFxyXG4gICAgICAnWypdQ2xvc2UgVm9ydGV4JyArIFxyXG4gICAgICAnWypdUmVzdGFydCBDb21wdXRlcicgKyBcclxuICAgICAgJ1sqXU9wZW4gVm9ydGV4Wy9saXN0XScsXHJcbiAgICAgICB7IGlkOiAnYmczLWRvdG5ldC1lcnJvcicsIGFsbG93UmVwb3J0OiBmYWxzZSwgaXNCQkNvZGU6IHRydWUgfSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvL2xvZ0RlYnVnKGBsaXN0UGFja2FnZSByZXM9YCwgcmVzKTtcclxuICBjb25zdCBsaW5lcyA9IChyZXM/LnN0ZG91dCB8fCAnJykuc3BsaXQoJ1xcbicpLm1hcChsaW5lID0+IGxpbmUudHJpbSgpKS5maWx0ZXIobGluZSA9PiBsaW5lLmxlbmd0aCAhPT0gMCk7XHJcblxyXG4gIC8vbG9nRGVidWcoYGxpc3RQYWNrYWdlIGxpbmVzPWAsIGxpbmVzKTtcclxuXHJcbiAgcmV0dXJuIGxpbmVzO1xyXG59Il19