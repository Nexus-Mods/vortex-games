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
function migrate(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const settingsPath = path_1.default.join((0, util_1.profilesPath)(), 'Public', 'modsettings.lsx');
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
        if (semver.gte(oldVersion, newVersion)) {
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
                            bbcode: t('As of Baldur\'s Gate 3 patch 7, the "ModFixer" mod is no longer required. Please feel free to disable it.'),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQWlDO0FBQ2pDLDJDQUE2QztBQUM3QywyQ0FBb0Q7QUFDcEQsZ0RBQXdCO0FBRXhCLGlDQUFnRDtBQUNoRCx1Q0FBbUQ7QUFFbkQsU0FBc0IsT0FBTyxDQUFDLEdBQXdCOztRQUVwRCxNQUFNLFlBQVksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLElBQUEsbUJBQVksR0FBRSxFQUFFLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVFLE1BQU0sVUFBVSxHQUFHLFlBQVksR0FBRyxTQUFTLENBQUM7UUFDNUMsTUFBTSxjQUFjLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBQyxrQkFBa0IsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTlHLElBQUk7WUFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDaEM7UUFDRCxPQUFPLEdBQUcsRUFBRTtZQUVWLElBQUEsZUFBUSxFQUFDLEdBQUcsVUFBVSxpQkFBaUIsQ0FBQyxDQUFDO1lBRXpDLElBQUk7Z0JBQ0YsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLFVBQVUsRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBRSxDQUFDO2dCQUVuRSxJQUFBLGVBQVEsRUFBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUczQixNQUFNLElBQUEsaUNBQXFCLEVBQUMsR0FBRyxDQUFDLENBQUM7YUFHbEM7WUFDRCxPQUFPLEdBQUcsRUFBRTtnQkFDVixJQUFBLGVBQVEsRUFBQyxHQUFHLFlBQVksZ0JBQWdCLENBQUMsQ0FBQzthQUMzQztTQUNGO2dCQUFTO1lBQ1IsTUFBTSxTQUFTLENBQUMsR0FBRyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQ3RDO0lBR0gsQ0FBQztDQUFBO0FBaENELDBCQWdDQztBQUVELFNBQXNCLFNBQVMsQ0FBQyxHQUF3QixFQUFFLFVBQWtCOztRQUUxRSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUM7UUFHM0IsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRTtZQUN0QyxJQUFBLGVBQVEsRUFBQyxvQkFBb0IsQ0FBQyxDQUFDO1lBQy9CLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBRUQsTUFBTSxJQUFBLGlDQUFxQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUM7UUFDeEIsR0FBRyxDQUFDLGdCQUFnQixDQUFDO1lBQ25CLEVBQUUsRUFBRSxpQkFBaUI7WUFDckIsSUFBSSxFQUFFLE1BQU07WUFDWixPQUFPLEVBQUUsMEJBQTBCO1lBQ25DLE9BQU8sRUFBRSxDQUFDO29CQUNSLEtBQUssRUFBRSxNQUFNO29CQUNiLE1BQU0sRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFO3dCQUNsQixHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSwwQkFBMEIsRUFBRTs0QkFDakQsTUFBTSxFQUFFLENBQUMsQ0FBQywyR0FBMkcsQ0FBQzt5QkFDdkgsRUFBRSxDQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBRSxDQUFDLENBQUM7b0JBQ3RELENBQUM7aUJBQ0YsQ0FBQztTQUNILENBQUMsQ0FBQTtRQUNGLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUEsZ0NBQXNCLEVBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDO0NBQUE7QUExQkQsOEJBMEJDO0FBRUQsU0FBc0IsU0FBUyxDQUFDLEdBQXdCLEVBQUUsVUFBa0I7O1FBRTFFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQztRQUczQixJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxFQUFFO1lBQ3RDLElBQUEsZUFBUSxFQUFDLG9CQUFvQixDQUFDLENBQUM7WUFDL0IsT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDekI7UUFFRCxJQUFBLGVBQVEsRUFBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBSTlCLElBQUk7WUFDRixNQUFNLElBQUEsaUNBQXFCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDekI7UUFDRCxXQUFNO1lBQ0osT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDekI7UUFFRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMxQixDQUFDO0NBQUE7QUF2QkQsOEJBdUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IGZzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5pbXBvcnQgeyBpbXBvcnRNb2RTZXR0aW5nc0dhbWUgfSBmcm9tICcuL2xvYWRPcmRlcic7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuaW1wb3J0IHsgbG9nRGVidWcsIHByb2ZpbGVzUGF0aCB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCB7IHNldEJHM0V4dGVuc2lvblZlcnNpb24gfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgXHJcbiAgY29uc3Qgc2V0dGluZ3NQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCAnUHVibGljJywgJ21vZHNldHRpbmdzLmxzeCcpO1xyXG4gIGNvbnN0IGJhY2t1cFBhdGggPSBzZXR0aW5nc1BhdGggKyAnLmJhY2t1cCc7XHJcbiAgY29uc3QgY3VycmVudFZlcnNpb24gPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsnc2V0dGluZ3MnLCAnYmFsZHVyc2dhdGUzJywnZXh0ZW5zaW9uVmVyc2lvbiddLCAnMC4wLjAnKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnN0YXRBc3luYyhiYWNrdXBQYXRoKTsgLy8gaWYgaXQgZG9lc24ndCBleGlzdCwgbWFrZSBhIGJhY2t1cFxyXG4gIH0gXHJcbiAgY2F0Y2ggKGVycikge1xyXG5cclxuICAgIGxvZ0RlYnVnKGAke2JhY2t1cFBhdGh9IGRvZXNuJ3QgZXhpc3QuYCk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHNldHRpbmdzUGF0aCk7IFxyXG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoc2V0dGluZ3NQYXRoLCBiYWNrdXBQYXRoLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9ICk7XHJcbiAgICAgIFxyXG4gICAgICBsb2dEZWJ1ZyhgYmFja3VwIGNyZWF0ZWRgKTtcclxuICAgICAgXHJcbiAgICAgIC8vIGltcG9ydFxyXG4gICAgICBhd2FpdCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpKTtcclxuICAgICAgXHJcbiAgICAgIC8vbG9nRGVidWcoYCR7YmFja3VwUGF0aH0gZG9lc24ndCBleGlzdGApO1xyXG4gICAgfSBcclxuICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nRGVidWcoYCR7c2V0dGluZ3NQYXRofSBkb2Vzbid0IGV4aXN0YCk7XHJcbiAgICB9ICAgIFxyXG4gIH0gZmluYWxseSB7XHJcbiAgICBhd2FpdCBtaWdyYXRlMTUoYXBpLCBjdXJyZW50VmVyc2lvbik7XHJcbiAgfVxyXG5cclxuICAvLyBiYWNrIHVwIG1hZGUganVzdCBpbiBjYXNlXHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlMTUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBvbGRWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgY29uc3QgbmV3VmVyc2lvbiA9ICcxLjUuMCc7XHJcblxyXG4gIC8vIGlmIG9sZCB2ZXJzaW9uIGlzIG5ld2VyLCB0aGVuIHNraXBcclxuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCBuZXdWZXJzaW9uKSkge1xyXG4gICAgbG9nRGVidWcoJ3NraXBwaW5nIG1pZ3JhdGlvbicpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgaW1wb3J0TW9kU2V0dGluZ3NHYW1lKGFwaSk7XHJcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgaWQ6ICdiZzMtcGF0Y2g3LWluZm8nLFxyXG4gICAgdHlwZTogJ2luZm8nLFxyXG4gICAgbWVzc2FnZTogJ0JhbGR1clxcJ3MgR2F0ZSAzIHBhdGNoIDcnLFxyXG4gICAgYWN0aW9uczogW3tcclxuICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgYWN0aW9uOiAoZGlzbWlzcykgPT4ge1xyXG4gICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ0JhbGR1clxcJ3MgR2F0ZSAzIHBhdGNoIDcnLCB7XHJcbiAgICAgICAgICBiYmNvZGU6IHQoJ0FzIG9mIEJhbGR1clxcJ3MgR2F0ZSAzIHBhdGNoIDcsIHRoZSBcIk1vZEZpeGVyXCIgbW9kIGlzIG5vIGxvbmdlciByZXF1aXJlZC4gUGxlYXNlIGZlZWwgZnJlZSB0byBkaXNhYmxlIGl0LicpLFxyXG4gICAgICAgIH0sIFsgeyBsYWJlbDogJ0Nsb3NlJywgYWN0aW9uOiAoKSA9PiBkaXNtaXNzKCkgfSBdKTtcclxuICAgICAgfVxyXG4gICAgfV0sXHJcbiAgfSlcclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0QkczRXh0ZW5zaW9uVmVyc2lvbihuZXdWZXJzaW9uKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlMTMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBvbGRWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgY29uc3QgbmV3VmVyc2lvbiA9ICcxLjQuMCc7IC8vIEZPUkNJTkcgTUlHUkFUSU9OXHJcblxyXG4gIC8vIGlmIG9sZCB2ZXJzaW9uIGlzIG5ld2VyLCB0aGVuIHNraXBcclxuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCBuZXdWZXJzaW9uKSkge1xyXG4gICAgbG9nRGVidWcoJ3NraXBwaW5nIG1pZ3JhdGlvbicpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XHJcbiAgfVxyXG5cclxuICBsb2dEZWJ1ZygncGVyZm9ybSBtaWdyYXRpb24nKTtcclxuXHJcbiAgLy8gZG8gd2UganVzdCBhIGZvcmNlIGEgaW1wb3J0IGZyb20gZ2FtZT8hXHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpOyAvLyBGT1JDRSBOT1QgUkVDT1JEIFZFUlNJT04gTlVNQkVSXHJcbiAgfSBcclxuICBjYXRjaCB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlamVjdCgpOyAgXHJcbn1cclxuIl19