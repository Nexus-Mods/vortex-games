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
const bluebird_1 = __importDefault(require("bluebird"));
const React = __importStar(require("react"));
const BS = __importStar(require("react-bootstrap"));
const react_redux_1 = require("react-redux");
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const collections_1 = require("./collections/collections");
const CollectionsDataView_1 = __importDefault(require("./collections/CollectionsDataView"));
const statics_1 = require("./statics");
const util_1 = require("./util");
const I18N_NAMESPACE = `game-${statics_1.GAME_ID}`;
const STEAM_APPID = '379430';
const EPIC_APPID = 'Eel';
const XBOX_APPID = 'DeepSilver.KingdomComeDeliverance';
const XBOXEXECNAME = 'App';
const _MODS_STATE = {
    enabled: [],
    disabled: [],
    display: [],
};
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([STEAM_APPID, XBOX_APPID, EPIC_APPID])
        .then(game => game.gamePath);
}
function requiresLauncher(gamePath, store) {
    return __awaiter(this, void 0, void 0, function* () {
        if (store === 'xbox') {
            return Promise.resolve({
                launcher: 'xbox',
                addInfo: {
                    appId: XBOX_APPID,
                    parameters: [{ appExecName: XBOXEXECNAME }],
                },
            });
        }
        if (store === 'epic') {
            return Promise.resolve({
                launcher: 'epic',
                addInfo: {
                    appId: EPIC_APPID,
                },
            });
        }
        return Promise.resolve(undefined);
    });
}
function getExecutable(discoveredPath) {
    const steamPath = path_1.default.join('Bin', 'Win64', 'KingdomCome.exe');
    const epicPath = path_1.default.join('Bin', 'Win64MasterMasterEpicPGO', 'KingdomCome.exe');
    const xboxPath = path_1.default.join('gamelaunchhelper.exe');
    const isCorrectExec = (exec) => {
        try {
            vortex_api_1.fs.statSync(path_1.default.join(discoveredPath, exec));
            return true;
        }
        catch (err) {
            return false;
        }
    };
    if (isCorrectExec(epicPath)) {
        return epicPath;
    }
    ;
    if (isCorrectExec(xboxPath)) {
        return xboxPath;
    }
    ;
    if (isCorrectExec(steamPath)) {
        return steamPath;
    }
    ;
    return steamPath;
}
function prepareForModding(context, discovery) {
    const state = context.api.store.getState();
    const profile = vortex_api_1.selectors.activeProfile(state);
    return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(discovery.path, 'Mods'), () => bluebird_1.default.resolve())
        .then(() => getCurrentOrder(path_1.default.join(discovery.path, modsPath(), statics_1.MODS_ORDER_FILENAME)))
        .catch(err => err.code === 'ENOENT' ? Promise.resolve([]) : Promise.reject(err))
        .then(data => setNewOrder({ context, profile }, Array.isArray(data) ? data : data.split('\n')));
}
function getCurrentOrder(modOrderFilepath) {
    return vortex_api_1.fs.readFileAsync(modOrderFilepath, { encoding: 'utf8' });
}
function walkAsync(dir) {
    let entries = [];
    return vortex_api_1.fs.readdirAsync(dir).then(files => {
        return bluebird_1.default.each(files, file => {
            const fullPath = path_1.default.join(dir, file);
            return vortex_api_1.fs.statAsync(fullPath).then(stats => {
                if (stats.isDirectory()) {
                    return walkAsync(fullPath)
                        .then(nestedFiles => {
                        entries = entries.concat(nestedFiles);
                        return Promise.resolve();
                    });
                }
                else {
                    entries.push(fullPath);
                    return Promise.resolve();
                }
            });
        });
    })
        .then(() => Promise.resolve(entries))
        .catch(err => {
        (0, vortex_api_1.log)('error', 'Unable to read mod directory', err);
        return Promise.resolve(entries);
    });
}
function readModsFolder(modsFolder, api) {
    const extL = input => path_1.default.extname(input).toLowerCase();
    const isValidMod = modFile => ['.pak', '.cfg', '.manifest'].indexOf(extL(modFile)) !== -1;
    return vortex_api_1.fs.readdirAsync(modsFolder)
        .then(entries => bluebird_1.default.reduce(entries, (accum, current) => {
        const currentPath = path_1.default.join(modsFolder, current);
        return vortex_api_1.fs.readdirAsync(currentPath)
            .then(modFiles => {
            if (modFiles.some(isValidMod) === true) {
                accum.push(current);
            }
            return Promise.resolve(accum);
        })
            .catch(err => Promise.resolve(accum));
    }, []))
        .catch(err => {
        const allowReport = ['ENOENT', 'EPERM', 'EACCESS'].indexOf(err.code) === -1;
        api.showErrorNotification('failed to read kingdom come mods directory', err.message, { allowReport });
        return Promise.resolve([]);
    });
}
function listHasMod(modId, list) {
    return (!!list)
        ? list.map(mod => (0, util_1.transformId)(mod).toLowerCase()).includes(modId.toLowerCase())
        : false;
}
function getManuallyAddedMods(disabledMods, enabledMods, modOrderFilepath, api) {
    const modsPath = path_1.default.dirname(modOrderFilepath);
    return readModsFolder(modsPath, api).then(deployedMods => getCurrentOrder(modOrderFilepath)
        .catch(err => (err.code === 'ENOENT') ? Promise.resolve('') : Promise.reject(err))
        .then(data => {
        const manuallyAdded = data.split('\n').filter(entry => !listHasMod(entry, enabledMods)
            && !listHasMod(entry, disabledMods)
            && listHasMod(entry, deployedMods));
        return Promise.resolve(manuallyAdded);
    }));
}
function refreshModList(context, discoveryPath) {
    const state = context.api.store.getState();
    const profile = vortex_api_1.selectors.activeProfile(state);
    const installationPath = vortex_api_1.selectors.installPathForGame(state, statics_1.GAME_ID);
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', statics_1.GAME_ID], []);
    const modKeys = Object.keys(mods);
    const modState = vortex_api_1.util.getSafe(profile, ['modState'], {});
    const enabled = modKeys.filter(mod => !!modState[mod] && modState[mod].enabled);
    const disabled = modKeys.filter(dis => !enabled.includes(dis));
    const extL = input => path_1.default.extname(input).toLowerCase();
    return bluebird_1.default.reduce(enabled, (accum, mod) => {
        var _a;
        if (((_a = mods[mod]) === null || _a === void 0 ? void 0 : _a.installationPath) === undefined) {
            return accum;
        }
        const modPath = path_1.default.join(installationPath, mods[mod].installationPath);
        return walkAsync(modPath)
            .then(entries => (entries.find(fileName => ['.pak', '.cfg', '.manifest'].includes(extL(fileName))) !== undefined)
            ? accum.concat(mod)
            : accum);
    }, []).then(managedMods => {
        return getManuallyAddedMods(disabled, enabled, path_1.default.join(discoveryPath, modsPath(), statics_1.MODS_ORDER_FILENAME), context.api)
            .then(manuallyAdded => {
            _MODS_STATE.enabled = [].concat(managedMods
                .map(mod => (0, util_1.transformId)(mod)), manuallyAdded);
            _MODS_STATE.disabled = disabled;
            _MODS_STATE.display = _MODS_STATE.enabled;
            return Promise.resolve();
        });
    });
}
function LoadOrderBase(props) {
    const getMod = (item) => {
        const keys = Object.keys(props.mods);
        const found = keys.find(key => (0, util_1.transformId)(key) === item);
        return found !== undefined
            ? props.mods[found]
            : { attributes: { name: item } };
    };
    class ItemRenderer extends React.Component {
        render() {
            if (props.mods === undefined) {
                return null;
            }
            const item = this.props.item;
            const mod = getMod(item);
            return React.createElement(BS.ListGroupItem, {
                style: {
                    backgroundColor: 'var(--brand-bg, black)',
                    borderBottom: '2px solid var(--border-color, white)'
                },
            }, React.createElement('div', {
                style: {
                    fontSize: '1.1em',
                },
            }, React.createElement('img', {
                src: !!mod.attributes.pictureUrl
                    ? mod.attributes.pictureUrl
                    : `${__dirname}/gameart.jpg`,
                className: 'mod-picture',
                width: '75px',
                height: '45px',
                style: {
                    margin: '5px 10px 5px 5px',
                    border: '1px solid var(--brand-secondary,#D78F46)',
                },
            }), vortex_api_1.util.renderModName(mod)));
        }
    }
    return React.createElement(vortex_api_1.MainPage, {}, React.createElement(vortex_api_1.MainPage.Body, {}, React.createElement(BS.Panel, { id: 'kcd-loadorder-panel' }, React.createElement(BS.Panel.Body, {}, React.createElement(vortex_api_1.FlexLayout, { type: 'row' }, React.createElement(vortex_api_1.FlexLayout.Flex, {}, React.createElement(vortex_api_1.DraggableList, {
        id: 'kcd-loadorder',
        itemTypeId: 'kcd-loadorder-item',
        items: _MODS_STATE.display,
        itemRenderer: ItemRenderer,
        style: {
            height: '100%',
            overflow: 'auto',
            borderWidth: 'var(--border-width, 1px)',
            borderStyle: 'solid',
            borderColor: 'var(--border-color, white)',
        },
        apply: ordered => {
            props.onSetDeploymentNecessary(statics_1.GAME_ID, true);
            return setNewOrder(props, ordered);
        },
    })), React.createElement(vortex_api_1.FlexLayout.Flex, {}, React.createElement('div', {
        style: {
            padding: 'var(--half-gutter, 15px)',
        }
    }, React.createElement('h2', {}, props.t('Changing your load order', { ns: I18N_NAMESPACE })), React.createElement('p', {}, props.t('Drag and drop the mods on the left to reorder them. Kingdom Come: Deliverance uses a mod_order.txt file '
        + 'to define the order in which mods are loaded, Vortex will write the folder names of the displayed '
        + 'mods in the order you have set. '
        + 'Mods placed at the bottom of the load order will have priority over those above them.', { ns: I18N_NAMESPACE })), React.createElement('p', {}, props.t('Note: Vortex will detect manually added mods as long as these have been added to the mod_order.txt file. '
        + 'Manually added mods are not managed by Vortex - to remove these, you will have to '
        + 'manually erase the entry from the mod_order.txt file.', { ns: I18N_NAMESPACE })))))))));
}
function modsPath() {
    return 'Mods';
}
function setNewOrder(props, ordered) {
    const { context, profile, onSetOrder } = props;
    if ((profile === null || profile === void 0 ? void 0 : profile.id) === undefined) {
        (0, vortex_api_1.log)('error', 'failed to set new load order', 'undefined profile');
        return;
    }
    const filtered = ordered.filter(entry => !!entry);
    _MODS_STATE.display = filtered;
    return (!!onSetOrder)
        ? onSetOrder(profile.id, filtered)
        : context.api.store.dispatch(vortex_api_1.actions.setLoadOrder(profile.id, filtered));
}
function writeOrderFile(filePath, modList) {
    return vortex_api_1.fs.removeAsync(filePath)
        .catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err))
        .then(() => vortex_api_1.fs.ensureFileAsync(filePath))
        .then(() => vortex_api_1.fs.writeFileAsync(filePath, modList.join('\n'), { encoding: 'utf8' }));
}
function main(context) {
    context.registerGame({
        id: statics_1.GAME_ID,
        name: 'Kingdom Come:\tDeliverance',
        mergeMods: mod => (0, util_1.transformId)(mod.id),
        queryPath: findGame,
        queryModPath: modsPath,
        logo: 'gameart.jpg',
        executable: getExecutable,
        requiredFiles: [
            'Data/Levels/rataje/level.pak',
        ],
        setup: (discovery) => prepareForModding(context, discovery),
        requiresLauncher: requiresLauncher,
        environment: {
            SteamAPPId: STEAM_APPID,
            XboxAPPId: XBOX_APPID,
            EpicAPPId: EPIC_APPID,
        },
        details: {
            steamAppId: +STEAM_APPID,
            xboxAppId: XBOX_APPID,
            epicAppId: EPIC_APPID,
        },
    });
    context.registerMainPage('sort-none', 'Load Order', LoadOrder, {
        id: 'kcd-load-order',
        hotkey: 'E',
        group: 'per-game',
        visible: () => vortex_api_1.selectors.activeGameId(context.api.store.getState()) === statics_1.GAME_ID,
        props: () => ({
            t: context.api.translate,
        }),
    });
    context.optional.registerCollectionFeature('kcd_collection_data', (gameId, includedMods) => (0, collections_1.genCollectionsData)(context, gameId, includedMods), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Kingdom Come: Deliverance Data'), (state, gameId) => gameId === statics_1.GAME_ID, CollectionsDataView_1.default);
    context.once(() => {
        context.api.events.on('mod-enabled', (profileId, modId) => {
            const state = context.api.store.getState();
            const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', statics_1.GAME_ID], undefined);
            if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
                return;
            }
            const profile = vortex_api_1.util.getSafe(state, ['persistent', 'profiles', profileId], undefined);
            if (!!profile && (profile.gameId === statics_1.GAME_ID) && (_MODS_STATE.display.indexOf(modId) === -1)) {
                refreshModList(context, discovery.path);
            }
        });
        context.api.events.on('purge-mods', () => {
            const store = context.api.store;
            const state = store.getState();
            const profile = vortex_api_1.selectors.activeProfile(state);
            if (profile === undefined || profile.gameId !== statics_1.GAME_ID) {
                return;
            }
            const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', statics_1.GAME_ID], undefined);
            if ((discovery === undefined) || (discovery.path === undefined)) {
                (0, vortex_api_1.log)('error', 'kingdomcomedeliverance was not discovered');
                return;
            }
            const modsOrderFilePath = path_1.default.join(discovery.path, modsPath(), statics_1.MODS_ORDER_FILENAME);
            const managedMods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', statics_1.GAME_ID], {});
            const modKeys = Object.keys(managedMods);
            const modState = vortex_api_1.util.getSafe(profile, ['modState'], {});
            const enabled = modKeys.filter(mod => !!modState[mod] && modState[mod].enabled);
            const disabled = modKeys.filter(dis => !enabled.includes(dis));
            getManuallyAddedMods(disabled, enabled, modsOrderFilePath, context.api)
                .then(manuallyAdded => {
                writeOrderFile(modsOrderFilePath, manuallyAdded)
                    .then(() => setNewOrder({ context, profile }, manuallyAdded))
                    .catch(err => {
                    const allowReport = !(err instanceof vortex_api_1.util.UserCanceled)
                        && (err['code'] !== 'EPERM');
                    context.api.showErrorNotification('Failed to write to load order file', err, { allowReport });
                });
            })
                .catch(err => {
                const userCanceled = (err instanceof vortex_api_1.util.UserCanceled);
                context.api.showErrorNotification('Failed to re-instate manually added mods', err, { allowReport: !userCanceled });
            });
        });
        context.api.onAsync('did-deploy', (profileId, deployment) => {
            var _a, _b;
            const state = context.api.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if (profile === undefined || profile.gameId !== statics_1.GAME_ID) {
                if (profile === undefined) {
                    (0, vortex_api_1.log)('error', 'profile does not exist', profileId);
                }
                return Promise.resolve();
            }
            const loadOrder = (_b = (_a = state.persistent['loadOrder']) === null || _a === void 0 ? void 0 : _a[profileId]) !== null && _b !== void 0 ? _b : [];
            const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', profile.gameId], undefined);
            if ((discovery === undefined) || (discovery.path === undefined)) {
                (0, vortex_api_1.log)('error', 'kingdomcomedeliverance was not discovered');
                return Promise.resolve();
            }
            const modsFolder = path_1.default.join(discovery.path, modsPath());
            const modOrderFile = path_1.default.join(modsFolder, statics_1.MODS_ORDER_FILENAME);
            return refreshModList(context, discovery.path)
                .then(() => {
                let missing = loadOrder
                    .filter(mod => !listHasMod((0, util_1.transformId)(mod), _MODS_STATE.enabled)
                    && !listHasMod((0, util_1.transformId)(mod), _MODS_STATE.disabled)
                    && listHasMod((0, util_1.transformId)(mod), _MODS_STATE.display))
                    .map(mod => (0, util_1.transformId)(mod)) || [];
                missing = [...new Set(missing)];
                const transformed = [..._MODS_STATE.enabled, ...missing];
                const loValue = (input) => {
                    const idx = loadOrder.indexOf(input);
                    return idx !== -1 ? idx : loadOrder.length;
                };
                let sorted = transformed.length > 1
                    ? transformed.sort((lhs, rhs) => loValue(lhs) - loValue(rhs))
                    : transformed;
                setNewOrder({ context, profile }, sorted);
                return writeOrderFile(modOrderFile, transformed)
                    .catch(err => {
                    const userCanceled = (err instanceof vortex_api_1.util.UserCanceled);
                    context.api.showErrorNotification('Failed to write to load order file', err, { allowReport: !userCanceled });
                });
            });
        });
    });
    return true;
}
function mapStateToProps(state) {
    const profile = vortex_api_1.selectors.activeProfile(state);
    const profileId = (profile === null || profile === void 0 ? void 0 : profile.id) || '';
    const gameId = (profile === null || profile === void 0 ? void 0 : profile.gameId) || '';
    return {
        profile,
        modState: vortex_api_1.util.getSafe(profile, ['modState'], {}),
        mods: vortex_api_1.util.getSafe(state, ['persistent', 'mods', gameId], []),
        order: vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], []),
    };
}
function mapDispatchToProps(dispatch) {
    return {
        onSetDeploymentNecessary: (gameId, necessary) => dispatch(vortex_api_1.actions.setDeploymentNecessary(gameId, necessary)),
        onSetOrder: (profileId, ordered) => dispatch(vortex_api_1.actions.setLoadOrder(profileId, ordered)),
    };
}
const LoadOrder = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(LoadOrderBase);
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdEQUFnQztBQUNoQyw2Q0FBK0I7QUFDL0Isb0RBQXNDO0FBQ3RDLDZDQUFzQztBQUN0QyxnREFBd0I7QUFDeEIsMkNBQTJHO0FBRzNHLDJEQUFxRjtBQUNyRiw0RkFBb0U7QUFDcEUsdUNBQXlEO0FBQ3pELGlDQUFxQztBQUVyQyxNQUFNLGNBQWMsR0FBRyxRQUFRLGlCQUFPLEVBQUUsQ0FBQztBQUV6QyxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFDN0IsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLE1BQU0sVUFBVSxHQUFHLG1DQUFtQyxDQUFDO0FBQ3ZELE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQztBQUUzQixNQUFNLFdBQVcsR0FBRztJQUNsQixPQUFPLEVBQUUsRUFBRTtJQUNYLFFBQVEsRUFBRSxFQUFFO0lBQ1osT0FBTyxFQUFFLEVBQUU7Q0FDWixDQUFBO0FBRUQsU0FBUyxRQUFRO0lBQ2YsT0FBTyxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQzNFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsU0FBZSxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSzs7UUFDN0MsSUFBSSxLQUFLLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDbkIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUNuQixRQUFRLEVBQUUsTUFBTTtnQkFDaEIsT0FBTyxFQUFFO29CQUNMLEtBQUssRUFBRSxVQUFVO29CQUNqQixVQUFVLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxZ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QUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUM3RCxLQUFLLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUM7S0FDdkUsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFFBQVE7SUFDbEMsT0FBTztRQUNMLHdCQUF3QixFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzVHLFVBQVUsRUFBRSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDdkYsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFBLHFCQUFPLEVBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFOUUsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0ICogYXMgQlMgZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBEcmFnZ2FibGVMaXN0LCBGbGV4TGF5b3V0LCB0eXBlcywgbG9nLCBNYWluUGFnZSwgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBJS0NEQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy90eXBlcyc7XHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi9jb2xsZWN0aW9ucy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuaW1wb3J0IHsgR0FNRV9JRCwgTU9EU19PUkRFUl9GSUxFTkFNRSB9IGZyb20gJy4vc3RhdGljcyc7XHJcbmltcG9ydCB7IHRyYW5zZm9ybUlkIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IEkxOE5fTkFNRVNQQUNFID0gYGdhbWUtJHtHQU1FX0lEfWA7XHJcblxyXG5jb25zdCBTVEVBTV9BUFBJRCA9ICczNzk0MzAnO1xyXG5jb25zdCBFUElDX0FQUElEID0gJ0VlbCc7XHJcbmNvbnN0IFhCT1hfQVBQSUQgPSAnRGVlcFNpbHZlci5LaW5nZG9tQ29tZURlbGl2ZXJhbmNlJztcclxuY29uc3QgWEJPWEVYRUNOQU1FID0gJ0FwcCc7XHJcblxyXG5jb25zdCBfTU9EU19TVEFURSA9IHtcclxuICBlbmFibGVkOiBbXSxcclxuICBkaXNhYmxlZDogW10sXHJcbiAgZGlzcGxheTogW10sXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbU1RFQU1fQVBQSUQsIFhCT1hfQVBQSUQsIEVQSUNfQVBQSURdKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVxdWlyZXNMYXVuY2hlcihnYW1lUGF0aCwgc3RvcmUpIHtcclxuICBpZiAoc3RvcmUgPT09ICd4Ym94Jykge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgIGxhdW5jaGVyOiAneGJveCcsXHJcbiAgICAgICAgICBhZGRJbmZvOiB7XHJcbiAgICAgICAgICAgICAgYXBwSWQ6IFhCT1hfQVBQSUQsXHJcbiAgICAgICAgICAgICAgcGFyYW1ldGVyczogW3sgYXBwRXhlY05hbWU6IFhCT1hFWEVDTkFNRSB9XSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gIH1cclxuIGlmIChzdG9yZSA9PT0gJ2VwaWMnKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICBsYXVuY2hlcjogJ2VwaWMnLFxyXG4gICAgICAgIGFkZEluZm86IHtcclxuICAgICAgICAgICAgYXBwSWQ6IEVQSUNfQVBQSUQsXHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH1cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEV4ZWN1dGFibGUoZGlzY292ZXJlZFBhdGgpIHtcclxuICBjb25zdCBzdGVhbVBhdGggPSBwYXRoLmpvaW4oJ0JpbicsICdXaW42NCcsICdLaW5nZG9tQ29tZS5leGUnKTtcclxuICBjb25zdCBlcGljUGF0aCA9IHBhdGguam9pbignQmluJywgJ1dpbjY0TWFzdGVyTWFzdGVyRXBpY1BHTycsICdLaW5nZG9tQ29tZS5leGUnKTtcclxuICBjb25zdCB4Ym94UGF0aCA9IHBhdGguam9pbignZ2FtZWxhdW5jaGhlbHBlci5leGUnKTtcclxuICBjb25zdCBpc0NvcnJlY3RFeGVjID0gKGV4ZWMpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGZzLnN0YXRTeW5jKHBhdGguam9pbihkaXNjb3ZlcmVkUGF0aCwgZXhlYykpO1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgaWYgKGlzQ29ycmVjdEV4ZWMoZXBpY1BhdGgpKSB7XHJcbiAgICByZXR1cm4gZXBpY1BhdGg7XHJcbiAgfTtcclxuICBpZiAoaXNDb3JyZWN0RXhlYyh4Ym94UGF0aCkpIHtcclxuICAgIHJldHVybiB4Ym94UGF0aDtcclxuICB9O1xyXG4gIGlmIChpc0NvcnJlY3RFeGVjKHN0ZWFtUGF0aCkpIHtcclxuICAgIHJldHVybiBzdGVhbVBhdGg7XHJcbiAgfTtcclxuICByZXR1cm4gc3RlYW1QYXRoO1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkpXHJcbiAgICAudGhlbigoKSA9PiBnZXRDdXJyZW50T3JkZXIocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBtb2RzUGF0aCgpLCBNT0RTX09SREVSX0ZJTEVOQU1FKSkpXHJcbiAgICAuY2F0Y2goZXJyID0+IGVyci5jb2RlID09PSAnRU5PRU5UJyA/IFByb21pc2UucmVzb2x2ZShbXSkgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gICAgLnRoZW4oZGF0YSA9PiBzZXROZXdPcmRlcih7IGNvbnRleHQsIHByb2ZpbGUgfSxcclxuICAgICAgQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBkYXRhLnNwbGl0KCdcXG4nKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRDdXJyZW50T3JkZXIobW9kT3JkZXJGaWxlcGF0aCkge1xyXG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKG1vZE9yZGVyRmlsZXBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gd2Fsa0FzeW5jKGRpcikge1xyXG4gIGxldCBlbnRyaWVzID0gW107XHJcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhkaXIpLnRoZW4oZmlsZXMgPT4ge1xyXG4gICAgcmV0dXJuIEJsdWViaXJkLmVhY2goZmlsZXMsIGZpbGUgPT4ge1xyXG4gICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXIsIGZpbGUpO1xyXG4gICAgICByZXR1cm4gZnMuc3RhdEFzeW5jKGZ1bGxQYXRoKS50aGVuKHN0YXRzID0+IHtcclxuICAgICAgICBpZiAoc3RhdHMuaXNEaXJlY3RvcnkoKSkge1xyXG4gICAgICAgICAgcmV0dXJuIHdhbGtBc3luYyhmdWxsUGF0aClcclxuICAgICAgICAgICAgLnRoZW4obmVzdGVkRmlsZXMgPT4ge1xyXG4gICAgICAgICAgICAgIGVudHJpZXMgPSBlbnRyaWVzLmNvbmNhdChuZXN0ZWRGaWxlcyk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBlbnRyaWVzLnB1c2goZnVsbFBhdGgpO1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9KVxyXG4gIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShlbnRyaWVzKSlcclxuICAuY2F0Y2goZXJyID0+IHtcclxuICAgIGxvZygnZXJyb3InLCAnVW5hYmxlIHRvIHJlYWQgbW9kIGRpcmVjdG9yeScsIGVycik7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXMpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gcmVhZE1vZHNGb2xkZXIobW9kc0ZvbGRlciwgYXBpKSB7XHJcbiAgY29uc3QgZXh0TCA9IGlucHV0ID0+IHBhdGguZXh0bmFtZShpbnB1dCkudG9Mb3dlckNhc2UoKTtcclxuICBjb25zdCBpc1ZhbGlkTW9kID0gbW9kRmlsZSA9PiBbJy5wYWsnLCAnLmNmZycsICcubWFuaWZlc3QnXS5pbmRleE9mKGV4dEwobW9kRmlsZSkpICE9PSAtMTtcclxuXHJcbiAgLy8gUmVhZHMgdGhlIHByb3ZpZGVkIGZvbGRlclBhdGggYW5kIGF0dGVtcHRzIHRvIGlkZW50aWZ5IGFsbFxyXG4gIC8vICBjdXJyZW50bHkgZGVwbG95ZWQgbW9kcy5cclxuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKG1vZHNGb2xkZXIpXHJcbiAgICAudGhlbihlbnRyaWVzID0+IEJsdWViaXJkLnJlZHVjZShlbnRyaWVzLCAoYWNjdW0sIGN1cnJlbnQpID0+IHtcclxuICAgICAgY29uc3QgY3VycmVudFBhdGggPSBwYXRoLmpvaW4obW9kc0ZvbGRlciwgY3VycmVudCk7XHJcbiAgICAgIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoY3VycmVudFBhdGgpXHJcbiAgICAgICAgLnRoZW4obW9kRmlsZXMgPT4ge1xyXG4gICAgICAgICAgaWYgKG1vZEZpbGVzLnNvbWUoaXNWYWxpZE1vZCkgPT09IHRydWUpIHtcclxuICAgICAgICAgICAgYWNjdW0ucHVzaChjdXJyZW50KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYWNjdW0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUoYWNjdW0pKVxyXG4gICAgfSwgW10pKVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gWydFTk9FTlQnLCAnRVBFUk0nLCAnRUFDQ0VTUyddLmluZGV4T2YoZXJyLmNvZGUpID09PSAtMTtcclxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignZmFpbGVkIHRvIHJlYWQga2luZ2RvbSBjb21lIG1vZHMgZGlyZWN0b3J5JyxcclxuICAgICAgICBlcnIubWVzc2FnZSwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gbGlzdEhhc01vZChtb2RJZCwgbGlzdCkge1xyXG4gIHJldHVybiAoISFsaXN0KVxyXG4gICAgPyBsaXN0Lm1hcChtb2QgPT5cclxuICAgICAgICB0cmFuc2Zvcm1JZChtb2QpLnRvTG93ZXJDYXNlKCkpLmluY2x1ZGVzKG1vZElkLnRvTG93ZXJDYXNlKCkpXHJcbiAgICA6IGZhbHNlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRNYW51YWxseUFkZGVkTW9kcyhkaXNhYmxlZE1vZHMsIGVuYWJsZWRNb2RzLCBtb2RPcmRlckZpbGVwYXRoLCBhcGkpIHtcclxuICBjb25zdCBtb2RzUGF0aCA9IHBhdGguZGlybmFtZShtb2RPcmRlckZpbGVwYXRoKTtcclxuXHJcbiAgcmV0dXJuIHJlYWRNb2RzRm9sZGVyKG1vZHNQYXRoLCBhcGkpLnRoZW4oZGVwbG95ZWRNb2RzID0+XHJcbiAgICBnZXRDdXJyZW50T3JkZXIobW9kT3JkZXJGaWxlcGF0aClcclxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSA/IFByb21pc2UucmVzb2x2ZSgnJykgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gICAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgICAvLyAxLiBDb25maXJtZWQgdG8gZXhpc3QgKGRlcGxveWVkKSBpbnNpZGUgdGhlIG1vZHMgZGlyZWN0b3J5LlxyXG4gICAgICAgIC8vIDIuIElzIG5vdCBwYXJ0IG9mIGFueSBvZiB0aGUgbW9kIGxpc3RzIHdoaWNoIFZvcnRleCBtYW5hZ2VzLlxyXG4gICAgICAgIGNvbnN0IG1hbnVhbGx5QWRkZWQgPSBkYXRhLnNwbGl0KCdcXG4nKS5maWx0ZXIoZW50cnkgPT5cclxuICAgICAgICAgICAgIWxpc3RIYXNNb2QoZW50cnksIGVuYWJsZWRNb2RzKVxyXG4gICAgICAgICAgJiYgIWxpc3RIYXNNb2QoZW50cnksIGRpc2FibGVkTW9kcylcclxuICAgICAgICAgICYmIGxpc3RIYXNNb2QoZW50cnksIGRlcGxveWVkTW9kcykpO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1hbnVhbGx5QWRkZWQpO1xyXG4gICAgICB9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlZnJlc2hNb2RMaXN0KGNvbnRleHQsIGRpc2NvdmVyeVBhdGgpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBpbnN0YWxsYXRpb25QYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwgW10pO1xyXG4gIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtb2RzKTtcclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcclxuICBjb25zdCBlbmFibGVkID0gbW9kS2V5cy5maWx0ZXIobW9kID0+ICEhbW9kU3RhdGVbbW9kXSAmJiBtb2RTdGF0ZVttb2RdLmVuYWJsZWQpO1xyXG4gIGNvbnN0IGRpc2FibGVkID0gbW9kS2V5cy5maWx0ZXIoZGlzID0+ICFlbmFibGVkLmluY2x1ZGVzKGRpcykpO1xyXG5cclxuICBjb25zdCBleHRMID0gaW5wdXQgPT4gcGF0aC5leHRuYW1lKGlucHV0KS50b0xvd2VyQ2FzZSgpO1xyXG4gIHJldHVybiBCbHVlYmlyZC5yZWR1Y2UoZW5hYmxlZCwgKGFjY3VtLCBtb2QpID0+IHtcclxuICAgIGlmIChtb2RzW21vZF0/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9XHJcbiAgICBjb25zdCBtb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxhdGlvblBhdGgsIG1vZHNbbW9kXS5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgIHJldHVybiB3YWxrQXN5bmMobW9kUGF0aClcclxuICAgICAgLnRoZW4oZW50cmllcyA9PiAoZW50cmllcy5maW5kKGZpbGVOYW1lID0+IFsnLnBhaycsICcuY2ZnJywgJy5tYW5pZmVzdCddLmluY2x1ZGVzKGV4dEwoZmlsZU5hbWUpKSkgIT09IHVuZGVmaW5lZClcclxuICAgICAgICA/IGFjY3VtLmNvbmNhdChtb2QpXHJcbiAgICAgICAgOiBhY2N1bSk7XHJcbiAgfSwgW10pLnRoZW4obWFuYWdlZE1vZHMgPT4ge1xyXG4gICAgcmV0dXJuIGdldE1hbnVhbGx5QWRkZWRNb2RzKGRpc2FibGVkLCBlbmFibGVkLCBwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgbW9kc1BhdGgoKSxcclxuICAgICAgTU9EU19PUkRFUl9GSUxFTkFNRSksIGNvbnRleHQuYXBpKVxyXG4gICAgICAudGhlbihtYW51YWxseUFkZGVkID0+IHtcclxuICAgICAgICBfTU9EU19TVEFURS5lbmFibGVkID0gW10uY29uY2F0KG1hbmFnZWRNb2RzXHJcbiAgICAgICAgICAubWFwKG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QpKSwgbWFudWFsbHlBZGRlZCk7XHJcbiAgICAgICAgX01PRFNfU1RBVEUuZGlzYWJsZWQgPSBkaXNhYmxlZDtcclxuICAgICAgICBfTU9EU19TVEFURS5kaXNwbGF5ID0gX01PRFNfU1RBVEUuZW5hYmxlZDtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0pXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIExvYWRPcmRlckJhc2UocHJvcHMpIHtcclxuICBjb25zdCBnZXRNb2QgPSAoaXRlbSkgPT4ge1xyXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHByb3BzLm1vZHMpO1xyXG4gICAgY29uc3QgZm91bmQgPSBrZXlzLmZpbmQoa2V5ID0+IHRyYW5zZm9ybUlkKGtleSkgPT09IGl0ZW0pO1xyXG4gICAgcmV0dXJuIGZvdW5kICE9PSB1bmRlZmluZWRcclxuICAgICAgPyBwcm9wcy5tb2RzW2ZvdW5kXVxyXG4gICAgICA6IHsgYXR0cmlidXRlczogeyBuYW1lOiBpdGVtIH0gfTtcclxuICB9O1xyXG5cclxuICBjbGFzcyBJdGVtUmVuZGVyZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xyXG4gICAgcmVuZGVyKCkge1xyXG4gICAgICBpZiAocHJvcHMubW9kcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5wcm9wcyBhcyBhbnkpLml0ZW07XHJcbiAgICAgIGNvbnN0IG1vZCA9IGdldE1vZChpdGVtKTtcclxuXHJcbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLkxpc3RHcm91cEl0ZW0sIHtcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd2YXIoLS1icmFuZC1iZywgYmxhY2spJyxcclxuICAgICAgICAgICAgICBib3JkZXJCb3R0b206ICcycHggc29saWQgdmFyKC0tYm9yZGVyLWNvbG9yLCB3aGl0ZSknXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge1xyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgIGZvbnRTaXplOiAnMS4xZW0nLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2ltZycsIHtcclxuICAgICAgICAgICAgc3JjOiAhIW1vZC5hdHRyaWJ1dGVzLnBpY3R1cmVVcmxcclxuICAgICAgICAgICAgICAgICAgPyBtb2QuYXR0cmlidXRlcy5waWN0dXJlVXJsXHJcbiAgICAgICAgICAgICAgICAgIDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJ21vZC1waWN0dXJlJyxcclxuICAgICAgICAgICAgd2lkdGg6Jzc1cHgnLFxyXG4gICAgICAgICAgICBoZWlnaHQ6JzQ1cHgnLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgIG1hcmdpbjogJzVweCAxMHB4IDVweCA1cHgnLFxyXG4gICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCB2YXIoLS1icmFuZC1zZWNvbmRhcnksI0Q3OEY0NiknLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSksXHJcbiAgICAgICAgICB1dGlsLnJlbmRlck1vZE5hbWUobW9kKSkpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChNYWluUGFnZSwge30sXHJcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KE1haW5QYWdlLkJvZHksIHt9LFxyXG4gICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLlBhbmVsLCB7IGlkOiAna2NkLWxvYWRvcmRlci1wYW5lbCcgfSxcclxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLlBhbmVsLkJvZHksIHt9LFxyXG4gICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LCB7IHR5cGU6ICdyb3cnIH0sXHJcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dC5GbGV4LCB7fSxcclxuICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KERyYWdnYWJsZUxpc3QsIHtcclxuICAgICAgICAgICAgICAgIGlkOiAna2NkLWxvYWRvcmRlcicsXHJcbiAgICAgICAgICAgICAgICBpdGVtVHlwZUlkOiAna2NkLWxvYWRvcmRlci1pdGVtJyxcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiBfTU9EU19TVEFURS5kaXNwbGF5LFxyXG4gICAgICAgICAgICAgICAgaXRlbVJlbmRlcmVyOiBJdGVtUmVuZGVyZXIgYXMgYW55LFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXHJcbiAgICAgICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAndmFyKC0tYm9yZGVyLXdpZHRoLCAxcHgpJyxcclxuICAgICAgICAgICAgICAgICAgYm9yZGVyU3R5bGU6ICdzb2xpZCcsXHJcbiAgICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAndmFyKC0tYm9yZGVyLWNvbG9yLCB3aGl0ZSknLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGFwcGx5OiBvcmRlcmVkID0+IHtcclxuICAgICAgICAgICAgICAgICAgLy8gV2Ugb25seSB3cml0ZSB0byB0aGUgbW9kX29yZGVyIGZpbGUgd2hlbiB3ZSBkZXBsb3kgdG8gYXZvaWQgKHVubGlrZWx5KSBzaXR1YXRpb25zXHJcbiAgICAgICAgICAgICAgICAgIC8vICB3aGVyZSBhIGZpbGUgZGVzY3JpcHRvciByZW1haW5zIG9wZW4sIGJsb2NraW5nIGZpbGUgb3BlcmF0aW9ucyB3aGVuIHRoZSB1c2VyXHJcbiAgICAgICAgICAgICAgICAgIC8vICBjaGFuZ2VzIHRoZSBsb2FkIG9yZGVyIHZlcnkgcXVpY2tseS4gVGhpcyBpcyBhbGwgdGhlb3JldGljYWwgYXQgdGhpcyBwb2ludC5cclxuICAgICAgICAgICAgICAgICAgcHJvcHMub25TZXREZXBsb3ltZW50TmVjZXNzYXJ5KEdBTUVfSUQsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gc2V0TmV3T3JkZXIocHJvcHMsIG9yZGVyZWQpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwge30sXHJcbiAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge1xyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgcGFkZGluZzogJ3ZhcigtLWhhbGYtZ3V0dGVyLCAxNXB4KScsXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2gyJywge30sXHJcbiAgICAgICAgICAgICAgICAgIHByb3BzLnQoJ0NoYW5naW5nIHlvdXIgbG9hZCBvcmRlcicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSxcclxuICAgICAgICAgICAgICAgICAgcHJvcHMudCgnRHJhZyBhbmQgZHJvcCB0aGUgbW9kcyBvbiB0aGUgbGVmdCB0byByZW9yZGVyIHRoZW0uIEtpbmdkb20gQ29tZTogRGVsaXZlcmFuY2UgdXNlcyBhIG1vZF9vcmRlci50eHQgZmlsZSAnXHJcbiAgICAgICAgICAgICAgICAgICAgICArICd0byBkZWZpbmUgdGhlIG9yZGVyIGluIHdoaWNoIG1vZHMgYXJlIGxvYWRlZCwgVm9ydGV4IHdpbGwgd3JpdGUgdGhlIGZvbGRlciBuYW1lcyBvZiB0aGUgZGlzcGxheWVkICdcclxuICAgICAgICAgICAgICAgICAgICAgICsgJ21vZHMgaW4gdGhlIG9yZGVyIHlvdSBoYXZlIHNldC4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgKyAnTW9kcyBwbGFjZWQgYXQgdGhlIGJvdHRvbSBvZiB0aGUgbG9hZCBvcmRlciB3aWxsIGhhdmUgcHJpb3JpdHkgb3ZlciB0aG9zZSBhYm92ZSB0aGVtLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LFxyXG4gICAgICAgICAgICAgICAgICBwcm9wcy50KCdOb3RlOiBWb3J0ZXggd2lsbCBkZXRlY3QgbWFudWFsbHkgYWRkZWQgbW9kcyBhcyBsb25nIGFzIHRoZXNlIGhhdmUgYmVlbiBhZGRlZCB0byB0aGUgbW9kX29yZGVyLnR4dCBmaWxlLiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgJ01hbnVhbGx5IGFkZGVkIG1vZHMgYXJlIG5vdCBtYW5hZ2VkIGJ5IFZvcnRleCAtIHRvIHJlbW92ZSB0aGVzZSwgeW91IHdpbGwgaGF2ZSB0byAnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgJ21hbnVhbGx5IGVyYXNlIHRoZSBlbnRyeSBmcm9tIHRoZSBtb2Rfb3JkZXIudHh0IGZpbGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgICAgICAgICkpXHJcbiAgICAgICAgKSkpKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1vZHNQYXRoKCkge1xyXG4gIHJldHVybiAnTW9kcyc7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldE5ld09yZGVyKHByb3BzLCBvcmRlcmVkKSB7XHJcbiAgY29uc3QgeyBjb250ZXh0LCBwcm9maWxlLCBvblNldE9yZGVyIH0gPSBwcm9wcztcclxuICBpZiAocHJvZmlsZT8uaWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gTm90IHN1cmUgaG93IHdlIGdvdCBoZXJlIHdpdGhvdXQgYSB2YWxpZCBwcm9maWxlLlxyXG4gICAgLy8gIHBvc3NpYmx5IHRoZSB1c2VyIGNoYW5nZWQgcHJvZmlsZSBkdXJpbmcgdGhlIHNldHVwL3ByZXBhcmF0aW9uXHJcbiAgICAvLyAgc3RhZ2UgPyBodHRwczovL2dpdGh1Yi5jb20vTmV4dXMtTW9kcy9Wb3J0ZXgvaXNzdWVzLzcwNTNcclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHNldCBuZXcgbG9hZCBvcmRlcicsICd1bmRlZmluZWQgcHJvZmlsZScpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgLy8gV2UgZmlsdGVyIHRoZSBvcmRlcmVkIGxpc3QganVzdCBpbiBjYXNlIHRoZXJlJ3MgYW4gZW1wdHlcclxuICAvLyAgZW50cnksIHdoaWNoIGlzIHBvc3NpYmxlIGlmIHRoZSB1c2VycyBoYWQgbWFudWFsbHkgYWRkZWRcclxuICAvLyAgZW1wdHkgbGluZXMgaW4gdGhlIGxvYWQgb3JkZXIgZmlsZS5cclxuICBjb25zdCBmaWx0ZXJlZCA9IG9yZGVyZWQuZmlsdGVyKGVudHJ5ID0+ICEhZW50cnkpO1xyXG4gIF9NT0RTX1NUQVRFLmRpc3BsYXkgPSBmaWx0ZXJlZDtcclxuXHJcbiAgcmV0dXJuICghIW9uU2V0T3JkZXIpXHJcbiAgICA/IG9uU2V0T3JkZXIocHJvZmlsZS5pZCwgZmlsdGVyZWQpXHJcbiAgICA6IGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGUuaWQsIGZpbHRlcmVkKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdyaXRlT3JkZXJGaWxlKGZpbGVQYXRoLCBtb2RMaXN0KSB7XHJcbiAgcmV0dXJuIGZzLnJlbW92ZUFzeW5jKGZpbGVQYXRoKVxyXG4gICAgLmNhdGNoKGVyciA9PiBlcnIuY29kZSA9PT0gJ0VOT0VOVCcgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpXHJcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVGaWxlQXN5bmMoZmlsZVBhdGgpKVxyXG4gICAgLnRoZW4oKCkgPT4gZnMud3JpdGVGaWxlQXN5bmMoZmlsZVBhdGgsIG1vZExpc3Quam9pbignXFxuJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdLaW5nZG9tIENvbWU6XFx0RGVsaXZlcmFuY2UnLFxyXG4gICAgbWVyZ2VNb2RzOiBtb2QgPT4gdHJhbnNmb3JtSWQobW9kLmlkKSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6IG1vZHNQYXRoLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6IGdldEV4ZWN1dGFibGUsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXHJcbiAgICAgICdEYXRhL0xldmVscy9yYXRhamUvbGV2ZWwucGFrJyxcclxuICAgIF0sXHJcbiAgICBzZXR1cDogKGRpc2NvdmVyeSkgPT4gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSxcclxuICAgIC8vcmVxdWlyZXNDbGVhbnVwOiB0cnVlLCAvLyBUaGVvcmV0aWNhbGx5IG5vdCBuZWVkZWQsIGFzIHdlIGxvb2sgZm9yIHNldmVyYWwgZmlsZSBleHRlbnNpb25zIHdoZW5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgY2hlY2tpbmcgd2hldGhlciBhIG1vZCBpcyB2YWxpZCBvciBub3QuIFRoaXMgbWF5IGNoYW5nZS5cclxuICAgIHJlcXVpcmVzTGF1bmNoZXI6IHJlcXVpcmVzTGF1bmNoZXIgYXMgYW55LFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fQVBQSUQsXHJcbiAgICAgIFhib3hBUFBJZDogWEJPWF9BUFBJRCxcclxuICAgICAgRXBpY0FQUElkOiBFUElDX0FQUElELFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0FQUElELFxyXG4gICAgICB4Ym94QXBwSWQ6IFhCT1hfQVBQSUQsXHJcbiAgICAgIGVwaWNBcHBJZDogRVBJQ19BUFBJRCxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNYWluUGFnZSgnc29ydC1ub25lJywgJ0xvYWQgT3JkZXInLCBMb2FkT3JkZXIsIHtcclxuICAgIGlkOiAna2NkLWxvYWQtb3JkZXInLFxyXG4gICAgaG90a2V5OiAnRScsXHJcbiAgICBncm91cDogJ3Blci1nYW1lJyxcclxuICAgIHZpc2libGU6ICgpID0+IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKSkgPT09IEdBTUVfSUQsXHJcbiAgICBwcm9wczogKCkgPT4gKHtcclxuICAgICAgdDogY29udGV4dC5hcGkudHJhbnNsYXRlLFxyXG4gICAgfSksXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcclxuICAgICdrY2RfY29sbGVjdGlvbl9kYXRhJyxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkgPT5cclxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzKSxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSUtDRENvbGxlY3Rpb25zRGF0YSkgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ0tpbmdkb20gQ29tZTogRGVsaXZlcmFuY2UgRGF0YScpLFxyXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxyXG4gICk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ21vZC1lbmFibGVkJywgKHByb2ZpbGVJZCwgbW9kSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGVJZF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmICghIXByb2ZpbGUgJiYgKHByb2ZpbGUuZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoX01PRFNfU1RBVEUuZGlzcGxheS5pbmRleE9mKG1vZElkKSA9PT0gLTEpKSB7XHJcbiAgICAgICAgcmVmcmVzaE1vZExpc3QoY29udGV4dCwgZGlzY292ZXJ5LnBhdGgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3B1cmdlLW1vZHMnLCAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0b3JlID0gY29udGV4dC5hcGkuc3RvcmU7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCB8fCBwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCl7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXHJcbiAgICAgICAgbG9nKCdlcnJvcicsICdraW5nZG9tY29tZWRlbGl2ZXJhbmNlIHdhcyBub3QgZGlzY292ZXJlZCcpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbW9kc09yZGVyRmlsZVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG1vZHNQYXRoKCksIE1PRFNfT1JERVJfRklMRU5BTUUpO1xyXG4gICAgICBjb25zdCBtYW5hZ2VkTW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gICAgICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobWFuYWdlZE1vZHMpO1xyXG4gICAgICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcclxuICAgICAgY29uc3QgZW5hYmxlZCA9IG1vZEtleXMuZmlsdGVyKG1vZCA9PiAhIW1vZFN0YXRlW21vZF0gJiYgbW9kU3RhdGVbbW9kXS5lbmFibGVkKTtcclxuICAgICAgY29uc3QgZGlzYWJsZWQgPSBtb2RLZXlzLmZpbHRlcihkaXMgPT4gIWVuYWJsZWQuaW5jbHVkZXMoZGlzKSk7XHJcbiAgICAgIGdldE1hbnVhbGx5QWRkZWRNb2RzKGRpc2FibGVkLCBlbmFibGVkLCBtb2RzT3JkZXJGaWxlUGF0aCwgY29udGV4dC5hcGkpXHJcbiAgICAgICAgLnRoZW4obWFudWFsbHlBZGRlZCA9PiB7XHJcbiAgICAgICAgICB3cml0ZU9yZGVyRmlsZShtb2RzT3JkZXJGaWxlUGF0aCwgbWFudWFsbHlBZGRlZClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gc2V0TmV3T3JkZXIoeyBjb250ZXh0LCBwcm9maWxlIH0sIG1hbnVhbGx5QWRkZWQpKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICEoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKGVyclsnY29kZSddICE9PSAnRVBFUk0nKTtcclxuICAgICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSB0byBsb2FkIG9yZGVyIGZpbGUnLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICBjb25zdCB1c2VyQ2FuY2VsZWQgPSAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpO1xyXG4gICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmUtaW5zdGF0ZSBtYW51YWxseSBhZGRlZCBtb2RzJywgZXJyLCB7IGFsbG93UmVwb3J0OiAhdXNlckNhbmNlbGVkIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlID09PSB1bmRlZmluZWQgfHwgcHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuXHJcbiAgICAgICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgbG9nKCdlcnJvcicsICdwcm9maWxlIGRvZXMgbm90IGV4aXN0JywgcHJvZmlsZUlkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gc3RhdGUucGVyc2lzdGVudFsnbG9hZE9yZGVyJ10/Lltwcm9maWxlSWRdID8/IFtdO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIHByb2ZpbGUuZ2FtZUlkXSwgdW5kZWZpbmVkKTtcclxuXHJcbiAgICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIC8vIHNob3VsZCBuZXZlciBoYXBwZW4gYW5kIGlmIGl0IGRvZXMgaXQgd2lsbCBjYXVzZSBlcnJvcnMgZWxzZXdoZXJlIGFzIHdlbGxcclxuICAgICAgICBsb2coJ2Vycm9yJywgJ2tpbmdkb21jb21lZGVsaXZlcmFuY2Ugd2FzIG5vdCBkaXNjb3ZlcmVkJyk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBtb2RzRm9sZGVyID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBtb2RzUGF0aCgpKTtcclxuICAgICAgY29uc3QgbW9kT3JkZXJGaWxlID0gcGF0aC5qb2luKG1vZHNGb2xkZXIsIE1PRFNfT1JERVJfRklMRU5BTUUpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlZnJlc2hNb2RMaXN0KGNvbnRleHQsIGRpc2NvdmVyeS5wYXRoKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgIGxldCBtaXNzaW5nID0gbG9hZE9yZGVyXHJcbiAgICAgICAgICAgIC5maWx0ZXIobW9kID0+ICFsaXN0SGFzTW9kKHRyYW5zZm9ybUlkKG1vZCksIF9NT0RTX1NUQVRFLmVuYWJsZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmICFsaXN0SGFzTW9kKHRyYW5zZm9ybUlkKG1vZCksIF9NT0RTX1NUQVRFLmRpc2FibGVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiBsaXN0SGFzTW9kKHRyYW5zZm9ybUlkKG1vZCksIF9NT0RTX1NUQVRFLmRpc3BsYXkpKVxyXG4gICAgICAgICAgICAubWFwKG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QpKSB8fCBbXTtcclxuXHJcbiAgICAgICAgICAvLyBUaGlzIGlzIHRoZW9yZXRpY2FsbHkgdW5lY2Vzc2FyeSAtIGJ1dCBpdCB3aWxsIGVuc3VyZSBubyBkdXBsaWNhdGVzXHJcbiAgICAgICAgICAvLyAgYXJlIGFkZGVkLlxyXG4gICAgICAgICAgbWlzc2luZyA9IFsgLi4ubmV3IFNldChtaXNzaW5nKSBdO1xyXG4gICAgICAgICAgY29uc3QgdHJhbnNmb3JtZWQgPSBbIC4uLl9NT0RTX1NUQVRFLmVuYWJsZWQsIC4uLm1pc3NpbmcgXTtcclxuICAgICAgICAgIGNvbnN0IGxvVmFsdWUgPSAoaW5wdXQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgaWR4ID0gbG9hZE9yZGVyLmluZGV4T2YoaW5wdXQpO1xyXG4gICAgICAgICAgICByZXR1cm4gaWR4ICE9PSAtMSA/IGlkeCA6IGxvYWRPcmRlci5sZW5ndGg7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gU29ydFxyXG4gICAgICAgICAgbGV0IHNvcnRlZCA9IHRyYW5zZm9ybWVkLmxlbmd0aCA+IDFcclxuICAgICAgICAgICAgPyB0cmFuc2Zvcm1lZC5zb3J0KChsaHMsIHJocykgPT4gbG9WYWx1ZShsaHMpIC0gbG9WYWx1ZShyaHMpKVxyXG4gICAgICAgICAgICA6IHRyYW5zZm9ybWVkO1xyXG5cclxuICAgICAgICAgIHNldE5ld09yZGVyKHsgY29udGV4dCwgcHJvZmlsZSB9LCBzb3J0ZWQpO1xyXG4gICAgICAgICAgcmV0dXJuIHdyaXRlT3JkZXJGaWxlKG1vZE9yZGVyRmlsZSwgdHJhbnNmb3JtZWQpXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHVzZXJDYW5jZWxlZCA9IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCk7XHJcbiAgICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgdG8gbG9hZCBvcmRlciBmaWxlJywgZXJyLCB7IGFsbG93UmVwb3J0OiAhdXNlckNhbmNlbGVkIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGUpIHtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHByb2ZpbGU/LmlkIHx8ICcnO1xyXG4gIGNvbnN0IGdhbWVJZCA9IHByb2ZpbGU/LmdhbWVJZCB8fCAnJztcclxuICByZXR1cm4ge1xyXG4gICAgcHJvZmlsZSxcclxuICAgIG1vZFN0YXRlOiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSksXHJcbiAgICBtb2RzOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgZ2FtZUlkXSwgW10pLFxyXG4gICAgb3JkZXI6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2gpIHtcclxuICByZXR1cm4ge1xyXG4gICAgb25TZXREZXBsb3ltZW50TmVjZXNzYXJ5OiAoZ2FtZUlkLCBuZWNlc3NhcnkpID0+IGRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShnYW1lSWQsIG5lY2Vzc2FyeSkpLFxyXG4gICAgb25TZXRPcmRlcjogKHByb2ZpbGVJZCwgb3JkZXJlZCkgPT4gZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZUlkLCBvcmRlcmVkKSksXHJcbiAgfTtcclxufVxyXG5cclxuY29uc3QgTG9hZE9yZGVyID0gY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoTG9hZE9yZGVyQmFzZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=