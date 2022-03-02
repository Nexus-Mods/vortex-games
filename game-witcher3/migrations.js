"use strict";
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
exports.migrate148 = void 0;
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
function migrate148(context, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (semver_1.default.gte(oldVersion, '1.4.8')) {
            return Promise.resolve();
        }
        const state = context.api.getState();
        const lastActiveProfile = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
        const profile = vortex_api_1.selectors.profileById(state, lastActiveProfile);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modState = vortex_api_1.util.getSafe(profile, ['modState'], {});
        const isEnabled = (mod) => { var _a; return ((_a = modState[mod.id]) === null || _a === void 0 ? void 0 : _a.enabled) === true; };
        const limitPatchMod = Object.values(mods).find(mod => (mod.type === 'w3modlimitpatcher') && isEnabled(mod));
        if (limitPatchMod === undefined) {
            return Promise.resolve();
        }
        const t = context.api.translate;
        context.api.sendNotification({
            type: 'warning',
            allowSuppress: false,
            message: t('Faulty Witcher 3 Mod Limit Patch detected'),
            actions: [
                {
                    title: 'More',
                    action: (dismiss) => {
                        dismiss();
                        context.api.showDialog('info', 'Witcher 3 Mod Limit Patch', {
                            text: t('Due to a bug, the mod limit patch was not applied correctly. '
                                + 'Please Uninstall/Remove your existing mod limit match mod entry in '
                                + 'your mods page and re-apply the patch using the "Apply Mod Limit Patch" '
                                + 'button.'),
                        }, [
                            { label: 'Close' },
                        ]);
                    },
                },
            ],
        });
        return Promise.resolve();
    });
}
exports.migrate148 = migrate148;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esb0RBQTRCO0FBQzVCLDJDQUFpRTtBQUVqRSxxQ0FBbUM7QUFFbkMsU0FBc0IsVUFBVSxDQUFDLE9BQWdDLEVBQ2hDLFVBQWtCOztRQUNqRCxJQUFJLGdCQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsRUFBRTtZQUNuQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMxQjtRQUVELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMsTUFBTSxpQkFBaUIsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDN0UsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDaEUsTUFBTSxJQUFJLEdBQ1IsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0QsTUFBTSxRQUFRLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFlLEVBQUUsRUFBRSxXQUFDLE9BQUEsQ0FBQSxNQUFBLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLDBDQUFFLE9BQU8sTUFBSyxJQUFJLENBQUEsRUFBQSxDQUFDO1FBQzFFLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQ25ELENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxtQkFBbUIsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hELElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTtZQUMvQixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMxQjtRQUVELE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDM0IsSUFBSSxFQUFFLFNBQVM7WUFDZixhQUFhLEVBQUUsS0FBSztZQUNwQixPQUFPLEVBQUUsQ0FBQyxDQUFDLDJDQUEyQyxDQUFDO1lBQ3ZELE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxLQUFLLEVBQUUsTUFBTTtvQkFDYixNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRTt3QkFDbEIsT0FBTyxFQUFFLENBQUM7d0JBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLDJCQUEyQixFQUFFOzRCQUMxRCxJQUFJLEVBQUUsQ0FBQyxDQUFDLCtEQUErRDtrQ0FDNUQscUVBQXFFO2tDQUNyRSwwRUFBMEU7a0NBQzFFLFNBQVMsQ0FBQzt5QkFDdEIsRUFBRTs0QkFDRCxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7eUJBQ25CLENBQUMsQ0FBQztvQkFDTCxDQUFDO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDO0NBQUE7QUEzQ0QsZ0NBMkNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZTE0OChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmVyc2lvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgaWYgKHNlbXZlci5ndGUob2xkVmVyc2lvbiwgJzEuNC44JykpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBsYXN0QWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIGxhc3RBY3RpdmVQcm9maWxlKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID1cclxuICAgIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xyXG4gIGNvbnN0IGlzRW5hYmxlZCA9IChtb2Q6IHR5cGVzLklNb2QpID0+IG1vZFN0YXRlW21vZC5pZF0/LmVuYWJsZWQgPT09IHRydWU7XHJcbiAgY29uc3QgbGltaXRQYXRjaE1vZCA9IE9iamVjdC52YWx1ZXMobW9kcykuZmluZChtb2QgPT5cclxuICAgIChtb2QudHlwZSA9PT0gJ3czbW9kbGltaXRwYXRjaGVyJykgJiYgaXNFbmFibGVkKG1vZCkpO1xyXG4gIGlmIChsaW1pdFBhdGNoTW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XHJcbiAgY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICAgIG1lc3NhZ2U6IHQoJ0ZhdWx0eSBXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoIGRldGVjdGVkJyksXHJcbiAgICBhY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICAgIGFjdGlvbjogKGRpc21pc3MpID0+IHtcclxuICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzIE1vZCBMaW1pdCBQYXRjaCcsIHtcclxuICAgICAgICAgICAgdGV4dDogdCgnRHVlIHRvIGEgYnVnLCB0aGUgbW9kIGxpbWl0IHBhdGNoIHdhcyBub3QgYXBwbGllZCBjb3JyZWN0bHkuICdcclxuICAgICAgICAgICAgICAgICAgICAgKyAnUGxlYXNlIFVuaW5zdGFsbC9SZW1vdmUgeW91ciBleGlzdGluZyBtb2QgbGltaXQgbWF0Y2ggbW9kIGVudHJ5IGluICdcclxuICAgICAgICAgICAgICAgICAgICAgKyAneW91ciBtb2RzIHBhZ2UgYW5kIHJlLWFwcGx5IHRoZSBwYXRjaCB1c2luZyB0aGUgXCJBcHBseSBNb2QgTGltaXQgUGF0Y2hcIiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICsgJ2J1dHRvbi4nKSxcclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxyXG4gICAgICAgICAgXSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG4iXX0=