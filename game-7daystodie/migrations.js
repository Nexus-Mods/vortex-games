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
exports.migrate100 = exports.migrate020 = void 0;
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const loadOrder_1 = require("./loadOrder");
function migrate020(api, oldVersion) {
    if (semver_1.default.gte(oldVersion, '0.2.0')) {
        return Promise.resolve();
    }
    const state = api.store.getState();
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    const hasMods = Object.keys(mods).length > 0;
    if (!hasMods) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        return api.sendNotification({
            id: '7dtd-requires-upgrade',
            type: 'warning',
            message: api.translate('Mods for 7 Days to Die need to be reinstalled', { ns: common_1.I18N_NAMESPACE }),
            noDismiss: true,
            actions: [
                {
                    title: 'Explain',
                    action: () => {
                        api.showDialog('info', '7 Days to Die', {
                            text: 'In version 17 of the game 7 Days to Die the way mods are installed '
                                + 'has changed considerably. Unfortunately we are now not able to support '
                                + 'this change with the way mods were previously installed.\n'
                                + 'This means that for the mods to work correctly you have to reinstall '
                                + 'them.\n'
                                + 'We are sorry for the inconvenience.',
                        }, [
                            { label: 'Close' },
                        ]);
                    },
                },
                {
                    title: 'Understood',
                    action: dismiss => {
                        dismiss();
                        resolve(undefined);
                    },
                },
            ],
        });
    });
}
exports.migrate020 = migrate020;
function migrate100(context, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (semver_1.default.gte(oldVersion, '1.0.0')) {
            return Promise.resolve();
        }
        const state = context.api.store.getState();
        const discoveryPath = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'path'], undefined);
        const activatorId = vortex_api_1.selectors.activatorForGame(state, common_1.GAME_ID);
        const activator = vortex_api_1.util.getActivator(activatorId);
        if (discoveryPath === undefined || activator === undefined) {
            return Promise.resolve();
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        if (Object.keys(mods).length === 0) {
            return Promise.resolve();
        }
        const profiles = vortex_api_1.util.getSafe(state, ['persistent', 'profiles'], {});
        const loProfiles = Object.keys(profiles).filter(id => { var _a; return ((_a = profiles[id]) === null || _a === void 0 ? void 0 : _a.gameId) === common_1.GAME_ID; });
        const loMap = loProfiles.reduce((accum, iter) => {
            const current = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', iter], []);
            const newLO = current.map(entry => {
                return {
                    enabled: true,
                    name: (mods[entry] !== undefined)
                        ? vortex_api_1.util.renderModName(mods[entry])
                        : entry,
                    id: entry,
                    modId: entry,
                };
            });
            accum[iter] = newLO;
            return accum;
        }, {});
        for (const profileId of Object.keys(loMap)) {
            yield loadOrder_1.serialize(context, loMap[profileId], profileId);
        }
        const modsPath = path_1.default.join(discoveryPath, common_1.modsRelPath());
        return context.api.awaitUI()
            .then(() => vortex_api_1.fs.ensureDirWritableAsync(modsPath))
            .then(() => context.api.emitAndAwait('purge-mods-in-path', common_1.GAME_ID, '', modsPath))
            .then(() => context.api.store.dispatch(vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true)));
    });
}
exports.migrate100 = migrate100;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBaUU7QUFFakUscUNBQWdFO0FBQ2hFLDJDQUF3QztBQUd4QyxTQUFnQixVQUFVLENBQUMsR0FBRyxFQUFFLFVBQVU7SUFDeEMsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEVBQUU7UUFDbkMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDMUI7SUFFRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ25DLE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3RFLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUU3QyxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDMUI7SUFFRCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDN0IsT0FBTyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDMUIsRUFBRSxFQUFFLHVCQUF1QjtZQUMzQixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLCtDQUErQyxFQUNwRSxFQUFFLEVBQUUsRUFBRSx1QkFBYyxFQUFFLENBQUM7WUFDekIsU0FBUyxFQUFFLElBQUk7WUFDZixPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLE1BQU0sRUFBRSxHQUFHLEVBQUU7d0JBQ1gsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsZUFBZSxFQUFFOzRCQUN0QyxJQUFJLEVBQUUscUVBQXFFO2tDQUNyRSx5RUFBeUU7a0NBQ3pFLDREQUE0RDtrQ0FDNUQsdUVBQXVFO2tDQUN2RSxTQUFTO2tDQUNULHFDQUFxQzt5QkFDNUMsRUFBRTs0QkFDRCxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUU7eUJBQ25CLENBQUMsQ0FBQztvQkFDTCxDQUFDO2lCQUNGO2dCQUNEO29CQUNFLEtBQUssRUFBRSxZQUFZO29CQUNuQixNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUU7d0JBQ2hCLE9BQU8sRUFBRSxDQUFDO3dCQUNWLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDckIsQ0FBQztpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBOUNELGdDQThDQztBQUVELFNBQXNCLFVBQVUsQ0FBQyxPQUFPLEVBQUUsVUFBVTs7UUFDbEQsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEVBQUU7WUFDbkMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7UUFFRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxNQUFNLGFBQWEsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3RDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sRUFBRSxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUV0RSxNQUFNLFdBQVcsR0FBRyxzQkFBUyxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDL0QsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDakQsSUFBSSxhQUFhLEtBQUssU0FBUyxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDMUQsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDMUI7UUFFRCxNQUFNLElBQUksR0FBb0MsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUM5RCxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXZDLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBRWxDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQzFCO1FBRUQsTUFBTSxRQUFRLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFdBQUMsT0FBQSxPQUFBLFFBQVEsQ0FBQyxFQUFFLENBQUMsMENBQUUsTUFBTSxNQUFLLGdCQUFPLENBQUEsRUFBQSxDQUFDLENBQUM7UUFDeEYsTUFBTSxLQUFLLEdBQW9DLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDL0UsTUFBTSxPQUFPLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUMzRSxNQUFNLEtBQUssR0FBYyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUMzQyxPQUFPO29CQUNMLE9BQU8sRUFBRSxJQUFJO29CQUNiLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxTQUFTLENBQUM7d0JBQy9CLENBQUMsQ0FBQyxpQkFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7d0JBQ2pDLENBQUMsQ0FBQyxLQUFLO29CQUNULEVBQUUsRUFBRSxLQUFLO29CQUNULEtBQUssRUFBRSxLQUFLO2lCQUNiLENBQUM7WUFDSixDQUFDLENBQUMsQ0FBQztZQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDcEIsT0FBTyxLQUFLLENBQUM7UUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFUCxLQUFLLE1BQU0sU0FBUyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDMUMsTUFBTSxxQkFBUyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDdkQ7UUFFRCxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxvQkFBVyxFQUFFLENBQUMsQ0FBQztRQUN6RCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFO2FBQ3pCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxlQUFFLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDL0MsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLG9CQUFvQixFQUFFLGdCQUFPLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQ2pGLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxzQkFBc0IsQ0FBQyxnQkFBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRixDQUFDO0NBQUE7QUFsREQsZ0NBa0RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIEkxOE5fTkFNRVNQQUNFLCBtb2RzUmVsUGF0aCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgc2VyaWFsaXplIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5pbXBvcnQgeyBMb2FkT3JkZXIgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtaWdyYXRlMDIwKGFwaSwgb2xkVmVyc2lvbik6IFByb21pc2U8dm9pZD4ge1xyXG4gIGlmIChzZW12ZXIuZ3RlKG9sZFZlcnNpb24sICcwLjIuMCcpKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBoYXNNb2RzID0gT2JqZWN0LmtleXMobW9kcykubGVuZ3RoID4gMDtcclxuXHJcbiAgaWYgKCFoYXNNb2RzKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgIHJldHVybiBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIGlkOiAnN2R0ZC1yZXF1aXJlcy11cGdyYWRlJyxcclxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxyXG4gICAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdNb2RzIGZvciA3IERheXMgdG8gRGllIG5lZWQgdG8gYmUgcmVpbnN0YWxsZWQnLFxyXG4gICAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pLFxyXG4gICAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ0V4cGxhaW4nLFxyXG4gICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJzcgRGF5cyB0byBEaWUnLCB7XHJcbiAgICAgICAgICAgICAgdGV4dDogJ0luIHZlcnNpb24gMTcgb2YgdGhlIGdhbWUgNyBEYXlzIHRvIERpZSB0aGUgd2F5IG1vZHMgYXJlIGluc3RhbGxlZCAnXHJcbiAgICAgICAgICAgICAgICAgICsgJ2hhcyBjaGFuZ2VkIGNvbnNpZGVyYWJseS4gVW5mb3J0dW5hdGVseSB3ZSBhcmUgbm93IG5vdCBhYmxlIHRvIHN1cHBvcnQgJ1xyXG4gICAgICAgICAgICAgICAgICArICd0aGlzIGNoYW5nZSB3aXRoIHRoZSB3YXkgbW9kcyB3ZXJlIHByZXZpb3VzbHkgaW5zdGFsbGVkLlxcbidcclxuICAgICAgICAgICAgICAgICAgKyAnVGhpcyBtZWFucyB0aGF0IGZvciB0aGUgbW9kcyB0byB3b3JrIGNvcnJlY3RseSB5b3UgaGF2ZSB0byByZWluc3RhbGwgJ1xyXG4gICAgICAgICAgICAgICAgICArICd0aGVtLlxcbidcclxuICAgICAgICAgICAgICAgICAgKyAnV2UgYXJlIHNvcnJ5IGZvciB0aGUgaW5jb252ZW5pZW5jZS4nLFxyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgeyBsYWJlbDogJ0Nsb3NlJyB9LFxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ1VuZGVyc3Rvb2QnLFxyXG4gICAgICAgICAgYWN0aW9uOiBkaXNtaXNzID0+IHtcclxuICAgICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxMDAoY29udGV4dCwgb2xkVmVyc2lvbik6IFByb21pc2U8dm9pZD4ge1xyXG4gIGlmIChzZW12ZXIuZ3RlKG9sZFZlcnNpb24sICcxLjAuMCcpKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5UGF0aCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICdwYXRoJ10sIHVuZGVmaW5lZCk7XHJcblxyXG4gIGNvbnN0IGFjdGl2YXRvcklkID0gc2VsZWN0b3JzLmFjdGl2YXRvckZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IGFjdGl2YXRvciA9IHV0aWwuZ2V0QWN0aXZhdG9yKGFjdGl2YXRvcklkKTtcclxuICBpZiAoZGlzY292ZXJ5UGF0aCA9PT0gdW5kZWZpbmVkIHx8IGFjdGl2YXRvciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG5cclxuICBpZiAoT2JqZWN0LmtleXMobW9kcykubGVuZ3RoID09PSAwKSB7XHJcbiAgICAvLyBObyBtb2RzIC0gbm8gcHJvYmxlbS5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHByb2ZpbGVzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnXSwge30pO1xyXG4gIGNvbnN0IGxvUHJvZmlsZXMgPSBPYmplY3Qua2V5cyhwcm9maWxlcykuZmlsdGVyKGlkID0+IHByb2ZpbGVzW2lkXT8uZ2FtZUlkID09PSBHQU1FX0lEKTtcclxuICBjb25zdCBsb01hcDogeyBbcHJvZklkOiBzdHJpbmddOiBMb2FkT3JkZXIgfSA9IGxvUHJvZmlsZXMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgY29uc3QgY3VycmVudCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIGl0ZXJdLCBbXSk7XHJcbiAgICBjb25zdCBuZXdMTzogTG9hZE9yZGVyID0gY3VycmVudC5tYXAoZW50cnkgPT4ge1xyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgbmFtZTogKG1vZHNbZW50cnldICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICA/IHV0aWwucmVuZGVyTW9kTmFtZShtb2RzW2VudHJ5XSlcclxuICAgICAgICAgIDogZW50cnksXHJcbiAgICAgICAgaWQ6IGVudHJ5LFxyXG4gICAgICAgIG1vZElkOiBlbnRyeSxcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gICAgYWNjdW1baXRlcl0gPSBuZXdMTztcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcblxyXG4gIGZvciAoY29uc3QgcHJvZmlsZUlkIG9mIE9iamVjdC5rZXlzKGxvTWFwKSkge1xyXG4gICAgYXdhaXQgc2VyaWFsaXplKGNvbnRleHQsIGxvTWFwW3Byb2ZpbGVJZF0sIHByb2ZpbGVJZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBtb2RzUmVsUGF0aCgpKTtcclxuICByZXR1cm4gY29udGV4dC5hcGkuYXdhaXRVSSgpXHJcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1vZHNQYXRoKSlcclxuICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLmVtaXRBbmRBd2FpdCgncHVyZ2UtbW9kcy1pbi1wYXRoJywgR0FNRV9JRCwgJycsIG1vZHNQYXRoKSlcclxuICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKSkpO1xyXG59XHJcbiJdfQ==