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
exports.migrate1011 = exports.migrate100 = exports.migrate020 = void 0;
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
            yield (0, loadOrder_1.serialize)(context, loMap[profileId], undefined, profileId);
        }
        const modsPath = path_1.default.join(discoveryPath, (0, common_1.modsRelPath)());
        return context.api.awaitUI()
            .then(() => vortex_api_1.fs.ensureDirWritableAsync(modsPath))
            .then(() => context.api.emitAndAwait('purge-mods-in-path', common_1.GAME_ID, '', modsPath))
            .then(() => context.api.store.dispatch(vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true)));
    });
}
exports.migrate100 = migrate100;
function migrate1011(context, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (semver_1.default.gte(oldVersion, '1.0.11')) {
            return Promise.resolve();
        }
        const state = context.api.store.getState();
        const discoveryPath = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID, 'path'], undefined);
        if (!discoveryPath) {
            return Promise.resolve();
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        if (Object.keys(mods).length === 0) {
            return Promise.resolve();
        }
        const profiles = vortex_api_1.util.getSafe(state, ['persistent', 'profiles'], {});
        const loProfiles = Object.keys(profiles).filter(id => { var _a; return ((_a = profiles[id]) === null || _a === void 0 ? void 0 : _a.gameId) === common_1.GAME_ID; });
        const loMap = loProfiles.reduce((accum, iter) => {
            const lo = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', iter], []);
            accum[iter] = lo;
            return accum;
        }, {});
        for (const profileId of Object.keys(loMap)) {
            try {
                yield (0, loadOrder_1.serialize)(context, loMap[profileId], undefined, profileId);
                yield vortex_api_1.fs.removeAsync(path_1.default.join(discoveryPath, `${profileId}_loadOrder.json`)).catch(err => null);
            }
            catch (err) {
                return Promise.reject(new Error(`Failed to migrate load order for ${profileId}: ${err}`));
            }
        }
        const modsPath = path_1.default.join(discoveryPath, (0, common_1.modsRelPath)());
        return context.api.awaitUI()
            .then(() => vortex_api_1.fs.ensureDirWritableAsync(modsPath))
            .then(() => context.api.emitAndAwait('purge-mods-in-path', common_1.GAME_ID, '', modsPath))
            .then(() => context.api.store.dispatch(vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true)));
    });
}
exports.migrate1011 = migrate1011;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBaUU7QUFFakUscUNBQW1GO0FBQ25GLDJDQUF3QztBQUd4QyxTQUFnQixVQUFVLENBQUMsR0FBRyxFQUFFLFVBQVU7SUFDeEMsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEVBQUU7UUFDbkMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDMUI7SUFFRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ25DLE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3RFLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUU3QyxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDMUI7SUFFRCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDN0IsT0FBTyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDMUIsRUFBRSxFQUFFLHVCQUF1QjtZQUMzQixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLCtDQUErQyxFQUNwRSxFQUFFLEVBQUUsRUFBRSx1QkFBYyxFQUFFLENBQUM7WUFDekIsU0FBUyxFQUFFLElBQUk7WUFDZixPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLE1BQU0s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QUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLHNCQUFzQixDQUFDLGdCQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzNGLENBQUM7Q0FBQTtBQTNDRCxrQ0EyQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIEkxOE5fTkFNRVNQQUNFLCBsb2FkT3JkZXJGaWxlUGF0aCwgbW9kc1JlbFBhdGggfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBzZXJpYWxpemUgfSBmcm9tICcuL2xvYWRPcmRlcic7XG5pbXBvcnQgeyBMb2FkT3JkZXIgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGZ1bmN0aW9uIG1pZ3JhdGUwMjAoYXBpLCBvbGRWZXJzaW9uKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZW12ZXIuZ3RlKG9sZFZlcnNpb24sICcwLjIuMCcpKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBoYXNNb2RzID0gT2JqZWN0LmtleXMobW9kcykubGVuZ3RoID4gMDtcblxuICBpZiAoIWhhc01vZHMpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICByZXR1cm4gYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgaWQ6ICc3ZHRkLXJlcXVpcmVzLXVwZ3JhZGUnLFxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnTW9kcyBmb3IgNyBEYXlzIHRvIERpZSBuZWVkIHRvIGJlIHJlaW5zdGFsbGVkJyxcbiAgICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSksXG4gICAgICBub0Rpc21pc3M6IHRydWUsXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0aXRsZTogJ0V4cGxhaW4nLFxuICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnNyBEYXlzIHRvIERpZScsIHtcbiAgICAgICAgICAgICAgdGV4dDogJ0luIHZlcnNpb24gMTcgb2YgdGhlIGdhbWUgNyBEYXlzIHRvIERpZSB0aGUgd2F5IG1vZHMgYXJlIGluc3RhbGxlZCAnXG4gICAgICAgICAgICAgICAgICArICdoYXMgY2hhbmdlZCBjb25zaWRlcmFibHkuIFVuZm9ydHVuYXRlbHkgd2UgYXJlIG5vdyBub3QgYWJsZSB0byBzdXBwb3J0ICdcbiAgICAgICAgICAgICAgICAgICsgJ3RoaXMgY2hhbmdlIHdpdGggdGhlIHdheSBtb2RzIHdlcmUgcHJldmlvdXNseSBpbnN0YWxsZWQuXFxuJ1xuICAgICAgICAgICAgICAgICAgKyAnVGhpcyBtZWFucyB0aGF0IGZvciB0aGUgbW9kcyB0byB3b3JrIGNvcnJlY3RseSB5b3UgaGF2ZSB0byByZWluc3RhbGwgJ1xuICAgICAgICAgICAgICAgICAgKyAndGhlbS5cXG4nXG4gICAgICAgICAgICAgICAgICArICdXZSBhcmUgc29ycnkgZm9yIHRoZSBpbmNvbnZlbmllbmNlLicsXG4gICAgICAgICAgICB9LCBbXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDbG9zZScgfSxcbiAgICAgICAgICAgIF0pO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0aXRsZTogJ1VuZGVyc3Rvb2QnLFxuICAgICAgICAgIGFjdGlvbjogZGlzbWlzcyA9PiB7XG4gICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWlncmF0ZTEwMChjb250ZXh0LCBvbGRWZXJzaW9uKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZW12ZXIuZ3RlKG9sZFZlcnNpb24sICcxLjAuMCcpKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnlQYXRoID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSUQsICdwYXRoJ10sIHVuZGVmaW5lZCk7XG5cbiAgY29uc3QgYWN0aXZhdG9ySWQgPSBzZWxlY3RvcnMuYWN0aXZhdG9yRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGNvbnN0IGFjdGl2YXRvciA9IHV0aWwuZ2V0QWN0aXZhdG9yKGFjdGl2YXRvcklkKTtcbiAgaWYgKGRpc2NvdmVyeVBhdGggPT09IHVuZGVmaW5lZCB8fCBhY3RpdmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuXG4gIGlmIChPYmplY3Qua2V5cyhtb2RzKS5sZW5ndGggPT09IDApIHtcbiAgICAvLyBObyBtb2RzIC0gbm8gcHJvYmxlbS5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBwcm9maWxlcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJ10sIHt9KTtcbiAgY29uc3QgbG9Qcm9maWxlcyA9IE9iamVjdC5rZXlzKHByb2ZpbGVzKS5maWx0ZXIoaWQgPT4gcHJvZmlsZXNbaWRdPy5nYW1lSWQgPT09IEdBTUVfSUQpO1xuICBjb25zdCBsb01hcDogeyBbcHJvZklkOiBzdHJpbmddOiBMb2FkT3JkZXIgfSA9IGxvUHJvZmlsZXMucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xuICAgIGNvbnN0IGN1cnJlbnQgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBpdGVyXSwgW10pO1xuICAgIGNvbnN0IG5ld0xPOiBMb2FkT3JkZXIgPSBjdXJyZW50Lm1hcChlbnRyeSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICBuYW1lOiAobW9kc1tlbnRyeV0gIT09IHVuZGVmaW5lZClcbiAgICAgICAgICA/IHV0aWwucmVuZGVyTW9kTmFtZShtb2RzW2VudHJ5XSlcbiAgICAgICAgICA6IGVudHJ5LFxuICAgICAgICBpZDogZW50cnksXG4gICAgICAgIG1vZElkOiBlbnRyeSxcbiAgICAgIH07XG4gICAgfSk7XG4gICAgYWNjdW1baXRlcl0gPSBuZXdMTztcbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIHt9KTtcblxuICBmb3IgKGNvbnN0IHByb2ZpbGVJZCBvZiBPYmplY3Qua2V5cyhsb01hcCkpIHtcbiAgICBhd2FpdCBzZXJpYWxpemUoY29udGV4dCwgbG9NYXBbcHJvZmlsZUlkXSwgdW5kZWZpbmVkLCBwcm9maWxlSWQpO1xuICB9XG5cbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgbW9kc1JlbFBhdGgoKSk7XG4gIHJldHVybiBjb250ZXh0LmFwaS5hd2FpdFVJKClcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKG1vZHNQYXRoKSlcbiAgICAudGhlbigoKSA9PiBjb250ZXh0LmFwaS5lbWl0QW5kQXdhaXQoJ3B1cmdlLW1vZHMtaW4tcGF0aCcsIEdBTUVfSUQsICcnLCBtb2RzUGF0aCkpXG4gICAgLnRoZW4oKCkgPT4gY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXREZXBsb3ltZW50TmVjZXNzYXJ5KEdBTUVfSUQsIHRydWUpKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlMTAxMShjb250ZXh0LCBvbGRWZXJzaW9uKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZW12ZXIuZ3RlKG9sZFZlcnNpb24sICcxLjAuMTEnKSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5UGF0aCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAncGF0aCddLCB1bmRlZmluZWQpO1xuICBpZiAoIWRpc2NvdmVyeVBhdGgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcblxuICBpZiAoT2JqZWN0LmtleXMobW9kcykubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gTm8gbW9kcyAtIG5vIHByb2JsZW0uXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3QgcHJvZmlsZXMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdwcm9maWxlcyddLCB7fSk7XG4gIGNvbnN0IGxvUHJvZmlsZXMgPSBPYmplY3Qua2V5cyhwcm9maWxlcykuZmlsdGVyKGlkID0+IHByb2ZpbGVzW2lkXT8uZ2FtZUlkID09PSBHQU1FX0lEKTtcbiAgY29uc3QgbG9NYXA6IHsgW3Byb2ZJZDogc3RyaW5nXTogTG9hZE9yZGVyIH0gPSBsb1Byb2ZpbGVzLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcbiAgICBjb25zdCBsbzogTG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgaXRlcl0sIFtdKTtcbiAgICBhY2N1bVtpdGVyXSA9IGxvO1xuICAgIHJldHVybiBhY2N1bTtcbiAgfSwge30pO1xuXG4gIGZvciAoY29uc3QgcHJvZmlsZUlkIG9mIE9iamVjdC5rZXlzKGxvTWFwKSkge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBzZXJpYWxpemUoY29udGV4dCwgbG9NYXBbcHJvZmlsZUlkXSwgdW5kZWZpbmVkLCBwcm9maWxlSWQpO1xuICAgICAgLy8gTm90IGEgYml0IGRlYWwgaWYgd2UgZmFpbCB0byByZW1vdmUgdGhlIGxvRmlsZSBmcm9tIHRoZSBvbGQgbG9jYXRpb24uXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgYCR7cHJvZmlsZUlkfV9sb2FkT3JkZXIuanNvbmApKS5jYXRjaChlcnIgPT4gbnVsbCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKGBGYWlsZWQgdG8gbWlncmF0ZSBsb2FkIG9yZGVyIGZvciAke3Byb2ZpbGVJZH06ICR7ZXJyfWApKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBtb2RzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBtb2RzUmVsUGF0aCgpKTtcbiAgcmV0dXJuIGNvbnRleHQuYXBpLmF3YWl0VUkoKVxuICAgIC50aGVuKCgpID0+IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobW9kc1BhdGgpKVxuICAgIC50aGVuKCgpID0+IGNvbnRleHQuYXBpLmVtaXRBbmRBd2FpdCgncHVyZ2UtbW9kcy1pbi1wYXRoJywgR0FNRV9JRCwgJycsIG1vZHNQYXRoKSlcbiAgICAudGhlbigoKSA9PiBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSkpKTtcbn1cbiJdfQ==