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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
        vortex_api_1.log('error', 'Unable to read mod directory', err);
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
        ? list.map(mod => util_1.transformId(mod).toLowerCase()).includes(modId.toLowerCase())
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
                .map(mod => util_1.transformId(mod)), manuallyAdded);
            _MODS_STATE.disabled = disabled;
            _MODS_STATE.display = _MODS_STATE.enabled;
            return Promise.resolve();
        });
    });
}
function LoadOrderBase(props) {
    const getMod = (item) => {
        const keys = Object.keys(props.mods);
        const found = keys.find(key => util_1.transformId(key) === item);
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
        vortex_api_1.log('error', 'failed to set new load order', 'undefined profile');
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
        mergeMods: mod => util_1.transformId(mod.id),
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
    context['registerCollectionFeature']('kcd_collection_data', (gameId, includedMods) => collections_1.genCollectionsData(context, gameId, includedMods), (gameId, collection) => collections_1.parseCollectionsData(context, gameId, collection), (t) => t('Kingdom Come: Deliverance Data'), (state, gameId) => gameId === statics_1.GAME_ID, CollectionsDataView_1.default);
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
                vortex_api_1.log('error', 'kingdomcomedeliverance was not discovered');
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
                    vortex_api_1.log('error', 'profile does not exist', profileId);
                }
                return Promise.resolve();
            }
            const loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], []);
            const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', profile.gameId], undefined);
            if ((discovery === undefined) || (discovery.path === undefined)) {
                vortex_api_1.log('error', 'kingdomcomedeliverance was not discovered');
                return Promise.resolve();
            }
            const modsFolder = path_1.default.join(discovery.path, modsPath());
            const modOrderFile = path_1.default.join(modsFolder, statics_1.MODS_ORDER_FILENAME);
            return refreshModList(context, discovery.path)
                .then(() => {
                let missing = loadOrder
                    .filter(mod => !listHasMod(util_1.transformId(mod), _MODS_STATE.enabled)
                    && !listHasMod(util_1.transformId(mod), _MODS_STATE.disabled)
                    && listHasMod(util_1.transformId(mod), _MODS_STATE.display))
                    .map(mod => util_1.transformId(mod)) || [];
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
const LoadOrder = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(LoadOrderBase);
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFDaEMsNkNBQStCO0FBQy9CLG9EQUFzQztBQUN0Qyw2Q0FBc0M7QUFDdEMsZ0RBQXdCO0FBQ3hCLDJDQUEyRztBQUczRywyREFBcUY7QUFDckYsNEZBQW9FO0FBQ3BFLHVDQUF5RDtBQUN6RCxpQ0FBcUM7QUFFckMsTUFBTSxjQUFjLEdBQUcsUUFBUSxpQkFBTyxFQUFFLENBQUM7QUFFekMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDO0FBRTdCLE1BQU0sV0FBVyxHQUFHO0lBQ2xCLE9BQU8sRUFBRSxFQUFFO0lBQ1gsUUFBUSxFQUFFLEVBQUU7SUFDWixPQUFPLEVBQUUsRUFBRTtDQUNaLENBQUE7QUFFRCxTQUFTLFFBQVE7SUFDZixPQUFPLGlCQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUM7U0FDdkMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLGlCQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsU0FBUztJQUMzQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQyxPQUFPLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsa0JBQVEsQ0FB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RSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0ICogYXMgQlMgZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcclxuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBEcmFnZ2FibGVMaXN0LCBGbGV4TGF5b3V0LCB0eXBlcywgbG9nLCBNYWluUGFnZSwgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBJS0NEQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy90eXBlcyc7XHJcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zJztcclxuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi9jb2xsZWN0aW9ucy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcclxuaW1wb3J0IHsgR0FNRV9JRCwgTU9EU19PUkRFUl9GSUxFTkFNRSB9IGZyb20gJy4vc3RhdGljcyc7XHJcbmltcG9ydCB7IHRyYW5zZm9ybUlkIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IEkxOE5fTkFNRVNQQUNFID0gYGdhbWUtJHtHQU1FX0lEfWA7XHJcblxyXG5jb25zdCBTVEVBTV9BUFBJRCA9ICczNzk0MzAnO1xyXG5cclxuY29uc3QgX01PRFNfU1RBVEUgPSB7XHJcbiAgZW5hYmxlZDogW10sXHJcbiAgZGlzYWJsZWQ6IFtdLFxyXG4gIGRpc3BsYXk6IFtdLFxyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kR2FtZSgpIHtcclxuICByZXR1cm4gdXRpbC5zdGVhbS5maW5kQnlBcHBJZChTVEVBTV9BUFBJRClcclxuICAgIC5jYXRjaCgoKSA9PiB1dGlsLmVwaWNHYW1lc0xhdW5jaGVyLmZpbmRCeUFwcElkKCdFZWwnKSlcclxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIHJldHVybiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSwgKCkgPT4gQmx1ZWJpcmQucmVzb2x2ZSgpKVxyXG4gICAgLnRoZW4oKCkgPT4gZ2V0Q3VycmVudE9yZGVyKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSwgTU9EU19PUkRFUl9GSUxFTkFNRSkpKVxyXG4gICAgLmNhdGNoKGVyciA9PiBlcnIuY29kZSA9PT0gJ0VOT0VOVCcgPyBQcm9taXNlLnJlc29sdmUoW10pIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgIC50aGVuKGRhdGEgPT4gc2V0TmV3T3JkZXIoeyBjb250ZXh0LCBwcm9maWxlIH0sXHJcbiAgICAgIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogZGF0YS5zcGxpdCgnXFxuJykpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Q3VycmVudE9yZGVyKG1vZE9yZGVyRmlsZXBhdGgpIHtcclxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhtb2RPcmRlckZpbGVwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdhbGtBc3luYyhkaXIpIHtcclxuICBsZXQgZW50cmllcyA9IFtdO1xyXG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoZGlyKS50aGVuKGZpbGVzID0+IHtcclxuICAgIHJldHVybiBCbHVlYmlyZC5lYWNoKGZpbGVzLCBmaWxlID0+IHtcclxuICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBmaWxlKTtcclxuICAgICAgcmV0dXJuIGZzLnN0YXRBc3luYyhmdWxsUGF0aCkudGhlbihzdGF0cyA9PiB7XHJcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICAgIHJldHVybiB3YWxrQXN5bmMoZnVsbFBhdGgpXHJcbiAgICAgICAgICAgIC50aGVuKG5lc3RlZEZpbGVzID0+IHtcclxuICAgICAgICAgICAgICBlbnRyaWVzID0gZW50cmllcy5jb25jYXQobmVzdGVkRmlsZXMpO1xyXG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZW50cmllcy5wdXNoKGZ1bGxQYXRoKTtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfSlcclxuICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZW50cmllcykpXHJcbiAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ1VuYWJsZSB0byByZWFkIG1vZCBkaXJlY3RvcnknLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShlbnRyaWVzKTtcclxuICB9KTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIHJlYWRNb2RzRm9sZGVyKG1vZHNGb2xkZXIsIGFwaSkge1xyXG4gIGNvbnN0IGV4dEwgPSBpbnB1dCA9PiBwYXRoLmV4dG5hbWUoaW5wdXQpLnRvTG93ZXJDYXNlKCk7XHJcbiAgY29uc3QgaXNWYWxpZE1vZCA9IG1vZEZpbGUgPT4gWycucGFrJywgJy5jZmcnLCAnLm1hbmlmZXN0J10uaW5kZXhPZihleHRMKG1vZEZpbGUpKSAhPT0gLTE7XHJcblxyXG4gIC8vIFJlYWRzIHRoZSBwcm92aWRlZCBmb2xkZXJQYXRoIGFuZCBhdHRlbXB0cyB0byBpZGVudGlmeSBhbGxcclxuICAvLyAgY3VycmVudGx5IGRlcGxveWVkIG1vZHMuXHJcbiAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhtb2RzRm9sZGVyKVxyXG4gICAgLnRoZW4oZW50cmllcyA9PiBCbHVlYmlyZC5yZWR1Y2UoZW50cmllcywgKGFjY3VtLCBjdXJyZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRQYXRoID0gcGF0aC5qb2luKG1vZHNGb2xkZXIsIGN1cnJlbnQpO1xyXG4gICAgICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGN1cnJlbnRQYXRoKVxyXG4gICAgICAgIC50aGVuKG1vZEZpbGVzID0+IHtcclxuICAgICAgICAgIGlmIChtb2RGaWxlcy5zb21lKGlzVmFsaWRNb2QpID09PSB0cnVlKSB7XHJcbiAgICAgICAgICAgIGFjY3VtLnB1c2goY3VycmVudCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKSlcclxuICAgIH0sIFtdKSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBjb25zdCBhbGxvd1JlcG9ydCA9IFsnRU5PRU5UJywgJ0VQRVJNJywgJ0VBQ0NFU1MnXS5pbmRleE9mKGVyci5jb2RlKSA9PT0gLTE7XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ2ZhaWxlZCB0byByZWFkIGtpbmdkb20gY29tZSBtb2RzIGRpcmVjdG9yeScsXHJcbiAgICAgICAgZXJyLm1lc3NhZ2UsIHsgYWxsb3dSZXBvcnQgfSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxpc3RIYXNNb2QobW9kSWQsIGxpc3QpIHtcclxuICByZXR1cm4gKCEhbGlzdClcclxuICAgID8gbGlzdC5tYXAobW9kID0+XHJcbiAgICAgICAgdHJhbnNmb3JtSWQobW9kKS50b0xvd2VyQ2FzZSgpKS5pbmNsdWRlcyhtb2RJZC50b0xvd2VyQ2FzZSgpKVxyXG4gICAgOiBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWRNb2RzLCBlbmFibGVkTW9kcywgbW9kT3JkZXJGaWxlcGF0aCwgYXBpKSB7XHJcbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmRpcm5hbWUobW9kT3JkZXJGaWxlcGF0aCk7XHJcblxyXG4gIHJldHVybiByZWFkTW9kc0ZvbGRlcihtb2RzUGF0aCwgYXBpKS50aGVuKGRlcGxveWVkTW9kcyA9PlxyXG4gICAgZ2V0Q3VycmVudE9yZGVyKG1vZE9yZGVyRmlsZXBhdGgpXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJykgPyBQcm9taXNlLnJlc29sdmUoJycpIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgICAgLnRoZW4oZGF0YSA9PiB7XHJcbiAgICAgICAgLy8gMS4gQ29uZmlybWVkIHRvIGV4aXN0IChkZXBsb3llZCkgaW5zaWRlIHRoZSBtb2RzIGRpcmVjdG9yeS5cclxuICAgICAgICAvLyAyLiBJcyBub3QgcGFydCBvZiBhbnkgb2YgdGhlIG1vZCBsaXN0cyB3aGljaCBWb3J0ZXggbWFuYWdlcy5cclxuICAgICAgICBjb25zdCBtYW51YWxseUFkZGVkID0gZGF0YS5zcGxpdCgnXFxuJykuZmlsdGVyKGVudHJ5ID0+XHJcbiAgICAgICAgICAgICFsaXN0SGFzTW9kKGVudHJ5LCBlbmFibGVkTW9kcylcclxuICAgICAgICAgICYmICFsaXN0SGFzTW9kKGVudHJ5LCBkaXNhYmxlZE1vZHMpXHJcbiAgICAgICAgICAmJiBsaXN0SGFzTW9kKGVudHJ5LCBkZXBsb3llZE1vZHMpKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtYW51YWxseUFkZGVkKTtcclxuICAgICAgfSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZWZyZXNoTW9kTGlzdChjb250ZXh0LCBkaXNjb3ZlcnlQYXRoKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgaW5zdGFsbGF0aW9uUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIFtdKTtcclxuICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobW9kcyk7XHJcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgZW5hYmxlZCA9IG1vZEtleXMuZmlsdGVyKG1vZCA9PiAhIW1vZFN0YXRlW21vZF0gJiYgbW9kU3RhdGVbbW9kXS5lbmFibGVkKTtcclxuICBjb25zdCBkaXNhYmxlZCA9IG1vZEtleXMuZmlsdGVyKGRpcyA9PiAhZW5hYmxlZC5pbmNsdWRlcyhkaXMpKTtcclxuXHJcbiAgY29uc3QgZXh0TCA9IGlucHV0ID0+IHBhdGguZXh0bmFtZShpbnB1dCkudG9Mb3dlckNhc2UoKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKGVuYWJsZWQsIChhY2N1bSwgbW9kKSA9PiB7XHJcbiAgICBpZiAobW9kc1ttb2RdPy5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbW9kUGF0aCA9IHBhdGguam9pbihpbnN0YWxsYXRpb25QYXRoLCBtb2RzW21vZF0uaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICByZXR1cm4gd2Fsa0FzeW5jKG1vZFBhdGgpXHJcbiAgICAgIC50aGVuKGVudHJpZXMgPT4gKGVudHJpZXMuZmluZChmaWxlTmFtZSA9PiBbJy5wYWsnLCAnLmNmZycsICcubWFuaWZlc3QnXS5pbmNsdWRlcyhleHRMKGZpbGVOYW1lKSkpICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgPyBhY2N1bS5jb25jYXQobW9kKVxyXG4gICAgICAgIDogYWNjdW0pO1xyXG4gIH0sIFtdKS50aGVuKG1hbmFnZWRNb2RzID0+IHtcclxuICAgIHJldHVybiBnZXRNYW51YWxseUFkZGVkTW9kcyhkaXNhYmxlZCwgZW5hYmxlZCwgcGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsIG1vZHNQYXRoKCksXHJcbiAgICAgIE1PRFNfT1JERVJfRklMRU5BTUUpLCBjb250ZXh0LmFwaSlcclxuICAgICAgLnRoZW4obWFudWFsbHlBZGRlZCA9PiB7XHJcbiAgICAgICAgX01PRFNfU1RBVEUuZW5hYmxlZCA9IFtdLmNvbmNhdChtYW5hZ2VkTW9kc1xyXG4gICAgICAgICAgLm1hcChtb2QgPT4gdHJhbnNmb3JtSWQobW9kKSksIG1hbnVhbGx5QWRkZWQpO1xyXG4gICAgICAgIF9NT0RTX1NUQVRFLmRpc2FibGVkID0gZGlzYWJsZWQ7XHJcbiAgICAgICAgX01PRFNfU1RBVEUuZGlzcGxheSA9IF9NT0RTX1NUQVRFLmVuYWJsZWQ7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9KVxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBMb2FkT3JkZXJCYXNlKHByb3BzKSB7XHJcbiAgY29uc3QgZ2V0TW9kID0gKGl0ZW0pID0+IHtcclxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcy5tb2RzKTtcclxuICAgIGNvbnN0IGZvdW5kID0ga2V5cy5maW5kKGtleSA9PiB0cmFuc2Zvcm1JZChrZXkpID09PSBpdGVtKTtcclxuICAgIHJldHVybiBmb3VuZCAhPT0gdW5kZWZpbmVkXHJcbiAgICAgID8gcHJvcHMubW9kc1tmb3VuZF1cclxuICAgICAgOiB7IGF0dHJpYnV0ZXM6IHsgbmFtZTogaXRlbSB9IH07XHJcbiAgfTtcclxuXHJcbiAgY2xhc3MgSXRlbVJlbmRlcmVyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcclxuICAgIHJlbmRlcigpIHtcclxuICAgICAgaWYgKHByb3BzLm1vZHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBpdGVtID0gKHRoaXMucHJvcHMgYXMgYW55KS5pdGVtO1xyXG4gICAgICBjb25zdCBtb2QgPSBnZXRNb2QoaXRlbSk7XHJcblxyXG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChCUy5MaXN0R3JvdXBJdGVtLCB7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndmFyKC0tYnJhbmQtYmcsIGJsYWNrKScsXHJcbiAgICAgICAgICAgICAgYm9yZGVyQm90dG9tOiAnMnB4IHNvbGlkIHZhcigtLWJvcmRlci1jb2xvciwgd2hpdGUpJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICBmb250U2l6ZTogJzEuMWVtJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdpbWcnLCB7XHJcbiAgICAgICAgICAgIHNyYzogISFtb2QuYXR0cmlidXRlcy5waWN0dXJlVXJsXHJcbiAgICAgICAgICAgICAgICAgID8gbW9kLmF0dHJpYnV0ZXMucGljdHVyZVVybFxyXG4gICAgICAgICAgICAgICAgICA6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxyXG4gICAgICAgICAgICBjbGFzc05hbWU6ICdtb2QtcGljdHVyZScsXHJcbiAgICAgICAgICAgIHdpZHRoOic3NXB4JyxcclxuICAgICAgICAgICAgaGVpZ2h0Oic0NXB4JyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICBtYXJnaW46ICc1cHggMTBweCA1cHggNXB4JyxcclxuICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdmFyKC0tYnJhbmQtc2Vjb25kYXJ5LCNENzhGNDYpJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0pLFxyXG4gICAgICAgICAgdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCkpKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTWFpblBhZ2UsIHt9LFxyXG4gICAgUmVhY3QuY3JlYXRlRWxlbWVudChNYWluUGFnZS5Cb2R5LCB7fSxcclxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbCwgeyBpZDogJ2tjZC1sb2Fkb3JkZXItcGFuZWwnIH0sXHJcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbC5Cb2R5LCB7fSxcclxuICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dCwgeyB0eXBlOiAncm93JyB9LFxyXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwge30sXHJcbiAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChEcmFnZ2FibGVMaXN0LCB7XHJcbiAgICAgICAgICAgICAgICBpZDogJ2tjZC1sb2Fkb3JkZXInLFxyXG4gICAgICAgICAgICAgICAgaXRlbVR5cGVJZDogJ2tjZC1sb2Fkb3JkZXItaXRlbScsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogX01PRFNfU1RBVEUuZGlzcGxheSxcclxuICAgICAgICAgICAgICAgIGl0ZW1SZW5kZXJlcjogSXRlbVJlbmRlcmVyIGFzIGFueSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2F1dG8nLFxyXG4gICAgICAgICAgICAgICAgICBib3JkZXJXaWR0aDogJ3ZhcigtLWJvcmRlci13aWR0aCwgMXB4KScsXHJcbiAgICAgICAgICAgICAgICAgIGJvcmRlclN0eWxlOiAnc29saWQnLFxyXG4gICAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJ3ZhcigtLWJvcmRlci1jb2xvciwgd2hpdGUpJyxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBhcHBseTogb3JkZXJlZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFdlIG9ubHkgd3JpdGUgdG8gdGhlIG1vZF9vcmRlciBmaWxlIHdoZW4gd2UgZGVwbG95IHRvIGF2b2lkICh1bmxpa2VseSkgc2l0dWF0aW9uc1xyXG4gICAgICAgICAgICAgICAgICAvLyAgd2hlcmUgYSBmaWxlIGRlc2NyaXB0b3IgcmVtYWlucyBvcGVuLCBibG9ja2luZyBmaWxlIG9wZXJhdGlvbnMgd2hlbiB0aGUgdXNlclxyXG4gICAgICAgICAgICAgICAgICAvLyAgY2hhbmdlcyB0aGUgbG9hZCBvcmRlciB2ZXJ5IHF1aWNrbHkuIFRoaXMgaXMgYWxsIHRoZW9yZXRpY2FsIGF0IHRoaXMgcG9pbnQuXHJcbiAgICAgICAgICAgICAgICAgIHByb3BzLm9uU2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldE5ld09yZGVyKHByb3BzLCBvcmRlcmVkKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHt9LFxyXG4gICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ2RpdicsIHtcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICd2YXIoLS1oYWxmLWd1dHRlciwgMTVweCknLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdoMicsIHt9LFxyXG4gICAgICAgICAgICAgICAgICBwcm9wcy50KCdDaGFuZ2luZyB5b3VyIGxvYWQgb3JkZXInLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sXHJcbiAgICAgICAgICAgICAgICAgIHByb3BzLnQoJ0RyYWcgYW5kIGRyb3AgdGhlIG1vZHMgb24gdGhlIGxlZnQgdG8gcmVvcmRlciB0aGVtLiBLaW5nZG9tIENvbWU6IERlbGl2ZXJhbmNlIHVzZXMgYSBtb2Rfb3JkZXIudHh0IGZpbGUgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgKyAndG8gZGVmaW5lIHRoZSBvcmRlciBpbiB3aGljaCBtb2RzIGFyZSBsb2FkZWQsIFZvcnRleCB3aWxsIHdyaXRlIHRoZSBmb2xkZXIgbmFtZXMgb2YgdGhlIGRpc3BsYXllZCAnXHJcbiAgICAgICAgICAgICAgICAgICAgICArICdtb2RzIGluIHRoZSBvcmRlciB5b3UgaGF2ZSBzZXQuICdcclxuICAgICAgICAgICAgICAgICAgICAgICsgJ01vZHMgcGxhY2VkIGF0IHRoZSBib3R0b20gb2YgdGhlIGxvYWQgb3JkZXIgd2lsbCBoYXZlIHByaW9yaXR5IG92ZXIgdGhvc2UgYWJvdmUgdGhlbS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSxcclxuICAgICAgICAgICAgICAgICAgcHJvcHMudCgnTm90ZTogVm9ydGV4IHdpbGwgZGV0ZWN0IG1hbnVhbGx5IGFkZGVkIG1vZHMgYXMgbG9uZyBhcyB0aGVzZSBoYXZlIGJlZW4gYWRkZWQgdG8gdGhlIG1vZF9vcmRlci50eHQgZmlsZS4gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICArICdNYW51YWxseSBhZGRlZCBtb2RzIGFyZSBub3QgbWFuYWdlZCBieSBWb3J0ZXggLSB0byByZW1vdmUgdGhlc2UsIHlvdSB3aWxsIGhhdmUgdG8gJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICArICdtYW51YWxseSBlcmFzZSB0aGUgZW50cnkgZnJvbSB0aGUgbW9kX29yZGVyLnR4dCBmaWxlLicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcclxuICAgICAgICAgICAgICApKVxyXG4gICAgICAgICkpKSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtb2RzUGF0aCgpIHtcclxuICByZXR1cm4gJ01vZHMnO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXROZXdPcmRlcihwcm9wcywgb3JkZXJlZCkge1xyXG4gIGNvbnN0IHsgY29udGV4dCwgcHJvZmlsZSwgb25TZXRPcmRlciB9ID0gcHJvcHM7XHJcbiAgaWYgKHByb2ZpbGU/LmlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIE5vdCBzdXJlIGhvdyB3ZSBnb3QgaGVyZSB3aXRob3V0IGEgdmFsaWQgcHJvZmlsZS5cclxuICAgIC8vICBwb3NzaWJseSB0aGUgdXNlciBjaGFuZ2VkIHByb2ZpbGUgZHVyaW5nIHRoZSBzZXR1cC9wcmVwYXJhdGlvblxyXG4gICAgLy8gIHN0YWdlID8gaHR0cHM6Ly9naXRodWIuY29tL05leHVzLU1vZHMvVm9ydGV4L2lzc3Vlcy83MDUzXHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBzZXQgbmV3IGxvYWQgb3JkZXInLCAndW5kZWZpbmVkIHByb2ZpbGUnKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIC8vIFdlIGZpbHRlciB0aGUgb3JkZXJlZCBsaXN0IGp1c3QgaW4gY2FzZSB0aGVyZSdzIGFuIGVtcHR5XHJcbiAgLy8gIGVudHJ5LCB3aGljaCBpcyBwb3NzaWJsZSBpZiB0aGUgdXNlcnMgaGFkIG1hbnVhbGx5IGFkZGVkXHJcbiAgLy8gIGVtcHR5IGxpbmVzIGluIHRoZSBsb2FkIG9yZGVyIGZpbGUuXHJcbiAgY29uc3QgZmlsdGVyZWQgPSBvcmRlcmVkLmZpbHRlcihlbnRyeSA9PiAhIWVudHJ5KTtcclxuICBfTU9EU19TVEFURS5kaXNwbGF5ID0gZmlsdGVyZWQ7XHJcblxyXG4gIHJldHVybiAoISFvblNldE9yZGVyKVxyXG4gICAgPyBvblNldE9yZGVyKHByb2ZpbGUuaWQsIGZpbHRlcmVkKVxyXG4gICAgOiBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlLmlkLCBmaWx0ZXJlZCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3cml0ZU9yZGVyRmlsZShmaWxlUGF0aCwgbW9kTGlzdCkge1xyXG4gIHJldHVybiBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcclxuICAgIC5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFTk9FTlQnID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKVxyXG4gICAgLnRoZW4oKCkgPT4gZnMuZW5zdXJlRmlsZUFzeW5jKGZpbGVQYXRoKSlcclxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCBtb2RMaXN0LmpvaW4oJ1xcbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQpIHtcclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdLaW5nZG9tIENvbWU6XFx0RGVsaXZlcmFuY2UnLFxyXG4gICAgbWVyZ2VNb2RzOiBtb2QgPT4gdHJhbnNmb3JtSWQobW9kLmlkKSxcclxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXHJcbiAgICBxdWVyeU1vZFBhdGg6IG1vZHNQYXRoLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6IChkaXNjb3ZlcmVkUGF0aCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGVwaWNQYXRoID0gcGF0aC5qb2luKCdCaW4nLCAnV2luNjRNYXN0ZXJNYXN0ZXJFcGljUEdPJywgJ0tpbmdkb21Db21lLmV4ZScpXHJcbiAgICAgICAgZnMuc3RhdFN5bmMocGF0aC5qb2luKGRpc2NvdmVyZWRQYXRoLCBlcGljUGF0aCkpO1xyXG4gICAgICAgIHJldHVybiBlcGljUGF0aDtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGguam9pbignQmluJywgJ1dpbjY0JywgJ0tpbmdkb21Db21lLmV4ZScpO1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAnRGF0YS9MZXZlbHMvcmF0YWplL2xldmVsLnBhaycsXHJcbiAgICBdLFxyXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSksXHJcbiAgICAvL3JlcXVpcmVzQ2xlYW51cDogdHJ1ZSwgLy8gVGhlb3JldGljYWxseSBub3QgbmVlZGVkLCBhcyB3ZSBsb29rIGZvciBzZXZlcmFsIGZpbGUgZXh0ZW5zaW9ucyB3aGVuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gIGNoZWNraW5nIHdoZXRoZXIgYSBtb2QgaXMgdmFsaWQgb3Igbm90LiBUaGlzIG1heSBjaGFuZ2UuXHJcbiAgICByZXF1aXJlc0xhdW5jaGVyOiAoKSA9PiB1dGlsLmVwaWNHYW1lc0xhdW5jaGVyLmlzR2FtZUluc3RhbGxlZCgnRWVsJylcclxuICAgICAgLnRoZW4oZXBpYyA9PiBlcGljXHJcbiAgICAgICAgPyB7IGxhdW5jaGVyOiAnZXBpYycsIGFkZEluZm86ICdFZWwnIH1cclxuICAgICAgICA6IHVuZGVmaW5lZCksXHJcbiAgICBlbnZpcm9ubWVudDoge1xyXG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9BUFBJRCxcclxuICAgIH0sXHJcbiAgICBkZXRhaWxzOiB7XHJcbiAgICAgIHN0ZWFtQXBwSWQ6ICtTVEVBTV9BUFBJRCxcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNYWluUGFnZSgnc29ydC1ub25lJywgJ0xvYWQgT3JkZXInLCBMb2FkT3JkZXIsIHtcclxuICAgIGlkOiAna2NkLWxvYWQtb3JkZXInLFxyXG4gICAgaG90a2V5OiAnRScsXHJcbiAgICBncm91cDogJ3Blci1nYW1lJyxcclxuICAgIHZpc2libGU6ICgpID0+IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKSkgPT09IEdBTUVfSUQsXHJcbiAgICBwcm9wczogKCkgPT4gKHtcclxuICAgICAgdDogY29udGV4dC5hcGkudHJhbnNsYXRlLFxyXG4gICAgfSksXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHRbJ3JlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUnXShcclxuICAgICdrY2RfY29sbGVjdGlvbl9kYXRhJyxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgaW5jbHVkZWRNb2RzOiBzdHJpbmdbXSkgPT5cclxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzKSxcclxuICAgIChnYW1lSWQ6IHN0cmluZywgY29sbGVjdGlvbjogSUtDRENvbGxlY3Rpb25zRGF0YSkgPT5cclxuICAgICAgcGFyc2VDb2xsZWN0aW9uc0RhdGEoY29udGV4dCwgZ2FtZUlkLCBjb2xsZWN0aW9uKSxcclxuICAgICh0KSA9PiB0KCdLaW5nZG9tIENvbWU6IERlbGl2ZXJhbmNlIERhdGEnKSxcclxuICAgIChzdGF0ZTogdHlwZXMuSVN0YXRlLCBnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcclxuICApO1xyXG5cclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdtb2QtZW5hYmxlZCcsIChwcm9maWxlSWQsIG1vZElkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuXHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdwcm9maWxlcycsIHByb2ZpbGVJZF0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIGlmICghIXByb2ZpbGUgJiYgKHByb2ZpbGUuZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoX01PRFNfU1RBVEUuZGlzcGxheS5pbmRleE9mKG1vZElkKSA9PT0gLTEpKSB7XHJcbiAgICAgICAgcmVmcmVzaE1vZExpc3QoY29udGV4dCwgZGlzY292ZXJ5LnBhdGgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ3B1cmdlLW1vZHMnLCAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0b3JlID0gY29udGV4dC5hcGkuc3RvcmU7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICAgICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCB8fCBwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCl7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXHJcbiAgICAgICAgbG9nKCdlcnJvcicsICdraW5nZG9tY29tZWRlbGl2ZXJhbmNlIHdhcyBub3QgZGlzY292ZXJlZCcpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbW9kc09yZGVyRmlsZVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG1vZHNQYXRoKCksIE1PRFNfT1JERVJfRklMRU5BTUUpO1xyXG4gICAgICBjb25zdCBtYW5hZ2VkTW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gICAgICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobWFuYWdlZE1vZHMpO1xyXG4gICAgICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcclxuICAgICAgY29uc3QgZW5hYmxlZCA9IG1vZEtleXMuZmlsdGVyKG1vZCA9PiAhIW1vZFN0YXRlW21vZF0gJiYgbW9kU3RhdGVbbW9kXS5lbmFibGVkKTtcclxuICAgICAgY29uc3QgZGlzYWJsZWQgPSBtb2RLZXlzLmZpbHRlcihkaXMgPT4gIWVuYWJsZWQuaW5jbHVkZXMoZGlzKSk7XHJcbiAgICAgIGdldE1hbnVhbGx5QWRkZWRNb2RzKGRpc2FibGVkLCBlbmFibGVkLCBtb2RzT3JkZXJGaWxlUGF0aCwgY29udGV4dC5hcGkpXHJcbiAgICAgICAgLnRoZW4obWFudWFsbHlBZGRlZCA9PiB7XHJcbiAgICAgICAgICB3cml0ZU9yZGVyRmlsZShtb2RzT3JkZXJGaWxlUGF0aCwgbWFudWFsbHlBZGRlZClcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gc2V0TmV3T3JkZXIoeyBjb250ZXh0LCBwcm9maWxlIH0sIG1hbnVhbGx5QWRkZWQpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcclxuICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlLWluc3RhdGUgbWFudWFsbHkgYWRkZWQgbW9kcycsIGVyciwgeyBhbGxvd1JlcG9ydDogIXVzZXJDYW5jZWxlZCB9KVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLWRlcGxveScsIChwcm9maWxlSWQsIGRlcGxveW1lbnQpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xyXG4gICAgICBpZiAocHJvZmlsZSA9PT0gdW5kZWZpbmVkIHx8IHByb2ZpbGUuZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcblxyXG4gICAgICAgIGlmIChwcm9maWxlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIGxvZygnZXJyb3InLCAncHJvZmlsZSBkb2VzIG5vdCBleGlzdCcsIHByb2ZpbGVJZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBwcm9maWxlLmdhbWVJZF0sIHVuZGVmaW5lZCk7XHJcblxyXG4gICAgICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXHJcbiAgICAgICAgbG9nKCdlcnJvcicsICdraW5nZG9tY29tZWRlbGl2ZXJhbmNlIHdhcyBub3QgZGlzY292ZXJlZCcpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgbW9kc0ZvbGRlciA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSk7XHJcbiAgICAgIGNvbnN0IG1vZE9yZGVyRmlsZSA9IHBhdGguam9pbihtb2RzRm9sZGVyLCBNT0RTX09SREVSX0ZJTEVOQU1FKTtcclxuXHJcbiAgICAgIHJldHVybiByZWZyZXNoTW9kTGlzdChjb250ZXh0LCBkaXNjb3ZlcnkucGF0aClcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICBsZXQgbWlzc2luZyA9IGxvYWRPcmRlclxyXG4gICAgICAgICAgICAuZmlsdGVyKG1vZCA9PiAhbGlzdEhhc01vZCh0cmFuc2Zvcm1JZChtb2QpLCBfTU9EU19TVEFURS5lbmFibGVkKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiAhbGlzdEhhc01vZCh0cmFuc2Zvcm1JZChtb2QpLCBfTU9EU19TVEFURS5kaXNhYmxlZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgbGlzdEhhc01vZCh0cmFuc2Zvcm1JZChtb2QpLCBfTU9EU19TVEFURS5kaXNwbGF5KSlcclxuICAgICAgICAgICAgLm1hcChtb2QgPT4gdHJhbnNmb3JtSWQobW9kKSkgfHwgW107XHJcblxyXG4gICAgICAgICAgLy8gVGhpcyBpcyB0aGVvcmV0aWNhbGx5IHVuZWNlc3NhcnkgLSBidXQgaXQgd2lsbCBlbnN1cmUgbm8gZHVwbGljYXRlc1xyXG4gICAgICAgICAgLy8gIGFyZSBhZGRlZC5cclxuICAgICAgICAgIG1pc3NpbmcgPSBbIC4uLm5ldyBTZXQobWlzc2luZykgXTtcclxuICAgICAgICAgIGNvbnN0IHRyYW5zZm9ybWVkID0gWyAuLi5fTU9EU19TVEFURS5lbmFibGVkLCAuLi5taXNzaW5nIF07XHJcbiAgICAgICAgICBjb25zdCBsb1ZhbHVlID0gKGlucHV0KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IGxvYWRPcmRlci5pbmRleE9mKGlucHV0KTtcclxuICAgICAgICAgICAgcmV0dXJuIGlkeCAhPT0gLTEgPyBpZHggOiBsb2FkT3JkZXIubGVuZ3RoO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFNvcnRcclxuICAgICAgICAgIGxldCBzb3J0ZWQgPSB0cmFuc2Zvcm1lZC5sZW5ndGggPiAxXHJcbiAgICAgICAgICAgID8gdHJhbnNmb3JtZWQuc29ydCgobGhzLCByaHMpID0+IGxvVmFsdWUobGhzKSAtIGxvVmFsdWUocmhzKSlcclxuICAgICAgICAgICAgOiB0cmFuc2Zvcm1lZDtcclxuXHJcbiAgICAgICAgICBzZXROZXdPcmRlcih7IGNvbnRleHQsIHByb2ZpbGUgfSwgc29ydGVkKTtcclxuICAgICAgICAgIHJldHVybiB3cml0ZU9yZGVyRmlsZShtb2RPcmRlckZpbGUsIHRyYW5zZm9ybWVkKVxyXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCB1c2VyQ2FuY2VsZWQgPSAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpO1xyXG4gICAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIHRvIGxvYWQgb3JkZXIgZmlsZScsIGVyciwgeyBhbGxvd1JlcG9ydDogIXVzZXJDYW5jZWxlZCB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSlcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlKSB7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICBjb25zdCBwcm9maWxlSWQgPSBwcm9maWxlPy5pZCB8fCAnJztcclxuICBjb25zdCBnYW1lSWQgPSBwcm9maWxlPy5nYW1lSWQgfHwgJyc7XHJcbiAgcmV0dXJuIHtcclxuICAgIHByb2ZpbGUsXHJcbiAgICBtb2RTdGF0ZTogdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pLFxyXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIGdhbWVJZF0sIFtdKSxcclxuICAgIG9yZGVyOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSksXHJcbiAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIG9uU2V0RGVwbG95bWVudE5lY2Vzc2FyeTogKGdhbWVJZCwgbmVjZXNzYXJ5KSA9PiBkaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoZ2FtZUlkLCBuZWNlc3NhcnkpKSxcclxuICAgIG9uU2V0T3JkZXI6IChwcm9maWxlSWQsIG9yZGVyZWQpID0+IGRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgb3JkZXJlZCkpLFxyXG4gIH07XHJcbn1cclxuXHJcbmNvbnN0IExvYWRPcmRlciA9IGNvbm5lY3QobWFwU3RhdGVUb1Byb3BzLCBtYXBEaXNwYXRjaFRvUHJvcHMpKExvYWRPcmRlckJhc2UpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19