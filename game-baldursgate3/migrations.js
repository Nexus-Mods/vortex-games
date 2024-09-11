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
exports.migrate13 = exports.migrate15 = exports.migrate = void 0;
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
exports.migrate = migrate;
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
exports.migrate15 = migrate15;
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
exports.migrate13 = migrate13;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQWlDO0FBQ2pDLDJDQUFzRDtBQUN0RCwyQ0FBb0Q7QUFDcEQsZ0RBQXdCO0FBRXhCLGlDQUF3RTtBQUN4RSx1Q0FBbUQ7QUFDbkQscUNBQWlDO0FBRWpDLFNBQXNCLE9BQU8sQ0FBQyxHQUF3Qjs7UUFDcEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFBLDZCQUFzQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sWUFBWSxHQUFXLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSxtQkFBWSxHQUFFLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDeEYsTUFBTSxVQUFVLEdBQUcsWUFBWSxHQUFHLFNBQVMsQ0FBQztRQUM1QyxNQUFNLGNBQWMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFL0csSUFBSTtZQUNGLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNoQztRQUNELE9BQU8sR0FBRyxFQUFFO1lBRVYsSUFBQSxlQUFRLEVBQUMsR0FBRyxVQUFVLGlCQUFpQixDQUFDLENBQUM7WUFFekMsSUFBSTtnQkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFFLENBQUM7Z0JBRW5FLElBQUEsZUFBUSxFQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBRzNCLE1BQU0sSUFB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XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgaW1wb3J0TW9kU2V0dGluZ3NHYW1lIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbmltcG9ydCB7IGdldEFjdGl2ZVBsYXllclByb2ZpbGUsIGxvZ0RlYnVnLCBwcm9maWxlc1BhdGggfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgeyBzZXRCRzNFeHRlbnNpb25WZXJzaW9uIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuaW1wb3J0IHsgREVCVUcgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBiZzNQcm9maWxlSWQgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XHJcbiAgY29uc3Qgc2V0dGluZ3NQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM1Byb2ZpbGVJZCwgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gIGNvbnN0IGJhY2t1cFBhdGggPSBzZXR0aW5nc1BhdGggKyAnLmJhY2t1cCc7XHJcbiAgY29uc3QgY3VycmVudFZlcnNpb24gPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsnc2V0dGluZ3MnLCAnYmFsZHVyc2dhdGUzJywgJ2V4dGVuc2lvblZlcnNpb24nXSwgJzAuMC4wJyk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5zdGF0QXN5bmMoYmFja3VwUGF0aCk7IC8vIGlmIGl0IGRvZXNuJ3QgZXhpc3QsIG1ha2UgYSBiYWNrdXBcclxuICB9IFxyXG4gIGNhdGNoIChlcnIpIHtcclxuXHJcbiAgICBsb2dEZWJ1ZyhgJHtiYWNrdXBQYXRofSBkb2Vzbid0IGV4aXN0LmApO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhzZXR0aW5nc1BhdGgpOyBcclxuICAgICAgYXdhaXQgZnMuY29weUFzeW5jKHNldHRpbmdzUGF0aCwgYmFja3VwUGF0aCwgeyBvdmVyd3JpdGU6IHRydWUgfSApO1xyXG4gICAgICBcclxuICAgICAgbG9nRGVidWcoYGJhY2t1cCBjcmVhdGVkYCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBpbXBvcnRcclxuICAgICAgYXdhaXQgaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGFwaSk7XHJcbiAgICAgIFxyXG4gICAgICAvL2xvZ0RlYnVnKGAke2JhY2t1cFBhdGh9IGRvZXNuJ3QgZXhpc3RgKTtcclxuICAgIH0gXHJcbiAgICBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGxvZ0RlYnVnKGAke3NldHRpbmdzUGF0aH0gZG9lc24ndCBleGlzdGApO1xyXG4gICAgfSAgICBcclxuICB9IGZpbmFsbHkge1xyXG4gICAgYXdhaXQgbWlncmF0ZTE1KGFwaSwgY3VycmVudFZlcnNpb24pO1xyXG4gIH1cclxuXHJcbiAgLy8gYmFjayB1cCBtYWRlIGp1c3QgaW4gY2FzZVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZTE1KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgb2xkVmVyc2lvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gIGNvbnN0IG5ld1ZlcnNpb24gPSAnMS41LjAnO1xyXG5cclxuICAvLyBpZiBvbGQgdmVyc2lvbiBpcyBuZXdlciwgdGhlbiBza2lwXHJcbiAgaWYgKCFERUJVRyAmJiBzZW12ZXIuZ3RlKG9sZFZlcnNpb24sIG5ld1ZlcnNpb24pKSB7XHJcbiAgICBsb2dEZWJ1Zygnc2tpcHBpbmcgbWlncmF0aW9uJyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBhd2FpdCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpKTtcclxuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcclxuICBjb25zdCBiYXRjaGVkOiBhbnkgPSBbc2V0QkczRXh0ZW5zaW9uVmVyc2lvbihuZXdWZXJzaW9uKV07XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6ICdiZzMtcGF0Y2g3LWluZm8nLFxyXG4gICAgdHlwZTogJ2luZm8nLFxyXG4gICAgbWVzc2FnZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIHBhdGNoIDcnLFxyXG4gICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgIGFjdGlvbnM6IFt7XHJcbiAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgIGFjdGlvbjogKGRpc21pc3MpID0+IHtcclxuICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdCYWxkdXJcXCdzIEdhdGUgMyBwYXRjaCA3Jywge1xyXG4gICAgICAgICAgYmJjb2RlOiB0KCdBcyBvZiBCYWxkdXJcXCdzIEdhdGUgMyBwYXRjaCA3LCB0aGUgXCJNb2RGaXhlclwiIG1vZCBpcyBubyBsb25nZXIgcmVxdWlyZWQuIFBsZWFzZSBmZWVsIGZyZWUgdG8gZGlzYWJsZSBpdC57e2JsfX0nXHJcbiAgICAgICAgICAgICAgICAgICsgJ0FkZGl0aW9uYWwgaW5mb3JtYXRpb24gYWJvdXQgcGF0Y2ggNyB0cm91Ymxlc2hvb3RpbmcgY2FuIGJlIGZvdW5kIGhlcmU6IFt1cmxde3t1cmx9fVsvdXJsXXt7Ymx9fSdcclxuICAgICAgICAgICAgICAgICAgKyAnUGxlYXNlIG5vdGUgLSBpZiB5b3Ugc3dpdGNoIGJldHdlZW4gZGlmZmVyZW50IGdhbWUgdmVyc2lvbnMvcGF0Y2hlcyAtIG1ha2Ugc3VyZSB0byBwdXJnZSB5b3VyIG1vZHMgYW5kIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlICdcclxuICAgICAgICAgICAgICAgICAgKyAnc28gdGhhdCB0aGUgZ2FtZSBjYW4gcmVnZW5lcmF0ZSB5b3VyIFwibW9kc2V0dGluZ3MubHN4XCIgZmlsZS4nLCB7IHJlcGxhY2U6IHtcclxuICAgICAgICAgICAgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nLFxyXG4gICAgICAgICAgICB1cmw6ICdodHRwczovL3dpa2kuYmczLmNvbW11bml0eS9lbi9UdXRvcmlhbHMvcGF0Y2g3LXRyb3VibGVzaG9vdGluZycsXHJcbiAgICAgICAgICB9IH0pLFxyXG4gICAgICAgIH0sIFsgeyBsYWJlbDogJ0Nsb3NlJywgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICBiYXRjaGVkLnB1c2goYWN0aW9ucy5zdXBwcmVzc05vdGlmaWNhdGlvbignYmczLXBhdGNoNy1pbmZvJywgdHJ1ZSkpO1xyXG4gICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgIH19XSk7XHJcbiAgICAgIH1cclxuICAgIH1dLFxyXG4gIH0pXHJcbiAgdXRpbC5iYXRjaERpc3BhdGNoKGFwaS5zdG9yZSwgYmF0Y2hlZCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlMTMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBvbGRWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgY29uc3QgbmV3VmVyc2lvbiA9ICcxLjQuMCc7IC8vIEZPUkNJTkcgTUlHUkFUSU9OXHJcblxyXG4gIC8vIGlmIG9sZCB2ZXJzaW9uIGlzIG5ld2VyLCB0aGVuIHNraXBcclxuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCBuZXdWZXJzaW9uKSkge1xyXG4gICAgbG9nRGVidWcoJ3NraXBwaW5nIG1pZ3JhdGlvbicpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgfVxyXG5cclxuICBsb2dEZWJ1ZygncGVyZm9ybSBtaWdyYXRpb24nKTtcclxuXHJcbiAgLy8gZG8gd2UganVzdCBhIGZvcmNlIGEgaW1wb3J0IGZyb20gZ2FtZT8hXHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpOyAvLyBGT1JDRSBOT1QgUkVDT1JEIFZFUlNJT04gTlVNQkVSXHJcbiAgfSBcclxuICBjYXRjaCB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlamVjdCgpOyAgXHJcbn1cclxuIl19