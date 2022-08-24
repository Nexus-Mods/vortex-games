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
            yield (0, loadOrder_1.serialize)(context, loMap[profileId], profileId);
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
                yield (0, loadOrder_1.serialize)(context, loMap[profileId], profileId);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLG9EQUE0QjtBQUM1QiwyQ0FBaUU7QUFFakUscUNBQW1GO0FBQ25GLDJDQUF3QztBQUd4QyxTQUFnQixVQUFVLENBQUMsR0FBRyxFQUFFLFVBQVU7SUFDeEMsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEVBQUU7UUFDbkMsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDMUI7SUFFRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQ25DLE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3RFLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUU3QyxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7S0FDMUI7SUFFRCxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDN0IsT0FBTyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7WUFDMUIsRUFBRSxFQUFFLHVCQUF1QjtZQUMzQixJQUFJLEVBQUUsU0FBUztZQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLCtDQUErQyxFQUNwRSxFQUFFLEVBQUUsRUFBRSx1QkFBYyxFQUFFLENBQUM7WUFDekIsU0FBUyxFQUFFLElBQUk7WUFDZixPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsS0FBSyxFQUFFLFNBQVM7b0JBQ2hCLE1BQU0s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QUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxzQkFBc0IsQ0FBQyxnQkFBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMzRixDQUFDO0NBQUE7QUEzQ0Qsa0NBMkNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIEkxOE5fTkFNRVNQQUNFLCBsb2FkT3JkZXJGaWxlUGF0aCwgbW9kc1JlbFBhdGggfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IHNlcmlhbGl6ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcclxuaW1wb3J0IHsgTG9hZE9yZGVyIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWlncmF0ZTAyMChhcGksIG9sZFZlcnNpb24pOiBQcm9taXNlPHZvaWQ+IHtcclxuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCAnMC4yLjAnKSkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgaGFzTW9kcyA9IE9iamVjdC5rZXlzKG1vZHMpLmxlbmd0aCA+IDA7XHJcblxyXG4gIGlmICghaGFzTW9kcykge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICByZXR1cm4gYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICBpZDogJzdkdGQtcmVxdWlyZXMtdXBncmFkZScsXHJcbiAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnTW9kcyBmb3IgNyBEYXlzIHRvIERpZSBuZWVkIHRvIGJlIHJlaW5zdGFsbGVkJyxcclxuICAgICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSxcclxuICAgICAgbm9EaXNtaXNzOiB0cnVlLFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdFeHBsYWluJyxcclxuICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICc3IERheXMgdG8gRGllJywge1xyXG4gICAgICAgICAgICAgIHRleHQ6ICdJbiB2ZXJzaW9uIDE3IG9mIHRoZSBnYW1lIDcgRGF5cyB0byBEaWUgdGhlIHdheSBtb2RzIGFyZSBpbnN0YWxsZWQgJ1xyXG4gICAgICAgICAgICAgICAgICArICdoYXMgY2hhbmdlZCBjb25zaWRlcmFibHkuIFVuZm9ydHVuYXRlbHkgd2UgYXJlIG5vdyBub3QgYWJsZSB0byBzdXBwb3J0ICdcclxuICAgICAgICAgICAgICAgICAgKyAndGhpcyBjaGFuZ2Ugd2l0aCB0aGUgd2F5IG1vZHMgd2VyZSBwcmV2aW91c2x5IGluc3RhbGxlZC5cXG4nXHJcbiAgICAgICAgICAgICAgICAgICsgJ1RoaXMgbWVhbnMgdGhhdCBmb3IgdGhlIG1vZHMgdG8gd29yayBjb3JyZWN0bHkgeW91IGhhdmUgdG8gcmVpbnN0YWxsICdcclxuICAgICAgICAgICAgICAgICAgKyAndGhlbS5cXG4nXHJcbiAgICAgICAgICAgICAgICAgICsgJ1dlIGFyZSBzb3JyeSBmb3IgdGhlIGluY29udmVuaWVuY2UuJyxcclxuICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgIHsgbGFiZWw6ICdDbG9zZScgfSxcclxuICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdVbmRlcnN0b29kJyxcclxuICAgICAgICAgIGFjdGlvbjogZGlzbWlzcyA9PiB7XHJcbiAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlMTAwKGNvbnRleHQsIG9sZFZlcnNpb24pOiBQcm9taXNlPHZvaWQ+IHtcclxuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCAnMS4wLjAnKSkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeVBhdGggPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lELCAncGF0aCddLCB1bmRlZmluZWQpO1xyXG5cclxuICBjb25zdCBhY3RpdmF0b3JJZCA9IHNlbGVjdG9ycy5hY3RpdmF0b3JGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBhY3RpdmF0b3IgPSB1dGlsLmdldEFjdGl2YXRvcihhY3RpdmF0b3JJZCk7XHJcbiAgaWYgKGRpc2NvdmVyeVBhdGggPT09IHVuZGVmaW5lZCB8fCBhY3RpdmF0b3IgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcclxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuXHJcbiAgaWYgKE9iamVjdC5rZXlzKG1vZHMpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgLy8gTm8gbW9kcyAtIG5vIHByb2JsZW0uXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBwcm9maWxlcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJ10sIHt9KTtcclxuICBjb25zdCBsb1Byb2ZpbGVzID0gT2JqZWN0LmtleXMocHJvZmlsZXMpLmZpbHRlcihpZCA9PiBwcm9maWxlc1tpZF0/LmdhbWVJZCA9PT0gR0FNRV9JRCk7XHJcbiAgY29uc3QgbG9NYXA6IHsgW3Byb2ZJZDogc3RyaW5nXTogTG9hZE9yZGVyIH0gPSBsb1Byb2ZpbGVzLnJlZHVjZSgoYWNjdW0sIGl0ZXIpID0+IHtcclxuICAgIGNvbnN0IGN1cnJlbnQgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBpdGVyXSwgW10pO1xyXG4gICAgY29uc3QgbmV3TE86IExvYWRPcmRlciA9IGN1cnJlbnQubWFwKGVudHJ5ID0+IHtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIG5hbWU6IChtb2RzW2VudHJ5XSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgPyB1dGlsLnJlbmRlck1vZE5hbWUobW9kc1tlbnRyeV0pXHJcbiAgICAgICAgICA6IGVudHJ5LFxyXG4gICAgICAgIGlkOiBlbnRyeSxcclxuICAgICAgICBtb2RJZDogZW50cnksXHJcbiAgICAgIH07XHJcbiAgICB9KTtcclxuICAgIGFjY3VtW2l0ZXJdID0gbmV3TE87XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwge30pO1xyXG5cclxuICBmb3IgKGNvbnN0IHByb2ZpbGVJZCBvZiBPYmplY3Qua2V5cyhsb01hcCkpIHtcclxuICAgIGF3YWl0IHNlcmlhbGl6ZShjb250ZXh0LCBsb01hcFtwcm9maWxlSWRdLCBwcm9maWxlSWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgbW9kc1JlbFBhdGgoKSk7XHJcbiAgcmV0dXJuIGNvbnRleHQuYXBpLmF3YWl0VUkoKVxyXG4gICAgLnRoZW4oKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCkpXHJcbiAgICAudGhlbigoKSA9PiBjb250ZXh0LmFwaS5lbWl0QW5kQXdhaXQoJ3B1cmdlLW1vZHMtaW4tcGF0aCcsIEdBTUVfSUQsICcnLCBtb2RzUGF0aCkpXHJcbiAgICAudGhlbigoKSA9PiBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSkpKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxMDExKGNvbnRleHQsIG9sZFZlcnNpb24pOiBQcm9taXNlPHZvaWQ+IHtcclxuICBpZiAoc2VtdmVyLmd0ZShvbGRWZXJzaW9uLCAnMS4wLjExJykpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnlQYXRoID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRCwgJ3BhdGgnXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoIWRpc2NvdmVyeVBhdGgpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPSB1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcblxyXG4gIGlmIChPYmplY3Qua2V5cyhtb2RzKS5sZW5ndGggPT09IDApIHtcclxuICAgIC8vIE5vIG1vZHMgLSBubyBwcm9ibGVtLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgcHJvZmlsZXMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdwcm9maWxlcyddLCB7fSk7XHJcbiAgY29uc3QgbG9Qcm9maWxlcyA9IE9iamVjdC5rZXlzKHByb2ZpbGVzKS5maWx0ZXIoaWQgPT4gcHJvZmlsZXNbaWRdPy5nYW1lSWQgPT09IEdBTUVfSUQpO1xyXG4gIGNvbnN0IGxvTWFwOiB7IFtwcm9mSWQ6IHN0cmluZ106IExvYWRPcmRlciB9ID0gbG9Qcm9maWxlcy5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XHJcbiAgICBjb25zdCBsbzogTG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgaXRlcl0sIFtdKTtcclxuICAgIGFjY3VtW2l0ZXJdID0gbG87XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwge30pO1xyXG5cclxuICBmb3IgKGNvbnN0IHByb2ZpbGVJZCBvZiBPYmplY3Qua2V5cyhsb01hcCkpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IHNlcmlhbGl6ZShjb250ZXh0LCBsb01hcFtwcm9maWxlSWRdLCBwcm9maWxlSWQpO1xyXG4gICAgICAvLyBOb3QgYSBiaXQgZGVhbCBpZiB3ZSBmYWlsIHRvIHJlbW92ZSB0aGUgbG9GaWxlIGZyb20gdGhlIG9sZCBsb2NhdGlvbi5cclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsIGAke3Byb2ZpbGVJZH1fbG9hZE9yZGVyLmpzb25gKSkuY2F0Y2goZXJyID0+IG51bGwpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoYEZhaWxlZCB0byBtaWdyYXRlIGxvYWQgb3JkZXIgZm9yICR7cHJvZmlsZUlkfTogJHtlcnJ9YCkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgbW9kc1JlbFBhdGgoKSk7XHJcbiAgcmV0dXJuIGNvbnRleHQuYXBpLmF3YWl0VUkoKVxyXG4gICAgLnRoZW4oKCkgPT4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhtb2RzUGF0aCkpXHJcbiAgICAudGhlbigoKSA9PiBjb250ZXh0LmFwaS5lbWl0QW5kQXdhaXQoJ3B1cmdlLW1vZHMtaW4tcGF0aCcsIEdBTUVfSUQsICcnLCBtb2RzUGF0aCkpXHJcbiAgICAudGhlbigoKSA9PiBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSkpKTtcclxufVxyXG4iXX0=