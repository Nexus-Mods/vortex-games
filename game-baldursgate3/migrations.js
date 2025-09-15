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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
exports.migrate15 = migrate15;
exports.migrate13 = migrate13;
const semver = __importStar(require("semver"));
const vortex_api_1 = require("vortex-api");
const loadOrder_1 = require("./loadOrder");
const path_1 = __importDefault(require("path"));
const util_1 = require("./util");
const actions_1 = require("./actions");
const common_1 = require("./common");
function migrate(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3ProfileId = yield (0, util_1.getActivePlayerProfile)(api);
        const settingsPath = path_1.default.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
        const backupPath = settingsPath + '.backup';
        const currentVersion = vortex_api_1.util.getSafe(api.getState(), ['settings', 'baldursgate3', 'extensionVersion'], '0.0.0');
        try {
            yield vortex_api_1.fs.statAsync(backupPath);
        }
        catch (err) {
            (0, util_1.logDebug)(`${backupPath} doesn't exist.`);
            try {
                yield vortex_api_1.fs.statAsync(settingsPath);
                yield vortex_api_1.fs.copyAsync(settingsPath, backupPath, { overwrite: true });
                (0, util_1.logDebug)(`backup created`);
                yield (0, loadOrder_1.importModSettingsGame)(api);
            }
            catch (err) {
                (0, util_1.logDebug)(`${settingsPath} doesn't exist`);
            }
        }
        finally {
            yield migrate15(api, currentVersion);
        }
    });
}
function migrate15(api, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const newVersion = '1.5.0';
        if (!common_1.DEBUG && semver.gte(oldVersion, newVersion)) {
            (0, util_1.logDebug)('skipping migration');
            return Promise.resolve();
        }
        yield (0, loadOrder_1.importModSettingsGame)(api);
        const t = api.translate;
        const batched = [(0, actions_1.setBG3ExtensionVersion)(newVersion)];
        api.sendNotification({
            id: 'bg3-patch7-info',
            type: 'info',
            message: 'Baldur\'s Gate 3 patch 7',
            allowSuppress: true,
            actions: [{
                    title: 'More',
                    action: (dismiss) => {
                        api.showDialog('info', 'Baldur\'s Gate 3 patch 7', {
                            bbcode: t('As of Baldur\'s Gate 3 patch 7, the "ModFixer" mod is no longer required. Please feel free to disable it.{{bl}}'
                                + 'Additional information about patch 7 troubleshooting can be found here: [url]{{url}}[/url]{{bl}}'
                                + 'Please note - if you switch between different game versions/patches - make sure to purge your mods and run the game at least once '
                                + 'so that the game can regenerate your "modsettings.lsx" file.', { replace: {
                                    bl: '[br][/br][br][/br]',
                                    url: 'https://wiki.bg3.community/en/Tutorials/patch7-troubleshooting',
                                } }),
                        }, [{ label: 'Close', action: () => {
                                    batched.push(vortex_api_1.actions.suppressNotification('bg3-patch7-info', true));
                                    dismiss();
                                } }]);
                    }
                }],
        });
        vortex_api_1.util.batchDispatch(api.store, batched);
    });
}
function migrate13(api, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const newVersion = '1.4.0';
        if (semver.gte(oldVersion, newVersion)) {
            (0, util_1.logDebug)('skipping migration');
            return Promise.reject();
        }
        (0, util_1.logDebug)('perform migration');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBU0EsMEJBZ0NDO0FBRUQsOEJBcUNDO0FBRUQsOEJBdUJDO0FBekdELCtDQUFpQztBQUNqQywyQ0FBc0Q7QUFDdEQsMkNBQW9EO0FBQ3BELGdEQUF3QjtBQUV4QixpQ0FBd0U7QUFDeEUsdUNBQW1EO0FBQ25ELHFDQUFpQztBQUVqQyxTQUFzQixPQUFPLENBQUMsR0FBd0I7O1FBQ3BELE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSw2QkFBc0IsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUN2RCxNQUFNLFlBQVksR0FBVyxjQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsbUJBQVksR0FBRSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3hGLE1BQU0sVUFBVSxHQUFHLFlBQVksR0FBRyxTQUFTLENBQUM7UUFDNUMsTUFBTSxjQUFjLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRS9HLElBQUksQ0FBQztZQUNILE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBQ0QsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUVYLElBQUEsZUFBUSxFQUFDLEdBQUcsVUFBVSxpQkFBaUIsQ0FBQyxDQUFDO1lBRXpDLElBQUksQ0FBQztnQkFDSCxNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFB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LE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMxQixDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IGltcG9ydE1vZFNldHRpbmdzR2FtZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5pbXBvcnQgeyBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlLCBsb2dEZWJ1ZywgcHJvZmlsZXNQYXRoIH0gZnJvbSAnLi91dGlsJztcclxuaW1wb3J0IHsgc2V0QkczRXh0ZW5zaW9uVmVyc2lvbiB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IERFQlVHIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgYmczUHJvZmlsZUlkID0gYXdhaXQgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGkpO1xyXG4gIGNvbnN0IHNldHRpbmdzUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNQcm9maWxlSWQsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuICBjb25zdCBiYWNrdXBQYXRoID0gc2V0dGluZ3NQYXRoICsgJy5iYWNrdXAnO1xyXG4gIGNvbnN0IGN1cnJlbnRWZXJzaW9uID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3NldHRpbmdzJywgJ2JhbGR1cnNnYXRlMycsICdleHRlbnNpb25WZXJzaW9uJ10sICcwLjAuMCcpO1xyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKGJhY2t1cFBhdGgpOyAvLyBpZiBpdCBkb2Vzbid0IGV4aXN0LCBtYWtlIGEgYmFja3VwXHJcbiAgfSBcclxuICBjYXRjaCAoZXJyKSB7XHJcblxyXG4gICAgbG9nRGVidWcoYCR7YmFja3VwUGF0aH0gZG9lc24ndCBleGlzdC5gKTtcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBmcy5zdGF0QXN5bmMoc2V0dGluZ3NQYXRoKTsgXHJcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhzZXR0aW5nc1BhdGgsIGJhY2t1cFBhdGgsIHsgb3ZlcndyaXRlOiB0cnVlIH0gKTtcclxuICAgICAgXHJcbiAgICAgIGxvZ0RlYnVnKGBiYWNrdXAgY3JlYXRlZGApO1xyXG4gICAgICBcclxuICAgICAgLy8gaW1wb3J0XHJcbiAgICAgIGF3YWl0IGltcG9ydE1vZFNldHRpbmdzR2FtZShhcGkpO1xyXG4gICAgICBcclxuICAgICAgLy9sb2dEZWJ1ZyhgJHtiYWNrdXBQYXRofSBkb2Vzbid0IGV4aXN0YCk7XHJcbiAgICB9IFxyXG4gICAgY2F0Y2ggKGVycikge1xyXG4gICAgICBsb2dEZWJ1ZyhgJHtzZXR0aW5nc1BhdGh9IGRvZXNuJ3QgZXhpc3RgKTtcclxuICAgIH0gICAgXHJcbiAgfSBmaW5hbGx5IHtcclxuICAgIGF3YWl0IG1pZ3JhdGUxNShhcGksIGN1cnJlbnRWZXJzaW9uKTtcclxuICB9XHJcblxyXG4gIC8vIGJhY2sgdXAgbWFkZSBqdXN0IGluIGNhc2VcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxNShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG9sZFZlcnNpb246IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG5cclxuICBjb25zdCBuZXdWZXJzaW9uID0gJzEuNS4wJztcclxuXHJcbiAgLy8gaWYgb2xkIHZlcnNpb24gaXMgbmV3ZXIsIHRoZW4gc2tpcFxyXG4gIGlmICghREVCVUcgJiYgc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCBuZXdWZXJzaW9uKSkge1xyXG4gICAgbG9nRGVidWcoJ3NraXBwaW5nIG1pZ3JhdGlvbicpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGFwaSk7XHJcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XHJcbiAgY29uc3QgYmF0Y2hlZDogYW55ID0gW3NldEJHM0V4dGVuc2lvblZlcnNpb24obmV3VmVyc2lvbildO1xyXG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIGlkOiAnYmczLXBhdGNoNy1pbmZvJyxcclxuICAgIHR5cGU6ICdpbmZvJyxcclxuICAgIG1lc3NhZ2U6ICdCYWxkdXJcXCdzIEdhdGUgMyBwYXRjaCA3JyxcclxuICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICBhY3Rpb25zOiBbe1xyXG4gICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICBhY3Rpb246IChkaXNtaXNzKSA9PiB7XHJcbiAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnQmFsZHVyXFwncyBHYXRlIDMgcGF0Y2ggNycsIHtcclxuICAgICAgICAgIGJiY29kZTogdCgnQXMgb2YgQmFsZHVyXFwncyBHYXRlIDMgcGF0Y2ggNywgdGhlIFwiTW9kRml4ZXJcIiBtb2QgaXMgbm8gbG9uZ2VyIHJlcXVpcmVkLiBQbGVhc2UgZmVlbCBmcmVlIHRvIGRpc2FibGUgaXQue3tibH19J1xyXG4gICAgICAgICAgICAgICAgICArICdBZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IHBhdGNoIDcgdHJvdWJsZXNob290aW5nIGNhbiBiZSBmb3VuZCBoZXJlOiBbdXJsXXt7dXJsfX1bL3VybF17e2JsfX0nXHJcbiAgICAgICAgICAgICAgICAgICsgJ1BsZWFzZSBub3RlIC0gaWYgeW91IHN3aXRjaCBiZXR3ZWVuIGRpZmZlcmVudCBnYW1lIHZlcnNpb25zL3BhdGNoZXMgLSBtYWtlIHN1cmUgdG8gcHVyZ2UgeW91ciBtb2RzIGFuZCBydW4gdGhlIGdhbWUgYXQgbGVhc3Qgb25jZSAnXHJcbiAgICAgICAgICAgICAgICAgICsgJ3NvIHRoYXQgdGhlIGdhbWUgY2FuIHJlZ2VuZXJhdGUgeW91ciBcIm1vZHNldHRpbmdzLmxzeFwiIGZpbGUuJywgeyByZXBsYWNlOiB7XHJcbiAgICAgICAgICAgIGJsOiAnW2JyXVsvYnJdW2JyXVsvYnJdJyxcclxuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly93aWtpLmJnMy5jb21tdW5pdHkvZW4vVHV0b3JpYWxzL3BhdGNoNy10cm91Ymxlc2hvb3RpbmcnLFxyXG4gICAgICAgICAgfSB9KSxcclxuICAgICAgICB9LCBbIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgYmF0Y2hlZC5wdXNoKGFjdGlvbnMuc3VwcHJlc3NOb3RpZmljYXRpb24oJ2JnMy1wYXRjaDctaW5mbycsIHRydWUpKTtcclxuICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICB9fV0pO1xyXG4gICAgICB9XHJcbiAgICB9XSxcclxuICB9KVxyXG4gIHV0aWwuYmF0Y2hEaXNwYXRjaChhcGkuc3RvcmUsIGJhdGNoZWQpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZTEzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgb2xkVmVyc2lvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gIGNvbnN0IG5ld1ZlcnNpb24gPSAnMS40LjAnOyAvLyBGT1JDSU5HIE1JR1JBVElPTlxyXG5cclxuICAvLyBpZiBvbGQgdmVyc2lvbiBpcyBuZXdlciwgdGhlbiBza2lwXHJcbiAgaWYgKHNlbXZlci5ndGUob2xkVmVyc2lvbiwgbmV3VmVyc2lvbikpIHtcclxuICAgIGxvZ0RlYnVnKCdza2lwcGluZyBtaWdyYXRpb24nKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gIH1cclxuXHJcbiAgbG9nRGVidWcoJ3BlcmZvcm0gbWlncmF0aW9uJyk7XHJcblxyXG4gIC8vIGRvIHdlIGp1c3QgYSBmb3JjZSBhIGltcG9ydCBmcm9tIGdhbWU/IVxyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGFwaSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTsgLy8gRk9SQ0UgTk9UIFJFQ09SRCBWRVJTSU9OIE5VTUJFUlxyXG4gIH0gXHJcbiAgY2F0Y2gge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTsgIFxyXG59XHJcbiJdfQ==