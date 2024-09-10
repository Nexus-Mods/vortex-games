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
        api.sendNotification({
            id: 'bg3-patch7-info',
            type: 'info',
            message: 'Baldur\'s Gate 3 patch 7',
            actions: [{
                    title: 'More',
                    action: (dismiss) => {
                        api.showDialog('info', 'Baldur\'s Gate 3 patch 7', {
                            bbcode: t('As of Baldur\'s Gate 3 patch 7, the "ModFixer" mod is no longer required. Please feel free to disable it.{{bl}}'
                                + 'Additional information about patch 7 troubleshooting can be found here: [url]{{url}}[/url]', { replace: {
                                    bl: '[br][/br][br][/br]',
                                    url: 'https://wiki.bg3.community/en/Tutorials/patch7-troubleshooting',
                                } }),
                        }, [{ label: 'Close', action: () => dismiss() }]);
                    }
                }],
        });
        api.store.dispatch((0, actions_1.setBG3ExtensionVersion)(newVersion));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQWlDO0FBQ2pDLDJDQUE2QztBQUM3QywyQ0FBb0Q7QUFDcEQsZ0RBQXdCO0FBRXhCLGlDQUF3RTtBQUN4RSx1Q0FBbUQ7QUFDbkQscUNBQWlDO0FBRWpDLFNBQXNCLE9BQU8sQ0FBQyxHQUF3Qjs7UUFDcEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFBLDZCQUFzQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sWUFBWSxHQUFXLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSxtQkFBWSxHQUFFLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDeEYsTUFBTSxVQUFVLEdBQUcsWUFBWSxHQUFHLFNBQVMsQ0FBQztRQUM1QyxNQUFNLGNBQWMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFDLGtCQUFrQixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFOUcsSUFBSTtZQUNGLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNoQztRQUNELE9BQU8sR0FBRyxFQUFFO1lBRVYsSUFBQSxlQUFRLEVBQUMsR0FBRyxVQUFVLGlCQUFpQixDQUFDLENBQUM7WUFFekMsSUFBSTtnQkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFFLENBQUM7Z0JBRW5FLElBQUEsZUFBUSxFQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBRzNCLE1BQU0sSUFBQSxpQ0FBcUIsRUFBQyxHQUFHLENBQUMsQ0FBQzthQUdsQztZQUNELE9BQU8sR0FBRyxFQUFFO2dCQUNWLElBQUEsZUFBUSxFQUFDLEdBQUcsWUFBWSxnQkFBZ0IsQ0FBQyxDQUFDO2FBQzNDO1NBQ0Y7Z0JBQVM7WUFDUixNQUFNLFNBQVMsQ0FBQyxHQUFHLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDdEM7SUFHSCxDQUFDO0NBQUE7QUFoQ0QsMEJBZ0NDO0FBRUQsU0FBc0IsU0FBUyxDQUFDLEdBQXdCLEVBQUUsVUFBa0I7O1FBRTFFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQztRQUczQixJQUFJLENBQUMsY0FBSyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxFQUFFO1lBQ2hELElBQUEsZUFBUSxFQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDL0IsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7UUFFRCxNQUFNLElBQUEsaUNBQXFCLEVBQUMsR0FBRyxDQUFDLENBQUM7UUFDakMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN4QixHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDbkIsRUFBRSxFQUFFLGlCQUFpQjtZQUNyQixJQUFJLEVBQUUsTUFBTTtZQUNaLE9BQU8sRUFBRSwwQkFBMEI7WUFDbkMsT0FBTyxFQUFFLENBQUM7b0JBQ1IsS0FBSyxFQUFFLE1BQU07b0JBQ2IsTUFBTSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7d0JBQ2xCLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLDBCQUEwQixFQUFFOzRCQUNqRCxNQUFNLEVBQUUsQ0FBQyxDQUFDLGlIQUFpSDtrQ0FDakgsNEZBQTRGLEVBQUUsRUFBRSxPQUFPLEVBQUU7b0NBQ2pILEVBQUUsRUFBRSxvQkFBb0I7b0NBQ3hCLEdBQUcsRUFBRSxnRUFBZ0U7aUNBQ3RFLEVBQUUsQ0FBQzt5QkFDTCxFQUFFLENBQUUsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFFLENBQUMsQ0FBQztvQkFDdEQsQ0FBQztpQkFDRixDQUFDO1NBQ0gsQ0FBQyxDQUFBO1FBQ0YsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBQSxnQ0FBc0IsRUFBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7Q0FBQTtBQTlCRCw4QkE4QkM7QUFFRCxTQUFzQixTQUFTLENBQUMsR0FBd0IsRUFBRSxVQUFrQjs7UUFFMUUsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDO1FBRzNCLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLEVBQUU7WUFDdEMsSUFBQSxlQUFRLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUMvQixPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUN6QjtRQUVELElBQUEsZUFBUSxFQUFDLG1CQUFtQixDQUFDLENBQUM7UUFJOUIsSUFBSTtZQUNGLE1BQU0sSUFBQSxpQ0FBcUIsRUFBQyxHQUFHLENBQUMsQ0FBQztZQUNqQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUN6QjtRQUNELFdBQU07WUFDSixPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUN6QjtRQUVELE9BQU8sT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQzFCLENBQUM7Q0FBQTtBQXZCRCw4QkF1QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgZnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IGltcG9ydE1vZFNldHRpbmdzR2FtZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5pbXBvcnQgeyBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlLCBsb2dEZWJ1ZywgcHJvZmlsZXNQYXRoIH0gZnJvbSAnLi91dGlsJztcclxuaW1wb3J0IHsgc2V0QkczRXh0ZW5zaW9uVmVyc2lvbiB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IERFQlVHIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgYmczUHJvZmlsZUlkID0gYXdhaXQgZ2V0QWN0aXZlUGxheWVyUHJvZmlsZShhcGkpO1xyXG4gIGNvbnN0IHNldHRpbmdzUGF0aDogc3RyaW5nID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCBiZzNQcm9maWxlSWQsICdtb2RzZXR0aW5ncy5sc3gnKTtcclxuICBjb25zdCBiYWNrdXBQYXRoID0gc2V0dGluZ3NQYXRoICsgJy5iYWNrdXAnO1xyXG4gIGNvbnN0IGN1cnJlbnRWZXJzaW9uID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3NldHRpbmdzJywgJ2JhbGR1cnNnYXRlMycsJ2V4dGVuc2lvblZlcnNpb24nXSwgJzAuMC4wJyk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5zdGF0QXN5bmMoYmFja3VwUGF0aCk7IC8vIGlmIGl0IGRvZXNuJ3QgZXhpc3QsIG1ha2UgYSBiYWNrdXBcclxuICB9IFxyXG4gIGNhdGNoIChlcnIpIHtcclxuXHJcbiAgICBsb2dEZWJ1ZyhgJHtiYWNrdXBQYXRofSBkb2Vzbid0IGV4aXN0LmApO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhzZXR0aW5nc1BhdGgpOyBcclxuICAgICAgYXdhaXQgZnMuY29weUFzeW5jKHNldHRpbmdzUGF0aCwgYmFja3VwUGF0aCwgeyBvdmVyd3JpdGU6IHRydWUgfSApO1xyXG4gICAgICBcclxuICAgICAgbG9nRGVidWcoYGJhY2t1cCBjcmVhdGVkYCk7XHJcbiAgICAgIFxyXG4gICAgICAvLyBpbXBvcnRcclxuICAgICAgYXdhaXQgaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGFwaSk7XHJcbiAgICAgIFxyXG4gICAgICAvL2xvZ0RlYnVnKGAke2JhY2t1cFBhdGh9IGRvZXNuJ3QgZXhpc3RgKTtcclxuICAgIH0gXHJcbiAgICBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGxvZ0RlYnVnKGAke3NldHRpbmdzUGF0aH0gZG9lc24ndCBleGlzdGApO1xyXG4gICAgfSAgICBcclxuICB9IGZpbmFsbHkge1xyXG4gICAgYXdhaXQgbWlncmF0ZTE1KGFwaSwgY3VycmVudFZlcnNpb24pO1xyXG4gIH1cclxuXHJcbiAgLy8gYmFjayB1cCBtYWRlIGp1c3QgaW4gY2FzZVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZTE1KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgb2xkVmVyc2lvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gIGNvbnN0IG5ld1ZlcnNpb24gPSAnMS41LjAnO1xyXG5cclxuICAvLyBpZiBvbGQgdmVyc2lvbiBpcyBuZXdlciwgdGhlbiBza2lwXHJcbiAgaWYgKCFERUJVRyAmJiBzZW12ZXIuZ3RlKG9sZFZlcnNpb24sIG5ld1ZlcnNpb24pKSB7XHJcbiAgICBsb2dEZWJ1Zygnc2tpcHBpbmcgbWlncmF0aW9uJyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBhd2FpdCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpKTtcclxuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogJ2JnMy1wYXRjaDctaW5mbycsXHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICBtZXNzYWdlOiAnQmFsZHVyXFwncyBHYXRlIDMgcGF0Y2ggNycsXHJcbiAgICBhY3Rpb25zOiBbe1xyXG4gICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICBhY3Rpb246IChkaXNtaXNzKSA9PiB7XHJcbiAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnQmFsZHVyXFwncyBHYXRlIDMgcGF0Y2ggNycsIHtcclxuICAgICAgICAgIGJiY29kZTogdCgnQXMgb2YgQmFsZHVyXFwncyBHYXRlIDMgcGF0Y2ggNywgdGhlIFwiTW9kRml4ZXJcIiBtb2QgaXMgbm8gbG9uZ2VyIHJlcXVpcmVkLiBQbGVhc2UgZmVlbCBmcmVlIHRvIGRpc2FibGUgaXQue3tibH19J1xyXG4gICAgICAgICAgICAgICAgICArICdBZGRpdGlvbmFsIGluZm9ybWF0aW9uIGFib3V0IHBhdGNoIDcgdHJvdWJsZXNob290aW5nIGNhbiBiZSBmb3VuZCBoZXJlOiBbdXJsXXt7dXJsfX1bL3VybF0nLCB7IHJlcGxhY2U6IHtcclxuICAgICAgICAgICAgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nLFxyXG4gICAgICAgICAgICB1cmw6ICdodHRwczovL3dpa2kuYmczLmNvbW11bml0eS9lbi9UdXRvcmlhbHMvcGF0Y2g3LXRyb3VibGVzaG9vdGluZycsXHJcbiAgICAgICAgICB9IH0pLFxyXG4gICAgICAgIH0sIFsgeyBsYWJlbDogJ0Nsb3NlJywgYWN0aW9uOiAoKSA9PiBkaXNtaXNzKCkgfSBdKTtcclxuICAgICAgfVxyXG4gICAgfV0sXHJcbiAgfSlcclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0QkczRXh0ZW5zaW9uVmVyc2lvbihuZXdWZXJzaW9uKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlMTMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBvbGRWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgY29uc3QgbmV3VmVyc2lvbiA9ICcxLjQuMCc7IC8vIEZPUkNJTkcgTUlHUkFUSU9OXHJcblxyXG4gIC8vIGlmIG9sZCB2ZXJzaW9uIGlzIG5ld2VyLCB0aGVuIHNraXBcclxuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCBuZXdWZXJzaW9uKSkge1xyXG4gICAgbG9nRGVidWcoJ3NraXBwaW5nIG1pZ3JhdGlvbicpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgfVxyXG5cclxuICBsb2dEZWJ1ZygncGVyZm9ybSBtaWdyYXRpb24nKTtcclxuXHJcbiAgLy8gZG8gd2UganVzdCBhIGZvcmNlIGEgaW1wb3J0IGZyb20gZ2FtZT8hXHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpOyAvLyBGT1JDRSBOT1QgUkVDT1JEIFZFUlNJT04gTlVNQkVSXHJcbiAgfSBcclxuICBjYXRjaCB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlamVjdCgpOyAgXHJcbn1cclxuIl19