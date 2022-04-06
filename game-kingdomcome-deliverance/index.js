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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3REFBZ0M7QUFDaEMsNkNBQStCO0FBQy9CLG9EQUFzQztBQUN0Qyw2Q0FBc0M7QUFDdEMsZ0RBQXdCO0FBQ3hCLDJDQUEyRztBQUczRywyREFBcUY7QUFDckYsNEZBQW9FO0FBQ3BFLHVDQUF5RDtBQUN6RCxpQ0FBcUM7QUFFckMsTUFBTSxjQUFjLEdBQUcsUUFBUSxpQkFBTyxFQUFFLENBQUM7QUFFekMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDO0FBRTdCLE1BQU0sV0FBVyxHQUFHO0lBQ2xCLE9BQU8sRUFBRSxFQUFFO0lBQ1gsUUFBUSxFQUFFLEVBQUU7SUFDWixPQUFPLEVBQUUsRUFBRTtDQUNaLENBQUE7QUFFRCxTQUFTLFFBQVE7SUFDZixPQUFPLGlCQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUM7U0FDdkMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLGlCQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3RELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNqQyxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsU0FBUztJQUMzQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMzQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQyxPQUFPLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsa0JBQVEsQ0FB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T0FBTyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3ZGLENBQUM7QUFDSixDQUFDO0FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBQSxxQkFBTyxFQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBRTlFLE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCAqIGFzIEJTIGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XHJcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgRHJhZ2dhYmxlTGlzdCwgRmxleExheW91dCwgdHlwZXMsIGxvZywgTWFpblBhZ2UsIHNlbGVjdG9ycywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgSUtDRENvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xyXG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uc0RhdGEsIHBhcnNlQ29sbGVjdGlvbnNEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucyc7XHJcbmltcG9ydCBDb2xsZWN0aW9uc0RhdGFWaWV3IGZyb20gJy4vY29sbGVjdGlvbnMvQ29sbGVjdGlvbnNEYXRhVmlldyc7XHJcbmltcG9ydCB7IEdBTUVfSUQsIE1PRFNfT1JERVJfRklMRU5BTUUgfSBmcm9tICcuL3N0YXRpY3MnO1xyXG5pbXBvcnQgeyB0cmFuc2Zvcm1JZCB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5jb25zdCBJMThOX05BTUVTUEFDRSA9IGBnYW1lLSR7R0FNRV9JRH1gO1xyXG5cclxuY29uc3QgU1RFQU1fQVBQSUQgPSAnMzc5NDMwJztcclxuXHJcbmNvbnN0IF9NT0RTX1NUQVRFID0ge1xyXG4gIGVuYWJsZWQ6IFtdLFxyXG4gIGRpc2FibGVkOiBbXSxcclxuICBkaXNwbGF5OiBbXSxcclxufVxyXG5cclxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgcmV0dXJuIHV0aWwuc3RlYW0uZmluZEJ5QXBwSWQoU1RFQU1fQVBQSUQpXHJcbiAgICAuY2F0Y2goKCkgPT4gdXRpbC5lcGljR2FtZXNMYXVuY2hlci5maW5kQnlBcHBJZCgnRWVsJykpXHJcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcclxuICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJyksICgpID0+IEJsdWViaXJkLnJlc29sdmUoKSlcclxuICAgIC50aGVuKCgpID0+IGdldEN1cnJlbnRPcmRlcihwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG1vZHNQYXRoKCksIE1PRFNfT1JERVJfRklMRU5BTUUpKSlcclxuICAgIC5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFTk9FTlQnID8gUHJvbWlzZS5yZXNvbHZlKFtdKSA6IFByb21pc2UucmVqZWN0KGVycikpXHJcbiAgICAudGhlbihkYXRhID0+IHNldE5ld09yZGVyKHsgY29udGV4dCwgcHJvZmlsZSB9LFxyXG4gICAgICBBcnJheS5pc0FycmF5KGRhdGEpID8gZGF0YSA6IGRhdGEuc3BsaXQoJ1xcbicpKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEN1cnJlbnRPcmRlcihtb2RPcmRlckZpbGVwYXRoKSB7XHJcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMobW9kT3JkZXJGaWxlcGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3YWxrQXN5bmMoZGlyKSB7XHJcbiAgbGV0IGVudHJpZXMgPSBbXTtcclxuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGRpcikudGhlbihmaWxlcyA9PiB7XHJcbiAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChmaWxlcywgZmlsZSA9PiB7XHJcbiAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKGRpciwgZmlsZSk7XHJcbiAgICAgIHJldHVybiBmcy5zdGF0QXN5bmMoZnVsbFBhdGgpLnRoZW4oc3RhdHMgPT4ge1xyXG4gICAgICAgIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgICAgICByZXR1cm4gd2Fsa0FzeW5jKGZ1bGxQYXRoKVxyXG4gICAgICAgICAgICAudGhlbihuZXN0ZWRGaWxlcyA9PiB7XHJcbiAgICAgICAgICAgICAgZW50cmllcyA9IGVudHJpZXMuY29uY2F0KG5lc3RlZEZpbGVzKTtcclxuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGVudHJpZXMucHVzaChmdWxsUGF0aCk7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0pXHJcbiAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXMpKVxyXG4gIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgbG9nKCdlcnJvcicsICdVbmFibGUgdG8gcmVhZCBtb2QgZGlyZWN0b3J5JywgZXJyKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZW50cmllcyk7XHJcbiAgfSk7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiByZWFkTW9kc0ZvbGRlcihtb2RzRm9sZGVyLCBhcGkpIHtcclxuICBjb25zdCBleHRMID0gaW5wdXQgPT4gcGF0aC5leHRuYW1lKGlucHV0KS50b0xvd2VyQ2FzZSgpO1xyXG4gIGNvbnN0IGlzVmFsaWRNb2QgPSBtb2RGaWxlID0+IFsnLnBhaycsICcuY2ZnJywgJy5tYW5pZmVzdCddLmluZGV4T2YoZXh0TChtb2RGaWxlKSkgIT09IC0xO1xyXG5cclxuICAvLyBSZWFkcyB0aGUgcHJvdmlkZWQgZm9sZGVyUGF0aCBhbmQgYXR0ZW1wdHMgdG8gaWRlbnRpZnkgYWxsXHJcbiAgLy8gIGN1cnJlbnRseSBkZXBsb3llZCBtb2RzLlxyXG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMobW9kc0ZvbGRlcilcclxuICAgIC50aGVuKGVudHJpZXMgPT4gQmx1ZWJpcmQucmVkdWNlKGVudHJpZXMsIChhY2N1bSwgY3VycmVudCkgPT4ge1xyXG4gICAgICBjb25zdCBjdXJyZW50UGF0aCA9IHBhdGguam9pbihtb2RzRm9sZGVyLCBjdXJyZW50KTtcclxuICAgICAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhjdXJyZW50UGF0aClcclxuICAgICAgICAudGhlbihtb2RGaWxlcyA9PiB7XHJcbiAgICAgICAgICBpZiAobW9kRmlsZXMuc29tZShpc1ZhbGlkTW9kKSA9PT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICBhY2N1bS5wdXNoKGN1cnJlbnQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZShhY2N1bSkpXHJcbiAgICB9LCBbXSkpXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgY29uc3QgYWxsb3dSZXBvcnQgPSBbJ0VOT0VOVCcsICdFUEVSTScsICdFQUNDRVNTJ10uaW5kZXhPZihlcnIuY29kZSkgPT09IC0xO1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdmYWlsZWQgdG8gcmVhZCBraW5nZG9tIGNvbWUgbW9kcyBkaXJlY3RvcnknLFxyXG4gICAgICAgIGVyci5tZXNzYWdlLCB7IGFsbG93UmVwb3J0IH0pO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBsaXN0SGFzTW9kKG1vZElkLCBsaXN0KSB7XHJcbiAgcmV0dXJuICghIWxpc3QpXHJcbiAgICA/IGxpc3QubWFwKG1vZCA9PlxyXG4gICAgICAgIHRyYW5zZm9ybUlkKG1vZCkudG9Mb3dlckNhc2UoKSkuaW5jbHVkZXMobW9kSWQudG9Mb3dlckNhc2UoKSlcclxuICAgIDogZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE1hbnVhbGx5QWRkZWRNb2RzKGRpc2FibGVkTW9kcywgZW5hYmxlZE1vZHMsIG1vZE9yZGVyRmlsZXBhdGgsIGFwaSkge1xyXG4gIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5kaXJuYW1lKG1vZE9yZGVyRmlsZXBhdGgpO1xyXG5cclxuICByZXR1cm4gcmVhZE1vZHNGb2xkZXIobW9kc1BhdGgsIGFwaSkudGhlbihkZXBsb3llZE1vZHMgPT5cclxuICAgIGdldEN1cnJlbnRPcmRlcihtb2RPcmRlckZpbGVwYXRoKVxyXG4gICAgICAuY2F0Y2goZXJyID0+IChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpID8gUHJvbWlzZS5yZXNvbHZlKCcnKSA6IFByb21pc2UucmVqZWN0KGVycikpXHJcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgIC8vIDEuIENvbmZpcm1lZCB0byBleGlzdCAoZGVwbG95ZWQpIGluc2lkZSB0aGUgbW9kcyBkaXJlY3RvcnkuXHJcbiAgICAgICAgLy8gMi4gSXMgbm90IHBhcnQgb2YgYW55IG9mIHRoZSBtb2QgbGlzdHMgd2hpY2ggVm9ydGV4IG1hbmFnZXMuXHJcbiAgICAgICAgY29uc3QgbWFudWFsbHlBZGRlZCA9IGRhdGEuc3BsaXQoJ1xcbicpLmZpbHRlcihlbnRyeSA9PlxyXG4gICAgICAgICAgICAhbGlzdEhhc01vZChlbnRyeSwgZW5hYmxlZE1vZHMpXHJcbiAgICAgICAgICAmJiAhbGlzdEhhc01vZChlbnRyeSwgZGlzYWJsZWRNb2RzKVxyXG4gICAgICAgICAgJiYgbGlzdEhhc01vZChlbnRyeSwgZGVwbG95ZWRNb2RzKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobWFudWFsbHlBZGRlZCk7XHJcbiAgICAgIH0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVmcmVzaE1vZExpc3QoY29udGV4dCwgZGlzY292ZXJ5UGF0aCkge1xyXG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xyXG4gIGNvbnN0IGluc3RhbGxhdGlvblBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCBbXSk7XHJcbiAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1vZHMpO1xyXG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xyXG4gIGNvbnN0IGVuYWJsZWQgPSBtb2RLZXlzLmZpbHRlcihtb2QgPT4gISFtb2RTdGF0ZVttb2RdICYmIG1vZFN0YXRlW21vZF0uZW5hYmxlZCk7XHJcbiAgY29uc3QgZGlzYWJsZWQgPSBtb2RLZXlzLmZpbHRlcihkaXMgPT4gIWVuYWJsZWQuaW5jbHVkZXMoZGlzKSk7XHJcblxyXG4gIGNvbnN0IGV4dEwgPSBpbnB1dCA9PiBwYXRoLmV4dG5hbWUoaW5wdXQpLnRvTG93ZXJDYXNlKCk7XHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShlbmFibGVkLCAoYWNjdW0sIG1vZCkgPT4ge1xyXG4gICAgaWYgKG1vZHNbbW9kXT8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kc1ttb2RdLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgcmV0dXJuIHdhbGtBc3luYyhtb2RQYXRoKVxyXG4gICAgICAudGhlbihlbnRyaWVzID0+IChlbnRyaWVzLmZpbmQoZmlsZU5hbWUgPT4gWycucGFrJywgJy5jZmcnLCAnLm1hbmlmZXN0J10uaW5jbHVkZXMoZXh0TChmaWxlTmFtZSkpKSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgID8gYWNjdW0uY29uY2F0KG1vZClcclxuICAgICAgICA6IGFjY3VtKTtcclxuICB9LCBbXSkudGhlbihtYW5hZ2VkTW9kcyA9PiB7XHJcbiAgICByZXR1cm4gZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWQsIGVuYWJsZWQsIHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBtb2RzUGF0aCgpLFxyXG4gICAgICBNT0RTX09SREVSX0ZJTEVOQU1FKSwgY29udGV4dC5hcGkpXHJcbiAgICAgIC50aGVuKG1hbnVhbGx5QWRkZWQgPT4ge1xyXG4gICAgICAgIF9NT0RTX1NUQVRFLmVuYWJsZWQgPSBbXS5jb25jYXQobWFuYWdlZE1vZHNcclxuICAgICAgICAgIC5tYXAobW9kID0+IHRyYW5zZm9ybUlkKG1vZCkpLCBtYW51YWxseUFkZGVkKTtcclxuICAgICAgICBfTU9EU19TVEFURS5kaXNhYmxlZCA9IGRpc2FibGVkO1xyXG4gICAgICAgIF9NT0RTX1NUQVRFLmRpc3BsYXkgPSBfTU9EU19TVEFURS5lbmFibGVkO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSlcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gTG9hZE9yZGVyQmFzZShwcm9wcykge1xyXG4gIGNvbnN0IGdldE1vZCA9IChpdGVtKSA9PiB7XHJcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvcHMubW9kcyk7XHJcbiAgICBjb25zdCBmb3VuZCA9IGtleXMuZmluZChrZXkgPT4gdHJhbnNmb3JtSWQoa2V5KSA9PT0gaXRlbSk7XHJcbiAgICByZXR1cm4gZm91bmQgIT09IHVuZGVmaW5lZFxyXG4gICAgICA/IHByb3BzLm1vZHNbZm91bmRdXHJcbiAgICAgIDogeyBhdHRyaWJ1dGVzOiB7IG5hbWU6IGl0ZW0gfSB9O1xyXG4gIH07XHJcblxyXG4gIGNsYXNzIEl0ZW1SZW5kZXJlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XHJcbiAgICByZW5kZXIoKSB7XHJcbiAgICAgIGlmIChwcm9wcy5tb2RzID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgaXRlbSA9ICh0aGlzLnByb3BzIGFzIGFueSkuaXRlbTtcclxuICAgICAgY29uc3QgbW9kID0gZ2V0TW9kKGl0ZW0pO1xyXG5cclxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuTGlzdEdyb3VwSXRlbSwge1xyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3ZhcigtLWJyYW5kLWJnLCBibGFjayknLFxyXG4gICAgICAgICAgICAgIGJvcmRlckJvdHRvbTogJzJweCBzb2xpZCB2YXIoLS1ib3JkZXItY29sb3IsIHdoaXRlKSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgZm9udFNpemU6ICcxLjFlbScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaW1nJywge1xyXG4gICAgICAgICAgICBzcmM6ICEhbW9kLmF0dHJpYnV0ZXMucGljdHVyZVVybFxyXG4gICAgICAgICAgICAgICAgICA/IG1vZC5hdHRyaWJ1dGVzLnBpY3R1cmVVcmxcclxuICAgICAgICAgICAgICAgICAgOiBgJHtfX2Rpcm5hbWV9L2dhbWVhcnQuanBnYCxcclxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnbW9kLXBpY3R1cmUnLFxyXG4gICAgICAgICAgICB3aWR0aDonNzVweCcsXHJcbiAgICAgICAgICAgIGhlaWdodDonNDVweCcsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgbWFyZ2luOiAnNXB4IDEwcHggNXB4IDVweCcsXHJcbiAgICAgICAgICAgICAgYm9yZGVyOiAnMXB4IHNvbGlkIHZhcigtLWJyYW5kLXNlY29uZGFyeSwjRDc4RjQ2KScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9KSxcclxuICAgICAgICAgIHV0aWwucmVuZGVyTW9kTmFtZShtb2QpKSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1haW5QYWdlLCB7fSxcclxuICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTWFpblBhZ2UuQm9keSwge30sXHJcbiAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwsIHsgaWQ6ICdrY2QtbG9hZG9yZGVyLXBhbmVsJyB9LFxyXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwuQm9keSwge30sXHJcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQsIHsgdHlwZTogJ3JvdycgfSxcclxuICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHt9LFxyXG4gICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRHJhZ2dhYmxlTGlzdCwge1xyXG4gICAgICAgICAgICAgICAgaWQ6ICdrY2QtbG9hZG9yZGVyJyxcclxuICAgICAgICAgICAgICAgIGl0ZW1UeXBlSWQ6ICdrY2QtbG9hZG9yZGVyLWl0ZW0nLFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6IF9NT0RTX1NUQVRFLmRpc3BsYXksXHJcbiAgICAgICAgICAgICAgICBpdGVtUmVuZGVyZXI6IEl0ZW1SZW5kZXJlciBhcyBhbnksXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICAgb3ZlcmZsb3c6ICdhdXRvJyxcclxuICAgICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6ICd2YXIoLS1ib3JkZXItd2lkdGgsIDFweCknLFxyXG4gICAgICAgICAgICAgICAgICBib3JkZXJTdHlsZTogJ3NvbGlkJyxcclxuICAgICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICd2YXIoLS1ib3JkZXItY29sb3IsIHdoaXRlKScsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYXBwbHk6IG9yZGVyZWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAvLyBXZSBvbmx5IHdyaXRlIHRvIHRoZSBtb2Rfb3JkZXIgZmlsZSB3aGVuIHdlIGRlcGxveSB0byBhdm9pZCAodW5saWtlbHkpIHNpdHVhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgLy8gIHdoZXJlIGEgZmlsZSBkZXNjcmlwdG9yIHJlbWFpbnMgb3BlbiwgYmxvY2tpbmcgZmlsZSBvcGVyYXRpb25zIHdoZW4gdGhlIHVzZXJcclxuICAgICAgICAgICAgICAgICAgLy8gIGNoYW5nZXMgdGhlIGxvYWQgb3JkZXIgdmVyeSBxdWlja2x5LiBUaGlzIGlzIGFsbCB0aGVvcmV0aWNhbCBhdCB0aGlzIHBvaW50LlxyXG4gICAgICAgICAgICAgICAgICBwcm9wcy5vblNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBzZXROZXdPcmRlcihwcm9wcywgb3JkZXJlZCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dC5GbGV4LCB7fSxcclxuICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7XHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICBwYWRkaW5nOiAndmFyKC0taGFsZi1ndXR0ZXIsIDE1cHgpJyxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSxcclxuICAgICAgICAgICAgICAgICAgcHJvcHMudCgnQ2hhbmdpbmcgeW91ciBsb2FkIG9yZGVyJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LFxyXG4gICAgICAgICAgICAgICAgICBwcm9wcy50KCdEcmFnIGFuZCBkcm9wIHRoZSBtb2RzIG9uIHRoZSBsZWZ0IHRvIHJlb3JkZXIgdGhlbS4gS2luZ2RvbSBDb21lOiBEZWxpdmVyYW5jZSB1c2VzIGEgbW9kX29yZGVyLnR4dCBmaWxlICdcclxuICAgICAgICAgICAgICAgICAgICAgICsgJ3RvIGRlZmluZSB0aGUgb3JkZXIgaW4gd2hpY2ggbW9kcyBhcmUgbG9hZGVkLCBWb3J0ZXggd2lsbCB3cml0ZSB0aGUgZm9sZGVyIG5hbWVzIG9mIHRoZSBkaXNwbGF5ZWQgJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgKyAnbW9kcyBpbiB0aGUgb3JkZXIgeW91IGhhdmUgc2V0LiAnXHJcbiAgICAgICAgICAgICAgICAgICAgICArICdNb2RzIHBsYWNlZCBhdCB0aGUgYm90dG9tIG9mIHRoZSBsb2FkIG9yZGVyIHdpbGwgaGF2ZSBwcmlvcml0eSBvdmVyIHRob3NlIGFib3ZlIHRoZW0uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxyXG4gICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sXHJcbiAgICAgICAgICAgICAgICAgIHByb3BzLnQoJ05vdGU6IFZvcnRleCB3aWxsIGRldGVjdCBtYW51YWxseSBhZGRlZCBtb2RzIGFzIGxvbmcgYXMgdGhlc2UgaGF2ZSBiZWVuIGFkZGVkIHRvIHRoZSBtb2Rfb3JkZXIudHh0IGZpbGUuICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyAnTWFudWFsbHkgYWRkZWQgbW9kcyBhcmUgbm90IG1hbmFnZWQgYnkgVm9ydGV4IC0gdG8gcmVtb3ZlIHRoZXNlLCB5b3Ugd2lsbCBoYXZlIHRvICdcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyAnbWFudWFsbHkgZXJhc2UgdGhlIGVudHJ5IGZyb20gdGhlIG1vZF9vcmRlci50eHQgZmlsZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXHJcbiAgICAgICAgICAgICAgKSlcclxuICAgICAgICApKSkpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbW9kc1BhdGgoKSB7XHJcbiAgcmV0dXJuICdNb2RzJztcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0TmV3T3JkZXIocHJvcHMsIG9yZGVyZWQpIHtcclxuICBjb25zdCB7IGNvbnRleHQsIHByb2ZpbGUsIG9uU2V0T3JkZXIgfSA9IHByb3BzO1xyXG4gIGlmIChwcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBOb3Qgc3VyZSBob3cgd2UgZ290IGhlcmUgd2l0aG91dCBhIHZhbGlkIHByb2ZpbGUuXHJcbiAgICAvLyAgcG9zc2libHkgdGhlIHVzZXIgY2hhbmdlZCBwcm9maWxlIGR1cmluZyB0aGUgc2V0dXAvcHJlcGFyYXRpb25cclxuICAgIC8vICBzdGFnZSA/IGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvNzA1M1xyXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gc2V0IG5ldyBsb2FkIG9yZGVyJywgJ3VuZGVmaW5lZCBwcm9maWxlJyk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvLyBXZSBmaWx0ZXIgdGhlIG9yZGVyZWQgbGlzdCBqdXN0IGluIGNhc2UgdGhlcmUncyBhbiBlbXB0eVxyXG4gIC8vICBlbnRyeSwgd2hpY2ggaXMgcG9zc2libGUgaWYgdGhlIHVzZXJzIGhhZCBtYW51YWxseSBhZGRlZFxyXG4gIC8vICBlbXB0eSBsaW5lcyBpbiB0aGUgbG9hZCBvcmRlciBmaWxlLlxyXG4gIGNvbnN0IGZpbHRlcmVkID0gb3JkZXJlZC5maWx0ZXIoZW50cnkgPT4gISFlbnRyeSk7XHJcbiAgX01PRFNfU1RBVEUuZGlzcGxheSA9IGZpbHRlcmVkO1xyXG5cclxuICByZXR1cm4gKCEhb25TZXRPcmRlcilcclxuICAgID8gb25TZXRPcmRlcihwcm9maWxlLmlkLCBmaWx0ZXJlZClcclxuICAgIDogY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZS5pZCwgZmlsdGVyZWQpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gd3JpdGVPcmRlckZpbGUoZmlsZVBhdGgsIG1vZExpc3QpIHtcclxuICByZXR1cm4gZnMucmVtb3ZlQXN5bmMoZmlsZVBhdGgpXHJcbiAgICAuY2F0Y2goZXJyID0+IGVyci5jb2RlID09PSAnRU5PRU5UJyA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcclxuICAgIC50aGVuKCgpID0+IGZzLmVuc3VyZUZpbGVBc3luYyhmaWxlUGF0aCkpXHJcbiAgICAudGhlbigoKSA9PiBmcy53cml0ZUZpbGVBc3luYyhmaWxlUGF0aCwgbW9kTGlzdC5qb2luKCdcXG4nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xyXG4gICAgaWQ6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnS2luZ2RvbSBDb21lOlxcdERlbGl2ZXJhbmNlJyxcclxuICAgIG1lcmdlTW9kczogbW9kID0+IHRyYW5zZm9ybUlkKG1vZC5pZCksXHJcbiAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiAoZGlzY292ZXJlZFBhdGgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBlcGljUGF0aCA9IHBhdGguam9pbignQmluJywgJ1dpbjY0TWFzdGVyTWFzdGVyRXBpY1BHTycsICdLaW5nZG9tQ29tZS5leGUnKVxyXG4gICAgICAgIGZzLnN0YXRTeW5jKHBhdGguam9pbihkaXNjb3ZlcmVkUGF0aCwgZXBpY1BhdGgpKTtcclxuICAgICAgICByZXR1cm4gZXBpY1BhdGg7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBwYXRoLmpvaW4oJ0JpbicsICdXaW42NCcsICdLaW5nZG9tQ29tZS5leGUnKTtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgJ0RhdGEvTGV2ZWxzL3JhdGFqZS9sZXZlbC5wYWsnLFxyXG4gICAgXSxcclxuICAgIHNldHVwOiAoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpLFxyXG4gICAgLy9yZXF1aXJlc0NsZWFudXA6IHRydWUsIC8vIFRoZW9yZXRpY2FsbHkgbm90IG5lZWRlZCwgYXMgd2UgbG9vayBmb3Igc2V2ZXJhbCBmaWxlIGV4dGVuc2lvbnMgd2hlblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICBjaGVja2luZyB3aGV0aGVyIGEgbW9kIGlzIHZhbGlkIG9yIG5vdC4gVGhpcyBtYXkgY2hhbmdlLlxyXG4gICAgcmVxdWlyZXNMYXVuY2hlcjogKCkgPT4gdXRpbC5lcGljR2FtZXNMYXVuY2hlci5pc0dhbWVJbnN0YWxsZWQoJ0VlbCcpXHJcbiAgICAgIC50aGVuKGVwaWMgPT4gZXBpY1xyXG4gICAgICAgID8geyBsYXVuY2hlcjogJ2VwaWMnLCBhZGRJbmZvOiAnRWVsJyB9XHJcbiAgICAgICAgOiB1bmRlZmluZWQpLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fQVBQSUQsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fQVBQSUQsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWFpblBhZ2UoJ3NvcnQtbm9uZScsICdMb2FkIE9yZGVyJywgTG9hZE9yZGVyLCB7XHJcbiAgICBpZDogJ2tjZC1sb2FkLW9yZGVyJyxcclxuICAgIGhvdGtleTogJ0UnLFxyXG4gICAgZ3JvdXA6ICdwZXItZ2FtZScsXHJcbiAgICB2aXNpYmxlOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxyXG4gICAgcHJvcHM6ICgpID0+ICh7XHJcbiAgICAgIHQ6IGNvbnRleHQuYXBpLnRyYW5zbGF0ZSxcclxuICAgIH0pLFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0Lm9wdGlvbmFsLnJlZ2lzdGVyQ29sbGVjdGlvbkZlYXR1cmUoXHJcbiAgICAna2NkX2NvbGxlY3Rpb25fZGF0YScsXHJcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGluY2x1ZGVkTW9kczogc3RyaW5nW10pID0+XHJcbiAgICAgIGdlbkNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGluY2x1ZGVkTW9kcyksXHJcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGNvbGxlY3Rpb246IElLQ0RDb2xsZWN0aW9uc0RhdGEpID0+XHJcbiAgICAgIHBhcnNlQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgY29sbGVjdGlvbiksXHJcbiAgICAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSxcclxuICAgICh0KSA9PiB0KCdLaW5nZG9tIENvbWU6IERlbGl2ZXJhbmNlIERhdGEnKSxcclxuICAgIChzdGF0ZTogdHlwZXMuSVN0YXRlLCBnYW1lSWQ6IHN0cmluZykgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgQ29sbGVjdGlvbnNEYXRhVmlldyxcclxuICApO1xyXG5cclxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdtb2QtZW5hYmxlZCcsIChwcm9maWxlSWQsIG1vZElkKSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBwcm9maWxlID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAncHJvZmlsZXMnLCBwcm9maWxlSWRdLCB1bmRlZmluZWQpO1xyXG4gICAgICBpZiAoISFwcm9maWxlICYmIChwcm9maWxlLmdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKF9NT0RTX1NUQVRFLmRpc3BsYXkuaW5kZXhPZihtb2RJZCkgPT09IC0xKSkge1xyXG4gICAgICAgIHJlZnJlc2hNb2RMaXN0KGNvbnRleHQsIGRpc2NvdmVyeS5wYXRoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdwdXJnZS1tb2RzJywgKCkgPT4ge1xyXG4gICAgICBjb25zdCBzdG9yZSA9IGNvbnRleHQuYXBpLnN0b3JlO1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IHN0b3JlLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgICAgIGlmIChwcm9maWxlID09PSB1bmRlZmluZWQgfHwgcHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpe1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcclxuICAgICAgaWYgKChkaXNjb3ZlcnkgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeS5wYXRoID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlbiBhbmQgaWYgaXQgZG9lcyBpdCB3aWxsIGNhdXNlIGVycm9ycyBlbHNld2hlcmUgYXMgd2VsbFxyXG4gICAgICAgIGxvZygnZXJyb3InLCAna2luZ2RvbWNvbWVkZWxpdmVyYW5jZSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG1vZHNPcmRlckZpbGVQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBtb2RzUGF0aCgpLCBNT0RTX09SREVSX0ZJTEVOQU1FKTtcclxuICAgICAgY29uc3QgbWFuYWdlZE1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgICAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1hbmFnZWRNb2RzKTtcclxuICAgICAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XHJcbiAgICAgIGNvbnN0IGVuYWJsZWQgPSBtb2RLZXlzLmZpbHRlcihtb2QgPT4gISFtb2RTdGF0ZVttb2RdICYmIG1vZFN0YXRlW21vZF0uZW5hYmxlZCk7XHJcbiAgICAgIGNvbnN0IGRpc2FibGVkID0gbW9kS2V5cy5maWx0ZXIoZGlzID0+ICFlbmFibGVkLmluY2x1ZGVzKGRpcykpO1xyXG4gICAgICBnZXRNYW51YWxseUFkZGVkTW9kcyhkaXNhYmxlZCwgZW5hYmxlZCwgbW9kc09yZGVyRmlsZVBhdGgsIGNvbnRleHQuYXBpKVxyXG4gICAgICAgIC50aGVuKG1hbnVhbGx5QWRkZWQgPT4ge1xyXG4gICAgICAgICAgd3JpdGVPcmRlckZpbGUobW9kc09yZGVyRmlsZVBhdGgsIG1hbnVhbGx5QWRkZWQpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHNldE5ld09yZGVyKHsgY29udGV4dCwgcHJvZmlsZSB9LCBtYW51YWxseUFkZGVkKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgIGNvbnN0IHVzZXJDYW5jZWxlZCA9IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCk7XHJcbiAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZS1pbnN0YXRlIG1hbnVhbGx5IGFkZGVkIG1vZHMnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6ICF1c2VyQ2FuY2VsZWQgfSlcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCAocHJvZmlsZUlkLCBkZXBsb3ltZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcclxuICAgICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCB8fCBwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG5cclxuICAgICAgICBpZiAocHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICBsb2coJ2Vycm9yJywgJ3Byb2ZpbGUgZG9lcyBub3QgZXhpc3QnLCBwcm9maWxlSWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcbiAgICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgcHJvZmlsZS5nYW1lSWRdLCB1bmRlZmluZWQpO1xyXG5cclxuICAgICAgaWYgKChkaXNjb3ZlcnkgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeS5wYXRoID09PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlbiBhbmQgaWYgaXQgZG9lcyBpdCB3aWxsIGNhdXNlIGVycm9ycyBlbHNld2hlcmUgYXMgd2VsbFxyXG4gICAgICAgIGxvZygnZXJyb3InLCAna2luZ2RvbWNvbWVkZWxpdmVyYW5jZSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IG1vZHNGb2xkZXIgPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG1vZHNQYXRoKCkpO1xyXG4gICAgICBjb25zdCBtb2RPcmRlckZpbGUgPSBwYXRoLmpvaW4obW9kc0ZvbGRlciwgTU9EU19PUkRFUl9GSUxFTkFNRSk7XHJcblxyXG4gICAgICByZXR1cm4gcmVmcmVzaE1vZExpc3QoY29udGV4dCwgZGlzY292ZXJ5LnBhdGgpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgbGV0IG1pc3NpbmcgPSBsb2FkT3JkZXJcclxuICAgICAgICAgICAgLmZpbHRlcihtb2QgPT4gIWxpc3RIYXNNb2QodHJhbnNmb3JtSWQobW9kKSwgX01PRFNfU1RBVEUuZW5hYmxlZClcclxuICAgICAgICAgICAgICAgICAgICAgICAgJiYgIWxpc3RIYXNNb2QodHJhbnNmb3JtSWQobW9kKSwgX01PRFNfU1RBVEUuZGlzYWJsZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIGxpc3RIYXNNb2QodHJhbnNmb3JtSWQobW9kKSwgX01PRFNfU1RBVEUuZGlzcGxheSkpXHJcbiAgICAgICAgICAgIC5tYXAobW9kID0+IHRyYW5zZm9ybUlkKG1vZCkpIHx8IFtdO1xyXG5cclxuICAgICAgICAgIC8vIFRoaXMgaXMgdGhlb3JldGljYWxseSB1bmVjZXNzYXJ5IC0gYnV0IGl0IHdpbGwgZW5zdXJlIG5vIGR1cGxpY2F0ZXNcclxuICAgICAgICAgIC8vICBhcmUgYWRkZWQuXHJcbiAgICAgICAgICBtaXNzaW5nID0gWyAuLi5uZXcgU2V0KG1pc3NpbmcpIF07XHJcbiAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IFsgLi4uX01PRFNfU1RBVEUuZW5hYmxlZCwgLi4ubWlzc2luZyBdO1xyXG4gICAgICAgICAgY29uc3QgbG9WYWx1ZSA9IChpbnB1dCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBpZHggPSBsb2FkT3JkZXIuaW5kZXhPZihpbnB1dCk7XHJcbiAgICAgICAgICAgIHJldHVybiBpZHggIT09IC0xID8gaWR4IDogbG9hZE9yZGVyLmxlbmd0aDtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBTb3J0XHJcbiAgICAgICAgICBsZXQgc29ydGVkID0gdHJhbnNmb3JtZWQubGVuZ3RoID4gMVxyXG4gICAgICAgICAgICA/IHRyYW5zZm9ybWVkLnNvcnQoKGxocywgcmhzKSA9PiBsb1ZhbHVlKGxocykgLSBsb1ZhbHVlKHJocykpXHJcbiAgICAgICAgICAgIDogdHJhbnNmb3JtZWQ7XHJcblxyXG4gICAgICAgICAgc2V0TmV3T3JkZXIoeyBjb250ZXh0LCBwcm9maWxlIH0sIHNvcnRlZCk7XHJcbiAgICAgICAgICByZXR1cm4gd3JpdGVPcmRlckZpbGUobW9kT3JkZXJGaWxlLCB0cmFuc2Zvcm1lZClcclxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcclxuICAgICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSB0byBsb2FkIG9yZGVyIGZpbGUnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6ICF1c2VyQ2FuY2VsZWQgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZSkge1xyXG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gcHJvZmlsZT8uaWQgfHwgJyc7XHJcbiAgY29uc3QgZ2FtZUlkID0gcHJvZmlsZT8uZ2FtZUlkIHx8ICcnO1xyXG4gIHJldHVybiB7XHJcbiAgICBwcm9maWxlLFxyXG4gICAgbW9kU3RhdGU6IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KSxcclxuICAgIG1vZHM6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBnYW1lSWRdLCBbXSksXHJcbiAgICBvcmRlcjogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgW10pLFxyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCkge1xyXG4gIHJldHVybiB7XHJcbiAgICBvblNldERlcGxveW1lbnROZWNlc3Nhcnk6IChnYW1lSWQsIG5lY2Vzc2FyeSkgPT4gZGlzcGF0Y2goYWN0aW9ucy5zZXREZXBsb3ltZW50TmVjZXNzYXJ5KGdhbWVJZCwgbmVjZXNzYXJ5KSksXHJcbiAgICBvblNldE9yZGVyOiAocHJvZmlsZUlkLCBvcmRlcmVkKSA9PiBkaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIG9yZGVyZWQpKSxcclxuICB9O1xyXG59XHJcblxyXG5jb25zdCBMb2FkT3JkZXIgPSBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShMb2FkT3JkZXJCYXNlKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIGRlZmF1bHQ6IG1haW4sXHJcbn07XHJcbiJdfQ==