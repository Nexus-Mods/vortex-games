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
const _MODS_STATE = {
    enabled: [],
    disabled: [],
    display: [],
};
function findGame() {
    return vortex_api_1.util.steam.findByAppId(STEAM_APPID)
        .catch(() => vortex_api_1.util.epicGamesLauncher.findByAppId('Eel'))
        .then(game => game.gamePath);
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
        executable: (discoveredPath) => {
            try {
                const epicPath = path_1.default.join('Bin', 'Win64MasterMasterEpicPGO', 'KingdomCome.exe');
                vortex_api_1.fs.statSync(path_1.default.join(discoveredPath, epicPath));
                return epicPath;
            }
            catch (err) {
                return path_1.default.join('Bin', 'Win64', 'KingdomCome.exe');
            }
        },
        requiredFiles: [
            'Data/Levels/rataje/level.pak',
        ],
        setup: (discovery) => prepareForModding(context, discovery),
        requiresLauncher: () => vortex_api_1.util.epicGamesLauncher.isGameInstalled('Eel')
            .then(epic => epic
            ? { launcher: 'epic', addInfo: 'Eel' }
            : undefined),
        environment: {
            SteamAPPId: STEAM_APPID,
        },
        details: {
            steamAppId: +STEAM_APPID,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLDZDQUErQjtBQUMvQixvREFBc0M7QUFDdEMsNkNBQXNDO0FBQ3RDLGdEQUF3QjtBQUN4QiwyQ0FBMkc7QUFHM0csMkRBQXFGO0FBQ3JGLDRGQUFvRTtBQUNwRSx1Q0FBeUQ7QUFDekQsaUNBQXFDO0FBRXJDLE1BQU0sY0FBYyxHQUFHLFFBQVEsaUJBQU8sRUFBRSxDQUFDO0FBRXpDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUU3QixNQUFNLFdBQVcsR0FBRztJQUNsQixPQUFPLEVBQUUsRUFBRTtJQUNYLFFBQVEsRUFBRSxFQUFFO0lBQ1osT0FBTyxFQUFFLEVBQUU7Q0FDWixDQUFBO0FBRUQsU0FBUyxRQUFRO0lBQ2YsT0FBTyxpQkFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDO1NBQ3ZDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxpQkFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN0RCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLFNBQVM7SUFDM0MsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDM0MsTUFBTSxPQUFPLEdBQUcsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0MsT0FBTyxlQUFFLENBQUMsc0JBQXNCLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLGtCQUFR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RUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUM7S0FDdkUsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUFDLFFBQVE7SUFDbEMsT0FBTztRQUNMLHdCQUF3QixFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzVHLFVBQVUsRUFBRSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDdkYsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFBLHFCQUFPLEVBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFOUUsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgKiBhcyBCUyBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIERyYWdnYWJsZUxpc3QsIEZsZXhMYXlvdXQsIHR5cGVzLCBsb2csIE1haW5QYWdlLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgSUtDRENvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi9jb2xsZWN0aW9ucy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcbmltcG9ydCB7IEdBTUVfSUQsIE1PRFNfT1JERVJfRklMRU5BTUUgfSBmcm9tICcuL3N0YXRpY3MnO1xuaW1wb3J0IHsgdHJhbnNmb3JtSWQgfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBJMThOX05BTUVTUEFDRSA9IGBnYW1lLSR7R0FNRV9JRH1gO1xuXG5jb25zdCBTVEVBTV9BUFBJRCA9ICczNzk0MzAnO1xuXG5jb25zdCBfTU9EU19TVEFURSA9IHtcbiAgZW5hYmxlZDogW10sXG4gIGRpc2FibGVkOiBbXSxcbiAgZGlzcGxheTogW10sXG59XG5cbmZ1bmN0aW9uIGZpbmRHYW1lKCkge1xuICByZXR1cm4gdXRpbC5zdGVhbS5maW5kQnlBcHBJZChTVEVBTV9BUFBJRClcbiAgICAuY2F0Y2goKCkgPT4gdXRpbC5lcGljR2FtZXNMYXVuY2hlci5maW5kQnlBcHBJZCgnRWVsJykpXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcbn1cblxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkpXG4gICAgLnRoZW4oKCkgPT4gZ2V0Q3VycmVudE9yZGVyKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSwgTU9EU19PUkRFUl9GSUxFTkFNRSkpKVxuICAgIC5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFTk9FTlQnID8gUHJvbWlzZS5yZXNvbHZlKFtdKSA6IFByb21pc2UucmVqZWN0KGVycikpXG4gICAgLnRoZW4oZGF0YSA9PiBzZXROZXdPcmRlcih7IGNvbnRleHQsIHByb2ZpbGUgfSxcbiAgICAgIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogZGF0YS5zcGxpdCgnXFxuJykpKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3VycmVudE9yZGVyKG1vZE9yZGVyRmlsZXBhdGgpIHtcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMobW9kT3JkZXJGaWxlcGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xufVxuXG5mdW5jdGlvbiB3YWxrQXN5bmMoZGlyKSB7XG4gIGxldCBlbnRyaWVzID0gW107XG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoZGlyKS50aGVuKGZpbGVzID0+IHtcbiAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChmaWxlcywgZmlsZSA9PiB7XG4gICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXIsIGZpbGUpO1xuICAgICAgcmV0dXJuIGZzLnN0YXRBc3luYyhmdWxsUGF0aCkudGhlbihzdGF0cyA9PiB7XG4gICAgICAgIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgcmV0dXJuIHdhbGtBc3luYyhmdWxsUGF0aClcbiAgICAgICAgICAgIC50aGVuKG5lc3RlZEZpbGVzID0+IHtcbiAgICAgICAgICAgICAgZW50cmllcyA9IGVudHJpZXMuY29uY2F0KG5lc3RlZEZpbGVzKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnRyaWVzLnB1c2goZnVsbFBhdGgpO1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pXG4gIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShlbnRyaWVzKSlcbiAgLmNhdGNoKGVyciA9PiB7XG4gICAgbG9nKCdlcnJvcicsICdVbmFibGUgdG8gcmVhZCBtb2QgZGlyZWN0b3J5JywgZXJyKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXMpO1xuICB9KTtcbn1cblxuXG5mdW5jdGlvbiByZWFkTW9kc0ZvbGRlcihtb2RzRm9sZGVyLCBhcGkpIHtcbiAgY29uc3QgZXh0TCA9IGlucHV0ID0+IHBhdGguZXh0bmFtZShpbnB1dCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgaXNWYWxpZE1vZCA9IG1vZEZpbGUgPT4gWycucGFrJywgJy5jZmcnLCAnLm1hbmlmZXN0J10uaW5kZXhPZihleHRMKG1vZEZpbGUpKSAhPT0gLTE7XG5cbiAgLy8gUmVhZHMgdGhlIHByb3ZpZGVkIGZvbGRlclBhdGggYW5kIGF0dGVtcHRzIHRvIGlkZW50aWZ5IGFsbFxuICAvLyAgY3VycmVudGx5IGRlcGxveWVkIG1vZHMuXG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMobW9kc0ZvbGRlcilcbiAgICAudGhlbihlbnRyaWVzID0+IEJsdWViaXJkLnJlZHVjZShlbnRyaWVzLCAoYWNjdW0sIGN1cnJlbnQpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRQYXRoID0gcGF0aC5qb2luKG1vZHNGb2xkZXIsIGN1cnJlbnQpO1xuICAgICAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhjdXJyZW50UGF0aClcbiAgICAgICAgLnRoZW4obW9kRmlsZXMgPT4ge1xuICAgICAgICAgIGlmIChtb2RGaWxlcy5zb21lKGlzVmFsaWRNb2QpID09PSB0cnVlKSB7XG4gICAgICAgICAgICBhY2N1bS5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUoYWNjdW0pKVxuICAgIH0sIFtdKSlcbiAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gWydFTk9FTlQnLCAnRVBFUk0nLCAnRUFDQ0VTUyddLmluZGV4T2YoZXJyLmNvZGUpID09PSAtMTtcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ2ZhaWxlZCB0byByZWFkIGtpbmdkb20gY29tZSBtb2RzIGRpcmVjdG9yeScsXG4gICAgICAgIGVyci5tZXNzYWdlLCB7IGFsbG93UmVwb3J0IH0pO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGxpc3RIYXNNb2QobW9kSWQsIGxpc3QpIHtcbiAgcmV0dXJuICghIWxpc3QpXG4gICAgPyBsaXN0Lm1hcChtb2QgPT5cbiAgICAgICAgdHJhbnNmb3JtSWQobW9kKS50b0xvd2VyQ2FzZSgpKS5pbmNsdWRlcyhtb2RJZC50b0xvd2VyQ2FzZSgpKVxuICAgIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGdldE1hbnVhbGx5QWRkZWRNb2RzKGRpc2FibGVkTW9kcywgZW5hYmxlZE1vZHMsIG1vZE9yZGVyRmlsZXBhdGgsIGFwaSkge1xuICBjb25zdCBtb2RzUGF0aCA9IHBhdGguZGlybmFtZShtb2RPcmRlckZpbGVwYXRoKTtcblxuICByZXR1cm4gcmVhZE1vZHNGb2xkZXIobW9kc1BhdGgsIGFwaSkudGhlbihkZXBsb3llZE1vZHMgPT5cbiAgICBnZXRDdXJyZW50T3JkZXIobW9kT3JkZXJGaWxlcGF0aClcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJykgPyBQcm9taXNlLnJlc29sdmUoJycpIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAvLyAxLiBDb25maXJtZWQgdG8gZXhpc3QgKGRlcGxveWVkKSBpbnNpZGUgdGhlIG1vZHMgZGlyZWN0b3J5LlxuICAgICAgICAvLyAyLiBJcyBub3QgcGFydCBvZiBhbnkgb2YgdGhlIG1vZCBsaXN0cyB3aGljaCBWb3J0ZXggbWFuYWdlcy5cbiAgICAgICAgY29uc3QgbWFudWFsbHlBZGRlZCA9IGRhdGEuc3BsaXQoJ1xcbicpLmZpbHRlcihlbnRyeSA9PlxuICAgICAgICAgICAgIWxpc3RIYXNNb2QoZW50cnksIGVuYWJsZWRNb2RzKVxuICAgICAgICAgICYmICFsaXN0SGFzTW9kKGVudHJ5LCBkaXNhYmxlZE1vZHMpXG4gICAgICAgICAgJiYgbGlzdEhhc01vZChlbnRyeSwgZGVwbG95ZWRNb2RzKSk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtYW51YWxseUFkZGVkKTtcbiAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gcmVmcmVzaE1vZExpc3QoY29udGV4dCwgZGlzY292ZXJ5UGF0aCkge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGNvbnN0IGluc3RhbGxhdGlvblBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwgW10pO1xuICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobW9kcyk7XG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xuICBjb25zdCBlbmFibGVkID0gbW9kS2V5cy5maWx0ZXIobW9kID0+ICEhbW9kU3RhdGVbbW9kXSAmJiBtb2RTdGF0ZVttb2RdLmVuYWJsZWQpO1xuICBjb25zdCBkaXNhYmxlZCA9IG1vZEtleXMuZmlsdGVyKGRpcyA9PiAhZW5hYmxlZC5pbmNsdWRlcyhkaXMpKTtcblxuICBjb25zdCBleHRMID0gaW5wdXQgPT4gcGF0aC5leHRuYW1lKGlucHV0KS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKGVuYWJsZWQsIChhY2N1bSwgbW9kKSA9PiB7XG4gICAgaWYgKG1vZHNbbW9kXT8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfVxuICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kc1ttb2RdLmluc3RhbGxhdGlvblBhdGgpO1xuICAgIHJldHVybiB3YWxrQXN5bmMobW9kUGF0aClcbiAgICAgIC50aGVuKGVudHJpZXMgPT4gKGVudHJpZXMuZmluZChmaWxlTmFtZSA9PiBbJy5wYWsnLCAnLmNmZycsICcubWFuaWZlc3QnXS5pbmNsdWRlcyhleHRMKGZpbGVOYW1lKSkpICE9PSB1bmRlZmluZWQpXG4gICAgICAgID8gYWNjdW0uY29uY2F0KG1vZClcbiAgICAgICAgOiBhY2N1bSk7XG4gIH0sIFtdKS50aGVuKG1hbmFnZWRNb2RzID0+IHtcbiAgICByZXR1cm4gZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWQsIGVuYWJsZWQsIHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBtb2RzUGF0aCgpLFxuICAgICAgTU9EU19PUkRFUl9GSUxFTkFNRSksIGNvbnRleHQuYXBpKVxuICAgICAgLnRoZW4obWFudWFsbHlBZGRlZCA9PiB7XG4gICAgICAgIF9NT0RTX1NUQVRFLmVuYWJsZWQgPSBbXS5jb25jYXQobWFuYWdlZE1vZHNcbiAgICAgICAgICAubWFwKG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QpKSwgbWFudWFsbHlBZGRlZCk7XG4gICAgICAgIF9NT0RTX1NUQVRFLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgICAgIF9NT0RTX1NUQVRFLmRpc3BsYXkgPSBfTU9EU19TVEFURS5lbmFibGVkO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gTG9hZE9yZGVyQmFzZShwcm9wcykge1xuICBjb25zdCBnZXRNb2QgPSAoaXRlbSkgPT4ge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcy5tb2RzKTtcbiAgICBjb25zdCBmb3VuZCA9IGtleXMuZmluZChrZXkgPT4gdHJhbnNmb3JtSWQoa2V5KSA9PT0gaXRlbSk7XG4gICAgcmV0dXJuIGZvdW5kICE9PSB1bmRlZmluZWRcbiAgICAgID8gcHJvcHMubW9kc1tmb3VuZF1cbiAgICAgIDogeyBhdHRyaWJ1dGVzOiB7IG5hbWU6IGl0ZW0gfSB9O1xuICB9O1xuXG4gIGNsYXNzIEl0ZW1SZW5kZXJlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgcmVuZGVyKCkge1xuICAgICAgaWYgKHByb3BzLm1vZHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXRlbSA9ICh0aGlzLnByb3BzIGFzIGFueSkuaXRlbTtcbiAgICAgIGNvbnN0IG1vZCA9IGdldE1vZChpdGVtKTtcblxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuTGlzdEdyb3VwSXRlbSwge1xuICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndmFyKC0tYnJhbmQtYmcsIGJsYWNrKScsXG4gICAgICAgICAgICAgIGJvcmRlckJvdHRvbTogJzJweCBzb2xpZCB2YXIoLS1ib3JkZXItY29sb3IsIHdoaXRlKSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7XG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICBmb250U2l6ZTogJzEuMWVtJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdpbWcnLCB7XG4gICAgICAgICAgICBzcmM6ICEhbW9kLmF0dHJpYnV0ZXMucGljdHVyZVVybFxuICAgICAgICAgICAgICAgICAgPyBtb2QuYXR0cmlidXRlcy5waWN0dXJlVXJsXG4gICAgICAgICAgICAgICAgICA6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnbW9kLXBpY3R1cmUnLFxuICAgICAgICAgICAgd2lkdGg6Jzc1cHgnLFxuICAgICAgICAgICAgaGVpZ2h0Oic0NXB4JyxcbiAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgIG1hcmdpbjogJzVweCAxMHB4IDVweCA1cHgnLFxuICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdmFyKC0tYnJhbmQtc2Vjb25kYXJ5LCNENzhGNDYpJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCkpKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1haW5QYWdlLCB7fSxcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KE1haW5QYWdlLkJvZHksIHt9LFxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbCwgeyBpZDogJ2tjZC1sb2Fkb3JkZXItcGFuZWwnIH0sXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwuQm9keSwge30sXG4gICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LCB7IHR5cGU6ICdyb3cnIH0sXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwge30sXG4gICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRHJhZ2dhYmxlTGlzdCwge1xuICAgICAgICAgICAgICAgIGlkOiAna2NkLWxvYWRvcmRlcicsXG4gICAgICAgICAgICAgICAgaXRlbVR5cGVJZDogJ2tjZC1sb2Fkb3JkZXItaXRlbScsXG4gICAgICAgICAgICAgICAgaXRlbXM6IF9NT0RTX1NUQVRFLmRpc3BsYXksXG4gICAgICAgICAgICAgICAgaXRlbVJlbmRlcmVyOiBJdGVtUmVuZGVyZXIgYXMgYW55LFxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICBib3JkZXJXaWR0aDogJ3ZhcigtLWJvcmRlci13aWR0aCwgMXB4KScsXG4gICAgICAgICAgICAgICAgICBib3JkZXJTdHlsZTogJ3NvbGlkJyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAndmFyKC0tYm9yZGVyLWNvbG9yLCB3aGl0ZSknLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXBwbHk6IG9yZGVyZWQgPT4ge1xuICAgICAgICAgICAgICAgICAgLy8gV2Ugb25seSB3cml0ZSB0byB0aGUgbW9kX29yZGVyIGZpbGUgd2hlbiB3ZSBkZXBsb3kgdG8gYXZvaWQgKHVubGlrZWx5KSBzaXR1YXRpb25zXG4gICAgICAgICAgICAgICAgICAvLyAgd2hlcmUgYSBmaWxlIGRlc2NyaXB0b3IgcmVtYWlucyBvcGVuLCBibG9ja2luZyBmaWxlIG9wZXJhdGlvbnMgd2hlbiB0aGUgdXNlclxuICAgICAgICAgICAgICAgICAgLy8gIGNoYW5nZXMgdGhlIGxvYWQgb3JkZXIgdmVyeSBxdWlja2x5LiBUaGlzIGlzIGFsbCB0aGVvcmV0aWNhbCBhdCB0aGlzIHBvaW50LlxuICAgICAgICAgICAgICAgICAgcHJvcHMub25TZXREZXBsb3ltZW50TmVjZXNzYXJ5KEdBTUVfSUQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldE5ld09yZGVyKHByb3BzLCBvcmRlcmVkKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dC5GbGV4LCB7fSxcbiAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge1xuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICBwYWRkaW5nOiAndmFyKC0taGFsZi1ndXR0ZXIsIDE1cHgpJyxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSxcbiAgICAgICAgICAgICAgICAgIHByb3BzLnQoJ0NoYW5naW5nIHlvdXIgbG9hZCBvcmRlcicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sXG4gICAgICAgICAgICAgICAgICBwcm9wcy50KCdEcmFnIGFuZCBkcm9wIHRoZSBtb2RzIG9uIHRoZSBsZWZ0IHRvIHJlb3JkZXIgdGhlbS4gS2luZ2RvbSBDb21lOiBEZWxpdmVyYW5jZSB1c2VzIGEgbW9kX29yZGVyLnR4dCBmaWxlICdcbiAgICAgICAgICAgICAgICAgICAgICArICd0byBkZWZpbmUgdGhlIG9yZGVyIGluIHdoaWNoIG1vZHMgYXJlIGxvYWRlZCwgVm9ydGV4IHdpbGwgd3JpdGUgdGhlIGZvbGRlciBuYW1lcyBvZiB0aGUgZGlzcGxheWVkICdcbiAgICAgICAgICAgICAgICAgICAgICArICdtb2RzIGluIHRoZSBvcmRlciB5b3UgaGF2ZSBzZXQuICdcbiAgICAgICAgICAgICAgICAgICAgICArICdNb2RzIHBsYWNlZCBhdCB0aGUgYm90dG9tIG9mIHRoZSBsb2FkIG9yZGVyIHdpbGwgaGF2ZSBwcmlvcml0eSBvdmVyIHRob3NlIGFib3ZlIHRoZW0uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxuICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LFxuICAgICAgICAgICAgICAgICAgcHJvcHMudCgnTm90ZTogVm9ydGV4IHdpbGwgZGV0ZWN0IG1hbnVhbGx5IGFkZGVkIG1vZHMgYXMgbG9uZyBhcyB0aGVzZSBoYXZlIGJlZW4gYWRkZWQgdG8gdGhlIG1vZF9vcmRlci50eHQgZmlsZS4gJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKyAnTWFudWFsbHkgYWRkZWQgbW9kcyBhcmUgbm90IG1hbmFnZWQgYnkgVm9ydGV4IC0gdG8gcmVtb3ZlIHRoZXNlLCB5b3Ugd2lsbCBoYXZlIHRvICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsgJ21hbnVhbGx5IGVyYXNlIHRoZSBlbnRyeSBmcm9tIHRoZSBtb2Rfb3JkZXIudHh0IGZpbGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxuICAgICAgICAgICAgICApKVxuICAgICAgICApKSkpKTtcbn1cblxuZnVuY3Rpb24gbW9kc1BhdGgoKSB7XG4gIHJldHVybiAnTW9kcyc7XG59XG5cbmZ1bmN0aW9uIHNldE5ld09yZGVyKHByb3BzLCBvcmRlcmVkKSB7XG4gIGNvbnN0IHsgY29udGV4dCwgcHJvZmlsZSwgb25TZXRPcmRlciB9ID0gcHJvcHM7XG4gIGlmIChwcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gTm90IHN1cmUgaG93IHdlIGdvdCBoZXJlIHdpdGhvdXQgYSB2YWxpZCBwcm9maWxlLlxuICAgIC8vICBwb3NzaWJseSB0aGUgdXNlciBjaGFuZ2VkIHByb2ZpbGUgZHVyaW5nIHRoZSBzZXR1cC9wcmVwYXJhdGlvblxuICAgIC8vICBzdGFnZSA/IGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvNzA1M1xuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHNldCBuZXcgbG9hZCBvcmRlcicsICd1bmRlZmluZWQgcHJvZmlsZScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFdlIGZpbHRlciB0aGUgb3JkZXJlZCBsaXN0IGp1c3QgaW4gY2FzZSB0aGVyZSdzIGFuIGVtcHR5XG4gIC8vICBlbnRyeSwgd2hpY2ggaXMgcG9zc2libGUgaWYgdGhlIHVzZXJzIGhhZCBtYW51YWxseSBhZGRlZFxuICAvLyAgZW1wdHkgbGluZXMgaW4gdGhlIGxvYWQgb3JkZXIgZmlsZS5cbiAgY29uc3QgZmlsdGVyZWQgPSBvcmRlcmVkLmZpbHRlcihlbnRyeSA9PiAhIWVudHJ5KTtcbiAgX01PRFNfU1RBVEUuZGlzcGxheSA9IGZpbHRlcmVkO1xuXG4gIHJldHVybiAoISFvblNldE9yZGVyKVxuICAgID8gb25TZXRPcmRlcihwcm9maWxlLmlkLCBmaWx0ZXJlZClcbiAgICA6IGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGUuaWQsIGZpbHRlcmVkKSk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlT3JkZXJGaWxlKGZpbGVQYXRoLCBtb2RMaXN0KSB7XG4gIHJldHVybiBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcbiAgICAuY2F0Y2goZXJyID0+IGVyci5jb2RlID09PSAnRU5PRU5UJyA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVGaWxlQXN5bmMoZmlsZVBhdGgpKVxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCBtb2RMaXN0LmpvaW4oJ1xcbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpO1xufVxuXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnS2luZ2RvbSBDb21lOlxcdERlbGl2ZXJhbmNlJyxcbiAgICBtZXJnZU1vZHM6IG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QuaWQpLFxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6IChkaXNjb3ZlcmVkUGF0aCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZXBpY1BhdGggPSBwYXRoLmpvaW4oJ0JpbicsICdXaW42NE1hc3Rlck1hc3RlckVwaWNQR08nLCAnS2luZ2RvbUNvbWUuZXhlJylcbiAgICAgICAgZnMuc3RhdFN5bmMocGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCBlcGljUGF0aCkpO1xuICAgICAgICByZXR1cm4gZXBpY1BhdGg7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguam9pbignQmluJywgJ1dpbjY0JywgJ0tpbmdkb21Db21lLmV4ZScpO1xuICAgICAgfVxuICAgIH0sXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ0RhdGEvTGV2ZWxzL3JhdGFqZS9sZXZlbC5wYWsnLFxuICAgIF0sXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSksXG4gICAgLy9yZXF1aXJlc0NsZWFudXA6IHRydWUsIC8vIFRoZW9yZXRpY2FsbHkgbm90IG5lZWRlZCwgYXMgd2UgbG9vayBmb3Igc2V2ZXJhbCBmaWxlIGV4dGVuc2lvbnMgd2hlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgY2hlY2tpbmcgd2hldGhlciBhIG1vZCBpcyB2YWxpZCBvciBub3QuIFRoaXMgbWF5IGNoYW5nZS5cbiAgICByZXF1aXJlc0xhdW5jaGVyOiAoKSA9PiB1dGlsLmVwaWNHYW1lc0xhdW5jaGVyLmlzR2FtZUluc3RhbGxlZCgnRWVsJylcbiAgICAgIC50aGVuKGVwaWMgPT4gZXBpY1xuICAgICAgICA/IHsgbGF1bmNoZXI6ICdlcGljJywgYWRkSW5mbzogJ0VlbCcgfVxuICAgICAgICA6IHVuZGVmaW5lZCksXG4gICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0FQUElELFxuICAgIH0sXG4gICAgZGV0YWlsczoge1xuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0FQUElELFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJNYWluUGFnZSgnc29ydC1ub25lJywgJ0xvYWQgT3JkZXInLCBMb2FkT3JkZXIsIHtcbiAgICBpZDogJ2tjZC1sb2FkLW9yZGVyJyxcbiAgICBob3RrZXk6ICdFJyxcbiAgICBncm91cDogJ3Blci1nYW1lJyxcbiAgICB2aXNpYmxlOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxuICAgIHByb3BzOiAoKSA9PiAoe1xuICAgICAgdDogY29udGV4dC5hcGkudHJhbnNsYXRlLFxuICAgIH0pLFxuICB9KTtcblxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXG4gICAgJ2tjZF9jb2xsZWN0aW9uX2RhdGEnLFxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkgPT5cbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcyksXG4gICAgKGdhbWVJZDogc3RyaW5nLCBjb2xsZWN0aW9uOiBJS0NEQ29sbGVjdGlvbnNEYXRhKSA9PlxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcbiAgICAodCkgPT4gdCgnS2luZ2RvbSBDb21lOiBEZWxpdmVyYW5jZSBEYXRhJyksXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcbiAgKTtcblxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignbW9kLWVuYWJsZWQnLCAocHJvZmlsZUlkLCBtb2RJZCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgICAgIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHByb2ZpbGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGVJZF0sIHVuZGVmaW5lZCk7XG4gICAgICBpZiAoISFwcm9maWxlICYmIChwcm9maWxlLmdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKF9NT0RTX1NUQVRFLmRpc3BsYXkuaW5kZXhPZihtb2RJZCkgPT09IC0xKSkge1xuICAgICAgICByZWZyZXNoTW9kTGlzdChjb250ZXh0LCBkaXNjb3ZlcnkucGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3B1cmdlLW1vZHMnLCAoKSA9PiB7XG4gICAgICBjb25zdCBzdG9yZSA9IGNvbnRleHQuYXBpLnN0b3JlO1xuICAgICAgY29uc3Qgc3RhdGUgPSBzdG9yZS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgICAgIGlmIChwcm9maWxlID09PSB1bmRlZmluZWQgfHwgcHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpe1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gICAgICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlbiBhbmQgaWYgaXQgZG9lcyBpdCB3aWxsIGNhdXNlIGVycm9ycyBlbHNld2hlcmUgYXMgd2VsbFxuICAgICAgICBsb2coJ2Vycm9yJywgJ2tpbmdkb21jb21lZGVsaXZlcmFuY2Ugd2FzIG5vdCBkaXNjb3ZlcmVkJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbW9kc09yZGVyRmlsZVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG1vZHNQYXRoKCksIE1PRFNfT1JERVJfRklMRU5BTUUpO1xuICAgICAgY29uc3QgbWFuYWdlZE1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgICAgIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtYW5hZ2VkTW9kcyk7XG4gICAgICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcbiAgICAgIGNvbnN0IGVuYWJsZWQgPSBtb2RLZXlzLmZpbHRlcihtb2QgPT4gISFtb2RTdGF0ZVttb2RdICYmIG1vZFN0YXRlW21vZF0uZW5hYmxlZCk7XG4gICAgICBjb25zdCBkaXNhYmxlZCA9IG1vZEtleXMuZmlsdGVyKGRpcyA9PiAhZW5hYmxlZC5pbmNsdWRlcyhkaXMpKTtcbiAgICAgIGdldE1hbnVhbGx5QWRkZWRNb2RzKGRpc2FibGVkLCBlbmFibGVkLCBtb2RzT3JkZXJGaWxlUGF0aCwgY29udGV4dC5hcGkpXG4gICAgICAgIC50aGVuKG1hbnVhbGx5QWRkZWQgPT4ge1xuICAgICAgICAgIHdyaXRlT3JkZXJGaWxlKG1vZHNPcmRlckZpbGVQYXRoLCBtYW51YWxseUFkZGVkKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gc2V0TmV3T3JkZXIoeyBjb250ZXh0LCBwcm9maWxlIH0sIG1hbnVhbGx5QWRkZWQpKVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gIShlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKGVyclsnY29kZSddICE9PSAnRVBFUk0nKTtcbiAgICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgdG8gbG9hZCBvcmRlciBmaWxlJywgZXJyLCB7IGFsbG93UmVwb3J0IH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIGNvbnN0IHVzZXJDYW5jZWxlZCA9IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCk7XG4gICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmUtaW5zdGF0ZSBtYW51YWxseSBhZGRlZCBtb2RzJywgZXJyLCB7IGFsbG93UmVwb3J0OiAhdXNlckNhbmNlbGVkIH0pXG4gICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIChwcm9maWxlSWQsIGRlcGxveW1lbnQpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XG4gICAgICBpZiAocHJvZmlsZSA9PT0gdW5kZWZpbmVkIHx8IHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG5cbiAgICAgICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGxvZygnZXJyb3InLCAncHJvZmlsZSBkb2VzIG5vdCBleGlzdCcsIHByb2ZpbGVJZCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHN0YXRlLnBlcnNpc3RlbnRbJ2xvYWRPcmRlciddPy5bcHJvZmlsZUlkXSA/PyBbXTtcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgcHJvZmlsZS5nYW1lSWRdLCB1bmRlZmluZWQpO1xuXG4gICAgICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlbiBhbmQgaWYgaXQgZG9lcyBpdCB3aWxsIGNhdXNlIGVycm9ycyBlbHNld2hlcmUgYXMgd2VsbFxuICAgICAgICBsb2coJ2Vycm9yJywgJ2tpbmdkb21jb21lZGVsaXZlcmFuY2Ugd2FzIG5vdCBkaXNjb3ZlcmVkJyk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbW9kc0ZvbGRlciA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSk7XG4gICAgICBjb25zdCBtb2RPcmRlckZpbGUgPSBwYXRoLmpvaW4obW9kc0ZvbGRlciwgTU9EU19PUkRFUl9GSUxFTkFNRSk7XG5cbiAgICAgIHJldHVybiByZWZyZXNoTW9kTGlzdChjb250ZXh0LCBkaXNjb3ZlcnkucGF0aClcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGxldCBtaXNzaW5nID0gbG9hZE9yZGVyXG4gICAgICAgICAgICAuZmlsdGVyKG1vZCA9PiAhbGlzdEhhc01vZCh0cmFuc2Zvcm1JZChtb2QpLCBfTU9EU19TVEFURS5lbmFibGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgIWxpc3RIYXNNb2QodHJhbnNmb3JtSWQobW9kKSwgX01PRFNfU1RBVEUuZGlzYWJsZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiBsaXN0SGFzTW9kKHRyYW5zZm9ybUlkKG1vZCksIF9NT0RTX1NUQVRFLmRpc3BsYXkpKVxuICAgICAgICAgICAgLm1hcChtb2QgPT4gdHJhbnNmb3JtSWQobW9kKSkgfHwgW107XG5cbiAgICAgICAgICAvLyBUaGlzIGlzIHRoZW9yZXRpY2FsbHkgdW5lY2Vzc2FyeSAtIGJ1dCBpdCB3aWxsIGVuc3VyZSBubyBkdXBsaWNhdGVzXG4gICAgICAgICAgLy8gIGFyZSBhZGRlZC5cbiAgICAgICAgICBtaXNzaW5nID0gWyAuLi5uZXcgU2V0KG1pc3NpbmcpIF07XG4gICAgICAgICAgY29uc3QgdHJhbnNmb3JtZWQgPSBbIC4uLl9NT0RTX1NUQVRFLmVuYWJsZWQsIC4uLm1pc3NpbmcgXTtcbiAgICAgICAgICBjb25zdCBsb1ZhbHVlID0gKGlucHV0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpZHggPSBsb2FkT3JkZXIuaW5kZXhPZihpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaWR4ICE9PSAtMSA/IGlkeCA6IGxvYWRPcmRlci5sZW5ndGg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gU29ydFxuICAgICAgICAgIGxldCBzb3J0ZWQgPSB0cmFuc2Zvcm1lZC5sZW5ndGggPiAxXG4gICAgICAgICAgICA/IHRyYW5zZm9ybWVkLnNvcnQoKGxocywgcmhzKSA9PiBsb1ZhbHVlKGxocykgLSBsb1ZhbHVlKHJocykpXG4gICAgICAgICAgICA6IHRyYW5zZm9ybWVkO1xuXG4gICAgICAgICAgc2V0TmV3T3JkZXIoeyBjb250ZXh0LCBwcm9maWxlIH0sIHNvcnRlZCk7XG4gICAgICAgICAgcmV0dXJuIHdyaXRlT3JkZXJGaWxlKG1vZE9yZGVyRmlsZSwgdHJhbnNmb3JtZWQpXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcbiAgICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgdG8gbG9hZCBvcmRlciBmaWxlJywgZXJyLCB7IGFsbG93UmVwb3J0OiAhdXNlckNhbmNlbGVkIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGUpIHtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gcHJvZmlsZT8uaWQgfHwgJyc7XG4gIGNvbnN0IGdhbWVJZCA9IHByb2ZpbGU/LmdhbWVJZCB8fCAnJztcbiAgcmV0dXJuIHtcbiAgICBwcm9maWxlLFxuICAgIG1vZFN0YXRlOiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSksXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIGdhbWVJZF0sIFtdKSxcbiAgICBvcmRlcjogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgW10pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2gpIHtcbiAgcmV0dXJuIHtcbiAgICBvblNldERlcGxveW1lbnROZWNlc3Nhcnk6IChnYW1lSWQsIG5lY2Vzc2FyeSkgPT4gZGlzcGF0Y2goYWN0aW9ucy5zZXREZXBsb3ltZW50TmVjZXNzYXJ5KGdhbWVJZCwgbmVjZXNzYXJ5KSksXG4gICAgb25TZXRPcmRlcjogKHByb2ZpbGVJZCwgb3JkZXJlZCkgPT4gZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZUlkLCBvcmRlcmVkKSksXG4gIH07XG59XG5cbmNvbnN0IExvYWRPcmRlciA9IGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzLCBtYXBEaXNwYXRjaFRvUHJvcHMpKExvYWRPcmRlckJhc2UpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogbWFpbixcbn07XG4iXX0=