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
exports.getPersistentLoadOrder = exports.migrate148 = void 0;
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
exports.getPersistentLoadOrder = getPersistentLoadOrder;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esb0RBQTRCO0FBQzVCLDJDQUFvRDtBQUVwRCxxQ0FBbUM7QUFHbkMsU0FBc0IsVUFBVSxDQUFDLE9BQWdDLEVBQ2hDLFVBQWtCOztRQUNqRCxJQUFJLGdCQUFNLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsRUFBRTtZQUNuQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMxQjtRQUVELE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDckMsTUFBTSxpQkFBaUIsR0FBRyxzQkFBUyxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDN0UsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDaEUsTUFBTSxJQUFJLEdBQ1IsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDM0QsTUFBTSxRQUFRLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFlLEVBQUUsRUFBRSxXQUFDLE9BQUEsQ0FBQSxNQUFBLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLDBDQUFFLE9BQU8sTUFBSyxJQUFJLENBQUEsRUFBQSxDQUFDO1FBQzFFLE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQ25ELENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxtQkFBbUIsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3hELElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTtZQUMvQixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMxQjtRQUVELE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDM0IsSUFBSSxFQUFFLFNBQVM7WUFDZixhQUFhLEVBQUUsS0FBSztZQUNwQixPQUFPLEVBQUUsQ0FBQyxDQUFDLDJDQUEyQyxDQUFDO1lBQ3ZELE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxLQUFLLEVBQUUsTUFBTTtvQkFDYixNQUFNLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRTt3QkFDbEIsT0FBTyxFQUFFLENBQUM7d0JBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLDJCQUEyQixFQUFFOzRCQUMxRCxJQUFJLEVBQUUsQ0FBQyxDQUFDLCtEQUErRDtrQ0FDNUQscUVBQXFFO2tDQUNyRSwwRUFBMEU7a0NBQzFFLFNBQVMsQ0FBQzt5QkFDdEIsRUFBRTs0QkFDRCxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7eUJBQ25CLENBQUMsQ0FBQztvQkFDTCxDQUFDO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDO0NBQUE7QUEzQ0QsZ0NBMkNDO0FBRUQsU0FBZ0Isc0JBQXNCLENBQUMsR0FBd0IsRUFBRSxTQUFzQjtJQUdyRixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsTUFBTSxPQUFPLEdBQW1CLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9ELElBQUksQ0FBQSxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUUsTUFBTSxNQUFLLGdCQUFPLEVBQUU7UUFDL0IsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELFNBQVMsR0FBRyxTQUFTLGFBQVQsU0FBUyxjQUFULFNBQVMsR0FBSSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNqRyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7UUFDM0IsT0FBTyxFQUFFLENBQUM7S0FDWDtJQUNELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtRQUM1QixPQUFPLFNBQVMsQ0FBQztLQUNsQjtJQUNELElBQUksT0FBTyxTQUFTLEtBQUssUUFBUSxFQUFFO1FBQ2pDLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDdEY7SUFDRCxPQUFPLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFuQkQsd0RBbUJDO0FBRUQsU0FBUyxrQkFBa0IsQ0FBQyxHQUFXLEVBQUUsSUFBcUI7SUFDNUQsT0FBTztRQUNMLEVBQUUsRUFBRSxHQUFHO1FBQ1AsS0FBSyxFQUFFLEdBQUc7UUFDVixJQUFJLEVBQUUsR0FBRztRQUNULE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtRQUNuQixPQUFPLEVBQUUsSUFBSTtRQUNiLElBQUksRUFBRTtZQUNKLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQjtLQUNGLENBQUE7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgeyBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBJTG9hZE9yZGVyLCBJTG9hZE9yZGVyRW50cnkgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlMTQ4KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCAnMS40LjgnKSkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGxhc3RBY3RpdmVQcm9maWxlID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgbGFzdEFjdGl2ZVByb2ZpbGUpO1xyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPVxyXG4gICAgdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgaXNFbmFibGVkID0gKG1vZDogdHlwZXMuSU1vZCkgPT4gbW9kU3RhdGVbbW9kLmlkXT8uZW5hYmxlZCA9PT0gdHJ1ZTtcclxuICBjb25zdCBsaW1pdFBhdGNoTW9kID0gT2JqZWN0LnZhbHVlcyhtb2RzKS5maW5kKG1vZCA9PlxyXG4gICAgKG1vZC50eXBlID09PSAndzNtb2RsaW1pdHBhdGNoZXInKSAmJiBpc0VuYWJsZWQobW9kKSk7XHJcbiAgaWYgKGxpbWl0UGF0Y2hNb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgdCA9IGNvbnRleHQuYXBpLnRyYW5zbGF0ZTtcclxuICBjb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgIGFsbG93U3VwcHJlc3M6IGZhbHNlLFxyXG4gICAgbWVzc2FnZTogdCgnRmF1bHR5IFdpdGNoZXIgMyBNb2QgTGltaXQgUGF0Y2ggZGV0ZWN0ZWQnKSxcclxuICAgIGFjdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIHRpdGxlOiAnTW9yZScsXHJcbiAgICAgICAgYWN0aW9uOiAoZGlzbWlzcykgPT4ge1xyXG4gICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoJywge1xyXG4gICAgICAgICAgICB0ZXh0OiB0KCdEdWUgdG8gYSBidWcsIHRoZSBtb2QgbGltaXQgcGF0Y2ggd2FzIG5vdCBhcHBsaWVkIGNvcnJlY3RseS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICArICdQbGVhc2UgVW5pbnN0YWxsL1JlbW92ZSB5b3VyIGV4aXN0aW5nIG1vZCBsaW1pdCBtYXRjaCBtb2QgZW50cnkgaW4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICArICd5b3VyIG1vZHMgcGFnZSBhbmQgcmUtYXBwbHkgdGhlIHBhdGNoIHVzaW5nIHRoZSBcIkFwcGx5IE1vZCBMaW1pdCBQYXRjaFwiICdcclxuICAgICAgICAgICAgICAgICAgICAgKyAnYnV0dG9uLicpLFxyXG4gICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICB7IGxhYmVsOiAnQ2xvc2UnIH0sXHJcbiAgICAgICAgICBdKTtcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGxvYWRPcmRlcj86IElMb2FkT3JkZXIpOiB0eXBlcy5Mb2FkT3JkZXIge1xyXG4gIC8vIFdlIG1pZ3JhdGVkIGF3YXkgZnJvbSB0aGUgcmVndWxhciBtb2QgbG9hZCBvcmRlciBleHRlbnNpb25cclxuICAvLyAgdG8gdGhlIGZpbGUgYmFzZWQgbG9hZCBvcmRlcmluZ1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICBsb2FkT3JkZXIgPSBsb2FkT3JkZXIgPz8gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGxvYWRPcmRlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG4gIGlmIChBcnJheS5pc0FycmF5KGxvYWRPcmRlcikpIHtcclxuICAgIHJldHVybiBsb2FkT3JkZXI7XHJcbiAgfVxyXG4gIGlmICh0eXBlb2YgbG9hZE9yZGVyID09PSAnb2JqZWN0Jykge1xyXG4gICAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKGxvYWRPcmRlcikubWFwKChba2V5LCBpdGVtXSkgPT4gY29udmVydERpc3BsYXlJdGVtKGtleSwgaXRlbSkpO1xyXG4gIH1cclxuICByZXR1cm4gW107XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbnZlcnREaXNwbGF5SXRlbShrZXk6IHN0cmluZywgaXRlbTogSUxvYWRPcmRlckVudHJ5KTogdHlwZXMuSUxvYWRPcmRlckVudHJ5IHtcclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IGtleSxcclxuICAgIG1vZElkOiBrZXksXHJcbiAgICBuYW1lOiBrZXksXHJcbiAgICBsb2NrZWQ6IGl0ZW0ubG9ja2VkLFxyXG4gICAgZW5hYmxlZDogdHJ1ZSxcclxuICAgIGRhdGE6IHtcclxuICAgICAgcHJlZml4OiBpdGVtLnByZWZpeCxcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19