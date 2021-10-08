"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    context['registerCollectionFeature']('kcd_collection_data', (gameId, includedMods) => (0, collections_1.genCollectionsData)(context, gameId, includedMods), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Kingdom Come: Deliverance Data'), (state, gameId) => gameId === statics_1.GAME_ID, CollectionsDataView_1.default);
    context.once(() => {
        context.api.events.on('mod-enabled', (profileId, modId) => {
            const state = context.api.store.getState();
            const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', statics_1.GAME_ID], undefined);
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
                    .then(() => setNewOrder({ context, profile }, manuallyAdded));
            })
                .catch(err => {
                const userCanceled = (err instanceof vortex_api_1.util.UserCanceled);
                context.api.showErrorNotification('Failed to re-instate manually added mods', err, { allowReport: !userCanceled });
            });
        });
        context.api.onAsync('did-deploy', (profileId, deployment) => {
            const state = context.api.store.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if (profile === undefined || profile.gameId !== statics_1.GAME_ID) {
                if (profile === undefined) {
                    (0, vortex_api_1.log)('error', 'profile does not exist', profileId);
                }
                return Promise.resolve();
            }
            const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], []);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFDaEMsNkNBQStCO0FBQy9CLG9EQUFzQztBQUN0Qyw2Q0FBc0M7QUFDdEMsZ0RBQXdCO0FBQ3hCLDJDQUEyRztBQUczRywyREFBcUY7QUFDckYsNEZBQW9FO0FBQ3BFLHVDQUF5RDtBQUN6RCxpQ0FBcUM7QUFFckMsTUFBTSxjQUFjLEdBQUcsUUFBUSxpQkFBTyxFQUFFLENBQUM7QUFFekMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDO0FBRTdCLE1BQU0sV0FBVyxHQUFHO0lBQ2xCLE9BQU8sRUFBRSxFQUFFO0lBQ1gsUUFBUSxFQUFFLEVBQUU7SUFDWixPQUFPLEVBQUUsRUFBRTtDQUNaLENBQUE7QUFFRCxTQUFTLFFBQVE7SUFDZixPQUFPLGlCQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUM7U0FDdkMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLGlCQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsU0FBUztJQUMzQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQyxPQUFPLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsa0JBQVEsQ0FB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QUNKLENBQUM7QUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFBLHFCQUFPLEVBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFOUUsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0ICogYXMgQlMgZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBEcmFnZ2FibGVMaXN0LCBGbGV4TGF5b3V0LCB0eXBlcywgbG9nLCBNYWluUGFnZSwgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBJS0NEQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy90eXBlcyc7XHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi9jb2xsZWN0aW9ucy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuaW1wb3J0IHsgR0FNRV9JRCwgTU9EU19PUkRFUl9GSUxFTkFNRSB9IGZyb20gJy4vc3RhdGljcyc7XHJcbmltcG9ydCB7IHRyYW5zZm9ybUlkIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IEkxOE5fTkFNRVNQQUNFID0gYGdhbWUtJHtHQU1FX0lEfWA7XHJcblxyXG5jb25zdCBTVEVBTV9BUFBJRCA9ICczNzk0MzAnO1xyXG5cclxuY29uc3QgX01PRFNfU1RBVEUgPSB7XHJcbiAgZW5hYmxlZDogW10sXHJcbiAgZGlzYWJsZWQ6IFtdLFxyXG4gIGRpc3BsYXk6IFtdLFxyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpIHtcclxuICByZXR1cm4gdXRpbC5zdGVhbS5maW5kQnlBcHBJZChTVEVBTV9BUFBJRClcclxuICAgIC5jYXRjaCgoKSA9PiB1dGlsLmVwaWNHYW1lc0xhdW5jaGVyLmZpbmRCeUFwcElkKCdFZWwnKSlcclxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIHJldHVybiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpKVxyXG4gICAgLnRoZW4oKCkgPT4gZ2V0Q3VycmVudE9yZGVyKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSwgTU9EU19PUkRFUl9GSUxFTkFNRSkpKVxyXG4gICAgLmNhdGNoKGVyciA9PiBlcnIuY29kZSA9PT0gJ0VOT0VOVCcgPyBQcm9taXNlLnJlc29sdmUoW10pIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgIC50aGVuKGRhdGEgPT4gc2V0TmV3T3JkZXIoeyBjb250ZXh0LCBwcm9maWxlIH0sXHJcbiAgICAgIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogZGF0YS5zcGxpdCgnXFxuJykpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Q3VycmVudE9yZGVyKG1vZE9yZGVyRmlsZXBhdGgpIHtcclxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhtb2RPcmRlckZpbGVwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdhbGtBc3luYyhkaXIpIHtcclxuICBsZXQgZW50cmllcyA9IFtdO1xyXG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoZGlyKS50aGVuKGZpbGVzID0+IHtcclxuICAgIHJldHVybiBCbHVlYmlyZC5lYWNoKGZpbGVzLCBmaWxlID0+IHtcclxuICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBmaWxlKTtcclxuICAgICAgcmV0dXJuIGZzLnN0YXRBc3luYyhmdWxsUGF0aCkudGhlbihzdGF0cyA9PiB7XHJcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICAgIHJldHVybiB3YWxrQXN5bmMoZnVsbFBhdGgpXHJcbiAgICAgICAgICAgIC50aGVuKG5lc3RlZEZpbGVzID0+IHtcclxuICAgICAgICAgICAgICBlbnRyaWVzID0gZW50cmllcy5jb25jYXQobmVzdGVkRmlsZXMpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZW50cmllcy5wdXNoKGZ1bGxQYXRoKTtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSlcclxuICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZW50cmllcykpXHJcbiAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ1VuYWJsZSB0byByZWFkIG1vZCBkaXJlY3RvcnknLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShlbnRyaWVzKTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIHJlYWRNb2RzRm9sZGVyKG1vZHNGb2xkZXIsIGFwaSkge1xyXG4gIGNvbnN0IGV4dEwgPSBpbnB1dCA9PiBwYXRoLmV4dG5hbWUoaW5wdXQpLnRvTG93ZXJDYXNlKCk7XHJcbiAgY29uc3QgaXNWYWxpZE1vZCA9IG1vZEZpbGUgPT4gWycucGFrJywgJy5jZmcnLCAnLm1hbmlmZXN0J10uaW5kZXhPZihleHRMKG1vZEZpbGUpKSAhPT0gLTE7XHJcblxyXG4gIC8vIFJlYWRzIHRoZSBwcm92aWRlZCBmb2xkZXJQYXRoIGFuZCBhdHRlbXB0cyB0byBpZGVudGlmeSBhbGxcclxuICAvLyAgY3VycmVudGx5IGRlcGxveWVkIG1vZHMuXHJcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhtb2RzRm9sZGVyKVxyXG4gICAgLnRoZW4oZW50cmllcyA9PiBCbHVlYmlyZC5yZWR1Y2UoZW50cmllcywgKGFjY3VtLCBjdXJyZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRQYXRoID0gcGF0aC5qb2luKG1vZHNGb2xkZXIsIGN1cnJlbnQpO1xyXG4gICAgICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGN1cnJlbnRQYXRoKVxyXG4gICAgICAgIC50aGVuKG1vZEZpbGVzID0+IHtcclxuICAgICAgICAgIGlmIChtb2RGaWxlcy5zb21lKGlzVmFsaWRNb2QpID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2goY3VycmVudCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKSlcclxuICAgIH0sIFtdKSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBjb25zdCBhbGxvd1JlcG9ydCA9IFsnRU5PRU5UJywgJ0VQRVJNJywgJ0VBQ0NFU1MnXS5pbmRleE9mKGVyci5jb2RlKSA9PT0gLTE7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ2ZhaWxlZCB0byByZWFkIGtpbmdkb20gY29tZSBtb2RzIGRpcmVjdG9yeScsXHJcbiAgICAgICAgZXJyLm1lc3NhZ2UsIHsgYWxsb3dSZXBvcnQgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxpc3RIYXNNb2QobW9kSWQsIGxpc3QpIHtcclxuICByZXR1cm4gKCEhbGlzdClcclxuICAgID8gbGlzdC5tYXAobW9kID0+XHJcbiAgICAgICAgdHJhbnNmb3JtSWQobW9kKS50b0xvd2VyQ2FzZSgpKS5pbmNsdWRlcyhtb2RJZC50b0xvd2VyQ2FzZSgpKVxyXG4gICAgOiBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWRNb2RzLCBlbmFibGVkTW9kcywgbW9kT3JkZXJGaWxlcGF0aCwgYXBpKSB7XHJcbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmRpcm5hbWUobW9kT3JkZXJGaWxlcGF0aCk7XHJcblxyXG4gIHJldHVybiByZWFkTW9kc0ZvbGRlcihtb2RzUGF0aCwgYXBpKS50aGVuKGRlcGxveWVkTW9kcyA9PlxyXG4gICAgZ2V0Q3VycmVudE9yZGVyKG1vZE9yZGVyRmlsZXBhdGgpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJykgPyBQcm9taXNlLnJlc29sdmUoJycpIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgLy8gMS4gQ29uZmlybWVkIHRvIGV4aXN0IChkZXBsb3llZCkgaW5zaWRlIHRoZSBtb2RzIGRpcmVjdG9yeS5cclxuICAgICAgICAvLyAyLiBJcyBub3QgcGFydCBvZiBhbnkgb2YgdGhlIG1vZCBsaXN0cyB3aGljaCBWb3J0ZXggbWFuYWdlcy5cclxuICAgICAgICBjb25zdCBtYW51YWxseUFkZGVkID0gZGF0YS5zcGxpdCgnXFxuJykuZmlsdGVyKGVudHJ5ID0+XHJcbiAgICAgICAgICAgICFsaXN0SGFzTW9kKGVudHJ5LCBlbmFibGVkTW9kcylcclxuICAgICAgICAgICYmICFsaXN0SGFzTW9kKGVudHJ5LCBkaXNhYmxlZE1vZHMpXHJcbiAgICAgICAgICAmJiBsaXN0SGFzTW9kKGVudHJ5LCBkZXBsb3llZE1vZHMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtYW51YWxseUFkZGVkKTtcclxuICAgICAgfSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWZyZXNoTW9kTGlzdChjb250ZXh0LCBkaXNjb3ZlcnlQYXRoKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgaW5zdGFsbGF0aW9uUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIFtdKTtcclxuICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobW9kcyk7XHJcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgZW5hYmxlZCA9IG1vZEtleXMuZmlsdGVyKG1vZCA9PiAhIW1vZFN0YXRlW21vZF0gJiYgbW9kU3RhdGVbbW9kXS5lbmFibGVkKTtcclxuICBjb25zdCBkaXNhYmxlZCA9IG1vZEtleXMuZmlsdGVyKGRpcyA9PiAhZW5hYmxlZC5pbmNsdWRlcyhkaXMpKTtcclxuXHJcbiAgY29uc3QgZXh0TCA9IGlucHV0ID0+IHBhdGguZXh0bmFtZShpbnB1dCkudG9Mb3dlckNhc2UoKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKGVuYWJsZWQsIChhY2N1bSwgbW9kKSA9PiB7XHJcbiAgICBpZiAobW9kc1ttb2RdPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2RzW21vZF0uaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICByZXR1cm4gd2Fsa0FzeW5jKG1vZFBhdGgpXHJcbiAgICAgIC50aGVuKGVudHJpZXMgPT4gKGVudHJpZXMuZmluZChmaWxlTmFtZSA9PiBbJy5wYWsnLCAnLmNmZycsICcubWFuaWZlc3QnXS5pbmNsdWRlcyhleHRMKGZpbGVOYW1lKSkpICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgPyBhY2N1bS5jb25jYXQobW9kKVxyXG4gICAgICAgIDogYWNjdW0pO1xyXG4gIH0sIFtdKS50aGVuKG1hbmFnZWRNb2RzID0+IHtcclxuICAgIHJldHVybiBnZXRNYW51YWxseUFkZGVkTW9kcyhkaXNhYmxlZCwgZW5hYmxlZCwgcGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsIG1vZHNQYXRoKCksXHJcbiAgICAgIE1PRFNfT1JERVJfRklMRU5BTUUpLCBjb250ZXh0LmFwaSlcclxuICAgICAgLnRoZW4obWFudWFsbHlBZGRlZCA9PiB7XHJcbiAgICAgICAgX01PRFNfU1RBVEUuZW5hYmxlZCA9IFtdLmNvbmNhdChtYW5hZ2VkTW9kc1xyXG4gICAgICAgICAgLm1hcChtb2QgPT4gdHJhbnNmb3JtSWQobW9kKSksIG1hbnVhbGx5QWRkZWQpO1xyXG4gICAgICAgIF9NT0RTX1NUQVRFLmRpc2FibGVkID0gZGlzYWJsZWQ7XHJcbiAgICAgICAgX01PRFNfU1RBVEUuZGlzcGxheSA9IF9NT0RTX1NUQVRFLmVuYWJsZWQ7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9KVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBMb2FkT3JkZXJCYXNlKHByb3BzKSB7XHJcbiAgY29uc3QgZ2V0TW9kID0gKGl0ZW0pID0+IHtcclxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcy5tb2RzKTtcclxuICAgIGNvbnN0IGZvdW5kID0ga2V5cy5maW5kKGtleSA9PiB0cmFuc2Zvcm1JZChrZXkpID09PSBpdGVtKTtcclxuICAgIHJldHVybiBmb3VuZCAhPT0gdW5kZWZpbmVkXHJcbiAgICAgID8gcHJvcHMubW9kc1tmb3VuZF1cclxuICAgICAgOiB7IGF0dHJpYnV0ZXM6IHsgbmFtZTogaXRlbSB9IH07XHJcbiAgfTtcclxuXHJcbiAgY2xhc3MgSXRlbVJlbmRlcmVyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgaWYgKHByb3BzLm1vZHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBpdGVtID0gKHRoaXMucHJvcHMgYXMgYW55KS5pdGVtO1xyXG4gICAgICBjb25zdCBtb2QgPSBnZXRNb2QoaXRlbSk7XHJcblxyXG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChCUy5MaXN0R3JvdXBJdGVtLCB7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndmFyKC0tYnJhbmQtYmcsIGJsYWNrKScsXHJcbiAgICAgICAgICAgICAgYm9yZGVyQm90dG9tOiAnMnB4IHNvbGlkIHZhcigtLWJvcmRlci1jb2xvciwgd2hpdGUpJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICBmb250U2l6ZTogJzEuMWVtJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdpbWcnLCB7XHJcbiAgICAgICAgICAgIHNyYzogISFtb2QuYXR0cmlidXRlcy5waWN0dXJlVXJsXHJcbiAgICAgICAgICAgICAgICAgID8gbW9kLmF0dHJpYnV0ZXMucGljdHVyZVVybFxyXG4gICAgICAgICAgICAgICAgICA6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgICAgICAgICBjbGFzc05hbWU6ICdtb2QtcGljdHVyZScsXHJcbiAgICAgICAgICAgIHdpZHRoOic3NXB4JyxcclxuICAgICAgICAgICAgaGVpZ2h0Oic0NXB4JyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICBtYXJnaW46ICc1cHggMTBweCA1cHggNXB4JyxcclxuICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdmFyKC0tYnJhbmQtc2Vjb25kYXJ5LCNENzhGNDYpJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCkpKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTWFpblBhZ2UsIHt9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChNYWluUGFnZS5Cb2R5LCB7fSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbCwgeyBpZDogJ2tjZC1sb2Fkb3JkZXItcGFuZWwnIH0sXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbC5Cb2R5LCB7fSxcclxuICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dCwgeyB0eXBlOiAncm93JyB9LFxyXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwge30sXHJcbiAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChEcmFnZ2FibGVMaXN0LCB7XHJcbiAgICAgICAgICAgICAgICBpZDogJ2tjZC1sb2Fkb3JkZXInLFxyXG4gICAgICAgICAgICAgICAgaXRlbVR5cGVJZDogJ2tjZC1sb2Fkb3JkZXItaXRlbScsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogX01PRFNfU1RBVEUuZGlzcGxheSxcclxuICAgICAgICAgICAgICAgIGl0ZW1SZW5kZXJlcjogSXRlbVJlbmRlcmVyIGFzIGFueSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgICAgICAgICAgICBib3JkZXJXaWR0aDogJ3ZhcigtLWJvcmRlci13aWR0aCwgMXB4KScsXHJcbiAgICAgICAgICAgICAgICAgIGJvcmRlclN0eWxlOiAnc29saWQnLFxyXG4gICAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJ3ZhcigtLWJvcmRlci1jb2xvciwgd2hpdGUpJyxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhcHBseTogb3JkZXJlZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFdlIG9ubHkgd3JpdGUgdG8gdGhlIG1vZF9vcmRlciBmaWxlIHdoZW4gd2UgZGVwbG95IHRvIGF2b2lkICh1bmxpa2VseSkgc2l0dWF0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAvLyAgd2hlcmUgYSBmaWxlIGRlc2NyaXB0b3IgcmVtYWlucyBvcGVuLCBibG9ja2luZyBmaWxlIG9wZXJhdGlvbnMgd2hlbiB0aGUgdXNlclxyXG4gICAgICAgICAgICAgICAgICAvLyAgY2hhbmdlcyB0aGUgbG9hZCBvcmRlciB2ZXJ5IHF1aWNrbHkuIFRoaXMgaXMgYWxsIHRoZW9yZXRpY2FsIGF0IHRoaXMgcG9pbnQuXHJcbiAgICAgICAgICAgICAgICAgIHByb3BzLm9uU2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldE5ld09yZGVyKHByb3BzLCBvcmRlcmVkKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHt9LFxyXG4gICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICd2YXIoLS1oYWxmLWd1dHRlciwgMTVweCknLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdoMicsIHt9LFxyXG4gICAgICAgICAgICAgICAgICBwcm9wcy50KCdDaGFuZ2luZyB5b3VyIGxvYWQgb3JkZXInLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sXHJcbiAgICAgICAgICAgICAgICAgIHByb3BzLnQoJ0RyYWcgYW5kIGRyb3AgdGhlIG1vZHMgb24gdGhlIGxlZnQgdG8gcmVvcmRlciB0aGVtLiBLaW5nZG9tIENvbWU6IERlbGl2ZXJhbmNlIHVzZXMgYSBtb2Rfb3JkZXIudHh0IGZpbGUgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgKyAndG8gZGVmaW5lIHRoZSBvcmRlciBpbiB3aGljaCBtb2RzIGFyZSBsb2FkZWQsIFZvcnRleCB3aWxsIHdyaXRlIHRoZSBmb2xkZXIgbmFtZXMgb2YgdGhlIGRpc3BsYXllZCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICArICdtb2RzIGluIHRoZSBvcmRlciB5b3UgaGF2ZSBzZXQuICdcclxuICAgICAgICAgICAgICAgICAgICAgICsgJ01vZHMgcGxhY2VkIGF0IHRoZSBib3R0b20gb2YgdGhlIGxvYWQgb3JkZXIgd2lsbCBoYXZlIHByaW9yaXR5IG92ZXIgdGhvc2UgYWJvdmUgdGhlbS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSxcclxuICAgICAgICAgICAgICAgICAgcHJvcHMudCgnTm90ZTogVm9ydGV4IHdpbGwgZGV0ZWN0IG1hbnVhbGx5IGFkZGVkIG1vZHMgYXMgbG9uZyBhcyB0aGVzZSBoYXZlIGJlZW4gYWRkZWQgdG8gdGhlIG1vZF9vcmRlci50eHQgZmlsZS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICArICdNYW51YWxseSBhZGRlZCBtb2RzIGFyZSBub3QgbWFuYWdlZCBieSBWb3J0ZXggLSB0byByZW1vdmUgdGhlc2UsIHlvdSB3aWxsIGhhdmUgdG8gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICArICdtYW51YWxseSBlcmFzZSB0aGUgZW50cnkgZnJvbSB0aGUgbW9kX29yZGVyLnR4dCBmaWxlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICAgICAgICApKVxyXG4gICAgICAgICkpKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb2RzUGF0aCgpIHtcclxuICByZXR1cm4gJ01vZHMnO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXROZXdPcmRlcihwcm9wcywgb3JkZXJlZCkge1xyXG4gIGNvbnN0IHsgY29udGV4dCwgcHJvZmlsZSwgb25TZXRPcmRlciB9ID0gcHJvcHM7XHJcbiAgaWYgKHByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIE5vdCBzdXJlIGhvdyB3ZSBnb3QgaGVyZSB3aXRob3V0IGEgdmFsaWQgcHJvZmlsZS5cclxuICAgIC8vICBwb3NzaWJseSB0aGUgdXNlciBjaGFuZ2VkIHByb2ZpbGUgZHVyaW5nIHRoZSBzZXR1cC9wcmVwYXJhdGlvblxyXG4gICAgLy8gIHN0YWdlID8gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDUzXHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBzZXQgbmV3IGxvYWQgb3JkZXInLCAndW5kZWZpbmVkIHByb2ZpbGUnKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIC8vIFdlIGZpbHRlciB0aGUgb3JkZXJlZCBsaXN0IGp1c3QgaW4gY2FzZSB0aGVyZSdzIGFuIGVtcHR5XHJcbiAgLy8gIGVudHJ5LCB3aGljaCBpcyBwb3NzaWJsZSBpZiB0aGUgdXNlcnMgaGFkIG1hbnVhbGx5IGFkZGVkXHJcbiAgLy8gIGVtcHR5IGxpbmVzIGluIHRoZSBsb2FkIG9yZGVyIGZpbGUuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBvcmRlcmVkLmZpbHRlcihlbnRyeSA9PiAhIWVudHJ5KTtcclxuICBfTU9EU19TVEFURS5kaXNwbGF5ID0gZmlsdGVyZWQ7XHJcblxyXG4gIHJldHVybiAoISFvblNldE9yZGVyKVxyXG4gICAgPyBvblNldE9yZGVyKHByb2ZpbGUuaWQsIGZpbHRlcmVkKVxyXG4gICAgOiBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlLmlkLCBmaWx0ZXJlZCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZU9yZGVyRmlsZShmaWxlUGF0aCwgbW9kTGlzdCkge1xyXG4gIHJldHVybiBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcclxuICAgIC5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFTk9FTlQnID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gICAgLnRoZW4oKCkgPT4gZnMuZW5zdXJlRmlsZUFzeW5jKGZpbGVQYXRoKSlcclxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCBtb2RMaXN0LmpvaW4oJ1xcbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdLaW5nZG9tIENvbWU6XFx0RGVsaXZlcmFuY2UnLFxyXG4gICAgbWVyZ2VNb2RzOiBtb2QgPT4gdHJhbnNmb3JtSWQobW9kLmlkKSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6IG1vZHNQYXRoLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6IChkaXNjb3ZlcmVkUGF0aCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGVwaWNQYXRoID0gcGF0aC5qb2luKCdCaW4nLCAnV2luNjRNYXN0ZXJNYXN0ZXJFcGljUEdPJywgJ0tpbmdkb21Db21lLmV4ZScpXHJcbiAgICAgICAgZnMuc3RhdFN5bmMocGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCBlcGljUGF0aCkpO1xyXG4gICAgICAgIHJldHVybiBlcGljUGF0aDtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGguam9pbignQmluJywgJ1dpbjY0JywgJ0tpbmdkb21Db21lLmV4ZScpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnRGF0YS9MZXZlbHMvcmF0YWplL2xldmVsLnBhaycsXHJcbiAgICBdLFxyXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSksXHJcbiAgICAvL3JlcXVpcmVzQ2xlYW51cDogdHJ1ZSwgLy8gVGhlb3JldGljYWxseSBub3QgbmVlZGVkLCBhcyB3ZSBsb29rIGZvciBzZXZlcmFsIGZpbGUgZXh0ZW5zaW9ucyB3aGVuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gIGNoZWNraW5nIHdoZXRoZXIgYSBtb2QgaXMgdmFsaWQgb3Igbm90LiBUaGlzIG1heSBjaGFuZ2UuXHJcbiAgICByZXF1aXJlc0xhdW5jaGVyOiAoKSA9PiB1dGlsLmVwaWNHYW1lc0xhdW5jaGVyLmlzR2FtZUluc3RhbGxlZCgnRWVsJylcclxuICAgICAgLnRoZW4oZXBpYyA9PiBlcGljXHJcbiAgICAgICAgPyB7IGxhdW5jaGVyOiAnZXBpYycsIGFkZEluZm86ICdFZWwnIH1cclxuICAgICAgICA6IHVuZGVmaW5lZCksXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9BUFBJRCxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6ICtTVEVBTV9BUFBJRCxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNYWluUGFnZSgnc29ydC1ub25lJywgJ0xvYWQgT3JkZXInLCBMb2FkT3JkZXIsIHtcclxuICAgIGlkOiAna2NkLWxvYWQtb3JkZXInLFxyXG4gICAgaG90a2V5OiAnRScsXHJcbiAgICBncm91cDogJ3Blci1nYW1lJyxcclxuICAgIHZpc2libGU6ICgpID0+IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKSkgPT09IEdBTUVfSUQsXHJcbiAgICBwcm9wczogKCkgPT4gKHtcclxuICAgICAgdDogY29udGV4dC5hcGkudHJhbnNsYXRlLFxyXG4gICAgfSksXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHRbJ3JlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUnXShcclxuICAgICdrY2RfY29sbGVjdGlvbl9kYXRhJyxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkgPT5cclxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzKSxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSUtDRENvbGxlY3Rpb25zRGF0YSkgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxyXG4gICAgKHQpID0+IHQoJ0tpbmdkb20gQ29tZTogRGVsaXZlcmFuY2UgRGF0YScpLFxyXG4gICAgKHN0YXRlOiB0eXBlcy5JU3RhdGUsIGdhbWVJZDogc3RyaW5nKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxyXG4gICk7XHJcblxyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ21vZC1lbmFibGVkJywgKHByb2ZpbGVJZCwgbW9kSWQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG5cclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgcHJvZmlsZUlkXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKCEhcHJvZmlsZSAmJiAocHJvZmlsZS5nYW1lSWQgPT09IEdBTUVfSUQpICYmIChfTU9EU19TVEFURS5kaXNwbGF5LmluZGV4T2YobW9kSWQpID09PSAtMSkpIHtcclxuICAgICAgICByZWZyZXNoTW9kTGlzdChjb250ZXh0LCBkaXNjb3ZlcnkucGF0aCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbigncHVyZ2UtbW9kcycsICgpID0+IHtcclxuICAgICAgY29uc3Qgc3RvcmUgPSBjb250ZXh0LmFwaS5zdG9yZTtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBzdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gICAgICBpZiAocHJvZmlsZSA9PT0gdW5kZWZpbmVkIHx8IHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKXtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIC8vIHNob3VsZCBuZXZlciBoYXBwZW4gYW5kIGlmIGl0IGRvZXMgaXQgd2lsbCBjYXVzZSBlcnJvcnMgZWxzZXdoZXJlIGFzIHdlbGxcclxuICAgICAgICBsb2coJ2Vycm9yJywgJ2tpbmdkb21jb21lZGVsaXZlcmFuY2Ugd2FzIG5vdCBkaXNjb3ZlcmVkJyk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBtb2RzT3JkZXJGaWxlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSwgTU9EU19PUkRFUl9GSUxFTkFNRSk7XHJcbiAgICAgIGNvbnN0IG1hbmFnZWRNb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgICAgIGNvbnN0IG1vZEtleXMgPSBPYmplY3Qua2V5cyhtYW5hZ2VkTW9kcyk7XHJcbiAgICAgIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xyXG4gICAgICBjb25zdCBlbmFibGVkID0gbW9kS2V5cy5maWx0ZXIobW9kID0+ICEhbW9kU3RhdGVbbW9kXSAmJiBtb2RTdGF0ZVttb2RdLmVuYWJsZWQpO1xyXG4gICAgICBjb25zdCBkaXNhYmxlZCA9IG1vZEtleXMuZmlsdGVyKGRpcyA9PiAhZW5hYmxlZC5pbmNsdWRlcyhkaXMpKTtcclxuICAgICAgZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWQsIGVuYWJsZWQsIG1vZHNPcmRlckZpbGVQYXRoLCBjb250ZXh0LmFwaSlcclxuICAgICAgICAudGhlbihtYW51YWxseUFkZGVkID0+IHtcclxuICAgICAgICAgIHdyaXRlT3JkZXJGaWxlKG1vZHNPcmRlckZpbGVQYXRoLCBtYW51YWxseUFkZGVkKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBzZXROZXdPcmRlcih7IGNvbnRleHQsIHByb2ZpbGUgfSwgbWFudWFsbHlBZGRlZCkpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICBjb25zdCB1c2VyQ2FuY2VsZWQgPSAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpO1xyXG4gICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmUtaW5zdGF0ZSBtYW51YWxseSBhZGRlZCBtb2RzJywgZXJyLCB7IGFsbG93UmVwb3J0OiAhdXNlckNhbmNlbGVkIH0pXHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZCk7XHJcbiAgICAgIGlmIChwcm9maWxlID09PSB1bmRlZmluZWQgfHwgcHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuXHJcbiAgICAgICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgbG9nKCdlcnJvcicsICdwcm9maWxlIGRvZXMgbm90IGV4aXN0JywgcHJvZmlsZUlkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgW10pO1xyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIHByb2ZpbGUuZ2FtZUlkXSwgdW5kZWZpbmVkKTtcclxuXHJcbiAgICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgIC8vIHNob3VsZCBuZXZlciBoYXBwZW4gYW5kIGlmIGl0IGRvZXMgaXQgd2lsbCBjYXVzZSBlcnJvcnMgZWxzZXdoZXJlIGFzIHdlbGxcclxuICAgICAgICBsb2coJ2Vycm9yJywgJ2tpbmdkb21jb21lZGVsaXZlcmFuY2Ugd2FzIG5vdCBkaXNjb3ZlcmVkJyk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBtb2RzRm9sZGVyID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBtb2RzUGF0aCgpKTtcclxuICAgICAgY29uc3QgbW9kT3JkZXJGaWxlID0gcGF0aC5qb2luKG1vZHNGb2xkZXIsIE1PRFNfT1JERVJfRklMRU5BTUUpO1xyXG5cclxuICAgICAgcmV0dXJuIHJlZnJlc2hNb2RMaXN0KGNvbnRleHQsIGRpc2NvdmVyeS5wYXRoKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICAgIGxldCBtaXNzaW5nID0gbG9hZE9yZGVyXHJcbiAgICAgICAgICAgIC5maWx0ZXIobW9kID0+ICFsaXN0SGFzTW9kKHRyYW5zZm9ybUlkKG1vZCksIF9NT0RTX1NUQVRFLmVuYWJsZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmICFsaXN0SGFzTW9kKHRyYW5zZm9ybUlkKG1vZCksIF9NT0RTX1NUQVRFLmRpc2FibGVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiBsaXN0SGFzTW9kKHRyYW5zZm9ybUlkKG1vZCksIF9NT0RTX1NUQVRFLmRpc3BsYXkpKVxyXG4gICAgICAgICAgICAubWFwKG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QpKSB8fCBbXTtcclxuXHJcbiAgICAgICAgICAvLyBUaGlzIGlzIHRoZW9yZXRpY2FsbHkgdW5lY2Vzc2FyeSAtIGJ1dCBpdCB3aWxsIGVuc3VyZSBubyBkdXBsaWNhdGVzXHJcbiAgICAgICAgICAvLyAgYXJlIGFkZGVkLlxyXG4gICAgICAgICAgbWlzc2luZyA9IFsgLi4ubmV3IFNldChtaXNzaW5nKSBdO1xyXG4gICAgICAgICAgY29uc3QgdHJhbnNmb3JtZWQgPSBbIC4uLl9NT0RTX1NUQVRFLmVuYWJsZWQsIC4uLm1pc3NpbmcgXTtcclxuICAgICAgICAgIGNvbnN0IGxvVmFsdWUgPSAoaW5wdXQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgaWR4ID0gbG9hZE9yZGVyLmluZGV4T2YoaW5wdXQpO1xyXG4gICAgICAgICAgICByZXR1cm4gaWR4ICE9PSAtMSA/IGlkeCA6IGxvYWRPcmRlci5sZW5ndGg7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gU29ydFxyXG4gICAgICAgICAgbGV0IHNvcnRlZCA9IHRyYW5zZm9ybWVkLmxlbmd0aCA+IDFcclxuICAgICAgICAgICAgPyB0cmFuc2Zvcm1lZC5zb3J0KChsaHMsIHJocykgPT4gbG9WYWx1ZShsaHMpIC0gbG9WYWx1ZShyaHMpKVxyXG4gICAgICAgICAgICA6IHRyYW5zZm9ybWVkO1xyXG5cclxuICAgICAgICAgIHNldE5ld09yZGVyKHsgY29udGV4dCwgcHJvZmlsZSB9LCBzb3J0ZWQpO1xyXG4gICAgICAgICAgcmV0dXJuIHdyaXRlT3JkZXJGaWxlKG1vZE9yZGVyRmlsZSwgdHJhbnNmb3JtZWQpXHJcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHVzZXJDYW5jZWxlZCA9IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCk7XHJcbiAgICAgICAgICAgICAgY29udGV4dC5hcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gd3JpdGUgdG8gbG9hZCBvcmRlciBmaWxlJywgZXJyLCB7IGFsbG93UmVwb3J0OiAhdXNlckNhbmNlbGVkIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGUpIHtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHByb2ZpbGU/LmlkIHx8ICcnO1xyXG4gIGNvbnN0IGdhbWVJZCA9IHByb2ZpbGU/LmdhbWVJZCB8fCAnJztcclxuICByZXR1cm4ge1xyXG4gICAgcHJvZmlsZSxcclxuICAgIG1vZFN0YXRlOiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSksXHJcbiAgICBtb2RzOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgZ2FtZUlkXSwgW10pLFxyXG4gICAgb3JkZXI6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKSxcclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2gpIHtcclxuICByZXR1cm4ge1xyXG4gICAgb25TZXREZXBsb3ltZW50TmVjZXNzYXJ5OiAoZ2FtZUlkLCBuZWNlc3NhcnkpID0+IGRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShnYW1lSWQsIG5lY2Vzc2FyeSkpLFxyXG4gICAgb25TZXRPcmRlcjogKHByb2ZpbGVJZCwgb3JkZXJlZCkgPT4gZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZUlkLCBvcmRlcmVkKSksXHJcbiAgfTtcclxufVxyXG5cclxuY29uc3QgTG9hZE9yZGVyID0gY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoTG9hZE9yZGVyQmFzZSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=