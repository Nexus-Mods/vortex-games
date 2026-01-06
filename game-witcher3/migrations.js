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
exports.migrate148 = migrate148;
exports.getPersistentLoadOrder = getPersistentLoadOrder;
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
function getPersistentLoadOrder(api, loadOrder) {
    const state = api.getState();
    const profile = vortex_api_1.selectors.activeProfile(state);
    if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
        return [];
    }
    loadOrder = loadOrder !== null && loadOrder !== void 0 ? loadOrder : vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profile.id], undefined);
    if (loadOrder === undefined) {
        return [];
    }
    if (Array.isArray(loadOrder)) {
        return loadOrder;
    }
    if (typeof loadOrder === 'object') {
        return Object.entries(loadOrder).map(([key, item]) => convertDisplayItem(key, item));
    }
    return [];
}
function convertDisplayItem(key, item) {
    return {
        id: key,
        modId: key,
        name: key,
        locked: item.locked,
        enabled: true,
        data: {
            prefix: item.prefix,
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFPQSxnQ0EyQ0M7QUFFRCx3REFtQkM7QUF0RUQsb0RBQTRCO0FBQzVCLDJDQUFvRDtBQUVwRCxxQ0FBbUM7QUFHbkMsU0FBc0IsVUFBVSxDQUFDLE9BQWdDLEVBQ2hDLFVBQWtCOztRQUNqRCxJQUFJLGdCQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ3BDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUM7UUFFRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ3JDLE1BQU0saUJBQWlCLEdBQUcsc0JBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQzdFLE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sSUFBSSxHQUNSLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzNELE1BQU0sUUFBUSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBZSxFQUFFLEVBQUUsV0FBQyxPQUFBLENBQUEsTUFBQSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQywwQ0FBRSxPQUFPLE1BQUssSUFBSSxDQUFBLEVBQUEsQ0FBQztRQUMxRSxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxD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c2VtdmVyJztcclxuaW1wb3J0IHsgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlciwgSUxvYWRPcmRlckVudHJ5IH0gZnJvbSAnLi9jb2xsZWN0aW9ucy90eXBlcyc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZTE0OChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmVyc2lvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgaWYgKHNlbXZlci5ndGUob2xkVmVyc2lvbiwgJzEuNC44JykpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBsYXN0QWN0aXZlUHJvZmlsZSA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIGxhc3RBY3RpdmVQcm9maWxlKTtcclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID1cclxuICAgIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xyXG4gIGNvbnN0IGlzRW5hYmxlZCA9IChtb2Q6IHR5cGVzLklNb2QpID0+IG1vZFN0YXRlW21vZC5pZF0/LmVuYWJsZWQgPT09IHRydWU7XHJcbiAgY29uc3QgbGltaXRQYXRjaE1vZCA9IE9iamVjdC52YWx1ZXMobW9kcykuZmluZChtb2QgPT5cclxuICAgIChtb2QudHlwZSA9PT0gJ3czbW9kbGltaXRwYXRjaGVyJykgJiYgaXNFbmFibGVkKG1vZCkpO1xyXG4gIGlmIChsaW1pdFBhdGNoTW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHQgPSBjb250ZXh0LmFwaS50cmFuc2xhdGU7XHJcbiAgY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICBhbGxvd1N1cHByZXNzOiBmYWxzZSxcclxuICAgIG1lc3NhZ2U6IHQoJ0ZhdWx0eSBXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoIGRldGVjdGVkJyksXHJcbiAgICBhY3Rpb25zOiBbXHJcbiAgICAgIHtcclxuICAgICAgICB0aXRsZTogJ01vcmUnLFxyXG4gICAgICAgIGFjdGlvbjogKGRpc21pc3MpID0+IHtcclxuICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzIE1vZCBMaW1pdCBQYXRjaCcsIHtcclxuICAgICAgICAgICAgdGV4dDogdCgnRHVlIHRvIGEgYnVnLCB0aGUgbW9kIGxpbWl0IHBhdGNoIHdhcyBub3QgYXBwbGllZCBjb3JyZWN0bHkuICdcclxuICAgICAgICAgICAgICAgICAgICAgKyAnUGxlYXNlIFVuaW5zdGFsbC9SZW1vdmUgeW91ciBleGlzdGluZyBtb2QgbGltaXQgbWF0Y2ggbW9kIGVudHJ5IGluICdcclxuICAgICAgICAgICAgICAgICAgICAgKyAneW91ciBtb2RzIHBhZ2UgYW5kIHJlLWFwcGx5IHRoZSBwYXRjaCB1c2luZyB0aGUgXCJBcHBseSBNb2QgTGltaXQgUGF0Y2hcIiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICsgJ2J1dHRvbi4nKSxcclxuICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxyXG4gICAgICAgICAgXSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBsb2FkT3JkZXI/OiBJTG9hZE9yZGVyKTogdHlwZXMuTG9hZE9yZGVyIHtcclxuICAvLyBXZSBtaWdyYXRlZCBhd2F5IGZyb20gdGhlIHJlZ3VsYXIgbW9kIGxvYWQgb3JkZXIgZXh0ZW5zaW9uXHJcbiAgLy8gIHRvIHRoZSBmaWxlIGJhc2VkIGxvYWQgb3JkZXJpbmdcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbiAgbG9hZE9yZGVyID0gbG9hZE9yZGVyID8/IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChsb2FkT3JkZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICBpZiAoQXJyYXkuaXNBcnJheShsb2FkT3JkZXIpKSB7XHJcbiAgICByZXR1cm4gbG9hZE9yZGVyO1xyXG4gIH1cclxuICBpZiAodHlwZW9mIGxvYWRPcmRlciA9PT0gJ29iamVjdCcpIHtcclxuICAgIHJldHVybiBPYmplY3QuZW50cmllcyhsb2FkT3JkZXIpLm1hcCgoW2tleSwgaXRlbV0pID0+IGNvbnZlcnREaXNwbGF5SXRlbShrZXksIGl0ZW0pKTtcclxuICB9XHJcbiAgcmV0dXJuIFtdO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb252ZXJ0RGlzcGxheUl0ZW0oa2V5OiBzdHJpbmcsIGl0ZW06IElMb2FkT3JkZXJFbnRyeSk6IHR5cGVzLklMb2FkT3JkZXJFbnRyeSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBrZXksXHJcbiAgICBtb2RJZDoga2V5LFxyXG4gICAgbmFtZToga2V5LFxyXG4gICAgbG9ja2VkOiBpdGVtLmxvY2tlZCxcclxuICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICBkYXRhOiB7XHJcbiAgICAgIHByZWZpeDogaXRlbS5wcmVmaXgsXHJcbiAgICB9XHJcbiAgfVxyXG59XHJcbiJdfQ==