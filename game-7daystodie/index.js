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
const path_1 = __importDefault(require("path"));
const react_redux_1 = require("react-redux");
const redux_act_1 = require("redux-act");
const vortex_api_1 = require("vortex-api");
const React = __importStar(require("react"));
const common_1 = require("./common");
const loadOrder_1 = require("./loadOrder");
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const STEAM_ID = '251570';
const STEAM_DLL = 'steamclient64.dll';
const ROOT_MOD_CANDIDATES = ['bepinex'];
const setPrefixOffset = (0, redux_act_1.createAction)('7DTD_SET_PREFIX_OFFSET', (profile, offset) => ({ profile, offset }));
const setUDF = (0, redux_act_1.createAction)('7DTD_SET_UDF', (udf) => ({ udf }));
const reducer = {
    reducers: {
        [setPrefixOffset]: (state, payload) => {
            const { profile, offset } = payload;
            return vortex_api_1.util.setSafe(state, ['prefixOffset', profile], offset);
        },
        [setUDF]: (state, payload) => {
            const { udf } = payload;
            return vortex_api_1.util.setSafe(state, ['udf'], udf);
        },
    },
    defaults: {},
};
function resetPrefixOffset(api) {
    var _a;
    const state = api.getState();
    const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
    if (profileId === undefined) {
        api.showErrorNotification('No active profile for 7dtd', undefined, { allowReport: false });
        return;
    }
    api.store.dispatch(setPrefixOffset(profileId, 0));
    const loadOrder = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
    const newLO = loadOrder.map((entry, idx) => (Object.assign(Object.assign({}, entry), { data: {
            prefix: (0, util_1.makePrefix)(idx),
        } })));
    api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, newLO));
}
function setPrefixOffsetDialog(api) {
    return api.showDialog('question', 'Set New Prefix Offset', {
        text: api.translate('Insert new prefix offset for modlets (AAA-ZZZ):'),
        input: [
            {
                id: '7dtdprefixoffsetinput',
                label: 'Prefix Offset',
                type: 'text',
                placeholder: 'AAA',
            }
        ],
    }, [{ label: 'Cancel' }, { label: 'Set', default: true }])
        .then(result => {
        var _a;
        if (result.action === 'Set') {
            const prefix = result.input['7dtdprefixoffsetinput'];
            let offset = 0;
            try {
                offset = (0, util_1.reversePrefix)(prefix);
            }
            catch (err) {
                return Promise.reject(err);
            }
            const state = api.getState();
            const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
            if (profileId === undefined) {
                api.showErrorNotification('No active profile for 7dtd', undefined, { allowReport: false });
                return;
            }
            api.store.dispatch(setPrefixOffset(profileId, offset));
            const loadOrder = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
            const newLO = loadOrder.map(entry => (Object.assign(Object.assign({}, entry), { data: {
                    prefix: (0, util_1.makePrefix)((0, util_1.reversePrefix)(entry.data.prefix) + offset),
                } })));
            api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, newLO));
        }
        return Promise.resolve();
    })
        .catch(err => {
        api.showErrorNotification('Failed to set prefix offset', err, { allowReport: false });
        return Promise.resolve();
    });
}
function findGame() {
    return __awaiter(this, void 0, void 0, function* () {
        return vortex_api_1.util.GameStoreHelper.findByAppId([STEAM_ID])
            .then(game => game.gamePath);
    });
}
function parseAdditionalParameters(parameters) {
    var _a, _b;
    const udfParam = parameters.split('-').find(param => param.startsWith('UserDataFolder='));
    const udf = udfParam ? (_b = (_a = udfParam.split('=')) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trimEnd() : undefined;
    return (udf && path_1.default.isAbsolute(udf)) ? udf : undefined;
}
function prepareForModding(context, discovery) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const requiresRestart = vortex_api_1.util.getSafe(context.api.getState(), ['settings', '7daystodie', 'udf'], undefined) === undefined;
        const launcherSettings = (0, common_1.launcherSettingsFilePath)();
        const relaunchExt = () => {
            return context.api.showDialog('info', 'Restart Required', {
                text: 'The extension requires a restart to complete the UDF setup. '
                    + 'The extension will now exit - please re-activate it via the games page or dashboard.',
            }, [{ label: 'Restart Extension' }])
                .then(() => {
                return Promise.reject(new vortex_api_1.util.ProcessCanceled('Restart required'));
            });
        };
        const selectUDF = () => __awaiter(this, void 0, void 0, function* () {
            const res = yield context.api.showDialog('info', 'Choose User Defined Folder', {
                text: 'The modding pattern for 7DTD is changing. The Mods path inside the game directory '
                    + 'is being deprecated and mods located in the old path will no longer work in the near '
                    + 'future. Please select your User Defined Folder (UDF) - Vortex will deploy to this new location.',
            }, [
                { label: 'Cancel' },
                { label: 'Select UDF' },
            ]);
            if (res.action !== 'Select UDF') {
                return Promise.reject(new vortex_api_1.util.ProcessCanceled('Cannot proceed without UFD'));
            }
            yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(launcherSettings));
            yield (0, util_1.ensureLOFile)(context);
            const directory = yield context.api.selectDir({
                title: 'Select User Data Folder',
                defaultPath: path_1.default.join(path_1.default.dirname(launcherSettings)),
            });
            if (!directory) {
                return Promise.reject(new vortex_api_1.util.ProcessCanceled('Cannot proceed without UFD'));
            }
            yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(directory, 'Mods'));
            const launcher = common_1.DEFAULT_LAUNCHER_SETTINGS;
            launcher.DefaultRunConfig.AdditionalParameters = `-UserDataFolder=${directory}`;
            const launcherData = JSON.stringify(launcher, null, 2);
            yield vortex_api_1.fs.writeFileAsync(launcherSettings, launcherData, { encoding: 'utf8' });
            context.api.store.dispatch(setUDF(directory));
            return (requiresRestart) ? relaunchExt() : Promise.resolve();
        });
        try {
            const data = yield vortex_api_1.fs.readFileAsync(launcherSettings, { encoding: 'utf8' });
            const settings = JSON.parse(data);
            if (((_a = settings === null || settings === void 0 ? void 0 : settings.DefaultRunConfig) === null || _a === void 0 ? void 0 : _a.AdditionalParameters) !== undefined) {
                const udf = parseAdditionalParameters(settings.DefaultRunConfig.AdditionalParameters);
                if (!!udf) {
                    yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(udf, 'Mods'));
                    yield (0, util_1.ensureLOFile)(context);
                    context.api.store.dispatch(setUDF(udf));
                    return (requiresRestart) ? relaunchExt() : Promise.resolve();
                }
                else {
                    return selectUDF();
                }
            }
        }
        catch (err) {
            return selectUDF();
        }
    });
}
function installContent(files, destinationPath, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const modFile = files.find(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO);
        const rootPath = path_1.default.dirname(modFile);
        return (0, util_1.getModName)(path_1.default.join(destinationPath, modFile))
            .then(modName => {
            modName = modName.replace(/[^a-zA-Z0-9]/g, '');
            const filtered = files.filter(filePath => filePath.startsWith(rootPath) && !filePath.endsWith(path_1.default.sep));
            const instructions = filtered.map(filePath => {
                return {
                    type: 'copy',
                    source: filePath,
                    destination: path_1.default.relative(rootPath, filePath),
                };
            });
            return Promise.resolve({ instructions });
        });
    });
}
function testSupportedContent(files, gameId) {
    const supported = (gameId === common_1.GAME_ID) &&
        (files.find(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO) !== undefined);
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
function findCandFile(files) {
    return files.find(file => file.toLowerCase().split(path_1.default.sep)
        .find(seg => ROOT_MOD_CANDIDATES.includes(seg)) !== undefined);
}
function hasCandidate(files) {
    const candidate = findCandFile(files);
    return candidate !== undefined;
}
function installRootMod(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const filtered = files.filter(file => !file.endsWith(path_1.default.sep));
        const candidate = findCandFile(files);
        const candIdx = candidate.toLowerCase().split(path_1.default.sep)
            .findIndex(seg => ROOT_MOD_CANDIDATES.includes(seg));
        const instructions = filtered.reduce((accum, iter) => {
            accum.push({
                type: 'copy',
                source: iter,
                destination: iter.split(path_1.default.sep).slice(candIdx).join(path_1.default.sep),
            });
            return accum;
        }, []);
        return Promise.resolve({ instructions });
    });
}
function testRootMod(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve({
            requiredFiles: [],
            supported: hasCandidate(files) && gameId === common_1.GAME_ID,
        });
    });
}
function toLOPrefix(context, mod) {
    var _a;
    const props = (0, util_1.genProps)(context);
    if (props === undefined) {
        return 'ZZZZ-' + mod.id;
    }
    const loadOrder = vortex_api_1.util.getSafe(props.state, ['persistent', 'loadOrder', props.profile.id], []);
    const loEntry = loadOrder.find(loEntry => loEntry.id === mod.id);
    return (((_a = loEntry === null || loEntry === void 0 ? void 0 : loEntry.data) === null || _a === void 0 ? void 0 : _a.prefix) !== undefined)
        ? loEntry.data.prefix + '-' + mod.id
        : 'ZZZZ-' + mod.id;
}
function requiresLauncher(gamePath) {
    return vortex_api_1.fs.readdirAsync(gamePath)
        .then(files => (files.find(file => file.endsWith(STEAM_DLL)) !== undefined)
        ? Promise.resolve({ launcher: 'steam' })
        : Promise.resolve(undefined))
        .catch(err => Promise.reject(err));
}
function InfoPanel(props) {
    const { t, currentOffset } = props;
    return (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', padding: '16px' } },
        React.createElement("div", { style: { display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' } },
            t('Current Prefix Offset: '),
            React.createElement("hr", null),
            React.createElement("label", { style: { color: 'red' } }, currentOffset)),
        React.createElement("hr", null),
        React.createElement("div", null, t('7 Days to Die loads mods in alphabetic order so Vortex prefixes '
            + 'the directory names with "AAA, AAB, AAC, ..." to ensure they load in the order you set here.'))));
}
function InfoPanelWrap(props) {
    const { api, profileId } = props;
    const currentOffset = (0, react_redux_1.useSelector)((state) => (0, util_1.makePrefix)(vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'prefixOffset', profileId], 0)));
    return (React.createElement(InfoPanel, { t: api.translate, currentOffset: currentOffset }));
}
function main(context) {
    context.registerReducer(['settings', '7daystodie'], reducer);
    const getModsPath = () => {
        const state = context.api.getState();
        const udf = vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'udf'], undefined);
        return udf !== undefined ? path_1.default.join(udf, 'Mods') : 'Mods';
    };
    context.registerGame({
        id: common_1.GAME_ID,
        name: '7 Days to Die',
        mergeMods: (mod) => toLOPrefix(context, mod),
        queryPath: (0, util_1.toBlue)(findGame),
        requiresCleanup: true,
        supportedTools: [],
        queryModPath: getModsPath,
        logo: 'gameart.jpg',
        executable: common_1.gameExecutable,
        requiredFiles: [
            (0, common_1.gameExecutable)(),
        ],
        requiresLauncher,
        setup: (0, util_1.toBlue)((discovery) => prepareForModding(context, discovery)),
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
            hashFiles: ['7DaysToDie_Data/Managed/Assembly-CSharp.dll'],
        },
    });
    context.registerLoadOrder({
        deserializeLoadOrder: () => (0, loadOrder_1.deserialize)(context),
        serializeLoadOrder: (loadOrder) => (0, loadOrder_1.serialize)(context, loadOrder),
        validate: loadOrder_1.validate,
        gameId: common_1.GAME_ID,
        toggleableEntries: false,
        usageInstructions: (() => {
            var _a;
            const state = context.api.getState();
            const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
            if (profileId === undefined) {
                return null;
            }
            return (React.createElement(InfoPanelWrap, { api: context.api, profileId: profileId }));
        }),
    });
    context.registerAction('fb-load-order-icons', 150, 'loot-sort', {}, 'Prefix Offset Assign', () => {
        setPrefixOffsetDialog(context.api);
    }, () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    context.registerAction('fb-load-order-icons', 150, 'loot-sort', {}, 'Prefix Offset Reset', () => {
        resetPrefixOffset(context.api);
    }, () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    const getOverhaulPath = (game) => {
        const state = context.api.getState();
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        return discovery === null || discovery === void 0 ? void 0 : discovery.path;
    };
    context.registerInstaller('7dtd-mod', 25, (0, util_1.toBlue)(testSupportedContent), (0, util_1.toBlue)(installContent));
    context.registerInstaller('7dtd-root-mod', 20, (0, util_1.toBlue)(testRootMod), (0, util_1.toBlue)(installRootMod));
    context.registerModType('7dtd-root-mod', 20, (gameId) => gameId === common_1.GAME_ID, getOverhaulPath, (instructions) => {
        const candidateFound = hasCandidate(instructions
            .filter(instr => !!instr.destination)
            .map(instr => instr.destination));
        return Promise.resolve(candidateFound);
    }, { name: 'Root Directory Mod', mergeMods: true, deploymentEssential: false });
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate020)(context.api, old)));
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate100)(context, old)));
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate1011)(context, old)));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDZDQUEwQztBQUMxQyx5Q0FBeUM7QUFDekMsMkNBQXNFO0FBRXRFLDZDQUErQjtBQUUvQixxQ0FBa0g7QUFDbEgsMkNBQStEO0FBQy9ELDZDQUFtRTtBQUVuRSxpQ0FBK0Y7QUFFL0YsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzFCLE1BQU0sU0FBUyxHQUFHLG1CQUFtQixDQUFDO0FBRXRDLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUV4QyxNQUFNLGVBQWUsR0FBRyxJQUFBLHdCQUFZLEVBQUMsd0JBQXdCLEVBQzNELENBQUMsT0FBZSxFQUFFLE1BQWMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFOUQsTUFBTSxNQUFNLEdBQUcsSUFBQSx3QkFBWSxFQUFDLGNBQWMsRUFDeEMsQ0FBQyxHQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFOUIsTUFBTSxPQUFPLEdBQXVCO0lBQ2xDLFFBQVEsRUFBRTtRQUNSLENBQUMsZUFBc0IsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQzNDLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDO1lBQ3BDLE9BQU8saUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFDRCxDQUFDLE1BQWEsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ2xDLE1BQU0sRUFB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dGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCB7IGNyZWF0ZUFjdGlvbiB9IGZyb20gJ3JlZHV4LWFjdCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIGdhbWVFeGVjdXRhYmxlLCBNT0RfSU5GTywgbGF1bmNoZXJTZXR0aW5nc0ZpbGVQYXRoLCBERUZBVUxUX0xBVU5DSEVSX1NFVFRJTkdTIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBkZXNlcmlhbGl6ZSwgc2VyaWFsaXplLCB2YWxpZGF0ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcclxuaW1wb3J0IHsgbWlncmF0ZTAyMCwgbWlncmF0ZTEwMCwgbWlncmF0ZTEwMTEgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBlbnN1cmVMT0ZpbGUsIGdlblByb3BzLCBnZXRNb2ROYW1lLCBtYWtlUHJlZml4LCByZXZlcnNlUHJlZml4LCB0b0JsdWUgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuY29uc3QgU1RFQU1fSUQgPSAnMjUxNTcwJztcclxuY29uc3QgU1RFQU1fRExMID0gJ3N0ZWFtY2xpZW50NjQuZGxsJztcclxuXHJcbmNvbnN0IFJPT1RfTU9EX0NBTkRJREFURVMgPSBbJ2JlcGluZXgnXTtcclxuXHJcbmNvbnN0IHNldFByZWZpeE9mZnNldCA9IGNyZWF0ZUFjdGlvbignN0RURF9TRVRfUFJFRklYX09GRlNFVCcsXHJcbiAgKHByb2ZpbGU6IHN0cmluZywgb2Zmc2V0OiBudW1iZXIpID0+ICh7IHByb2ZpbGUsIG9mZnNldCB9KSk7XHJcblxyXG5jb25zdCBzZXRVREYgPSBjcmVhdGVBY3Rpb24oJzdEVERfU0VUX1VERicsXHJcbiAgKHVkZjogc3RyaW5nKSA9PiAoeyB1ZGYgfSkpO1xyXG5cclxuY29uc3QgcmVkdWNlcjogdHlwZXMuSVJlZHVjZXJTcGVjID0ge1xyXG4gIHJlZHVjZXJzOiB7XHJcbiAgICBbc2V0UHJlZml4T2Zmc2V0IGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xyXG4gICAgICBjb25zdCB7IHByb2ZpbGUsIG9mZnNldCB9ID0gcGF5bG9hZDtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWydwcmVmaXhPZmZzZXQnLCBwcm9maWxlXSwgb2Zmc2V0KTtcclxuICAgIH0sXHJcbiAgICBbc2V0VURGIGFzIGFueV06IChzdGF0ZSwgcGF5bG9hZCkgPT4ge1xyXG4gICAgICBjb25zdCB7IHVkZiB9ID0gcGF5bG9hZDtcclxuICAgICAgcmV0dXJuIHV0aWwuc2V0U2FmZShzdGF0ZSwgWyd1ZGYnXSwgdWRmKTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBkZWZhdWx0czoge30sXHJcbn07XHJcblxyXG5mdW5jdGlvbiByZXNldFByZWZpeE9mZnNldChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XHJcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBIb3cgP1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignTm8gYWN0aXZlIHByb2ZpbGUgZm9yIDdkdGQnLCB1bmRlZmluZWQsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByZWZpeE9mZnNldChwcm9maWxlSWQsIDApKTtcclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcbiAgY29uc3QgbmV3TE8gPSBsb2FkT3JkZXIubWFwKChlbnRyeSwgaWR4KSA9PiAoe1xyXG4gICAgLi4uZW50cnksXHJcbiAgICBkYXRhOiB7XHJcbiAgICAgIHByZWZpeDogbWFrZVByZWZpeChpZHgpLFxyXG4gICAgfSxcclxuICB9KSk7XHJcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgbmV3TE8pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0UHJlZml4T2Zmc2V0RGlhbG9nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2V0IE5ldyBQcmVmaXggT2Zmc2V0Jywge1xyXG4gICAgdGV4dDogYXBpLnRyYW5zbGF0ZSgnSW5zZXJ0IG5ldyBwcmVmaXggb2Zmc2V0IGZvciBtb2RsZXRzIChBQUEtWlpaKTonKSxcclxuICAgIGlucHV0OiBbXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJzdkdGRwcmVmaXhvZmZzZXRpbnB1dCcsXHJcbiAgICAgICAgbGFiZWw6ICdQcmVmaXggT2Zmc2V0JyxcclxuICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgcGxhY2Vob2xkZXI6ICdBQUEnLFxyXG4gICAgICB9XSxcclxuICB9LCBbIHsgbGFiZWw6ICdDYW5jZWwnIH0sIHsgbGFiZWw6ICdTZXQnLCBkZWZhdWx0OiB0cnVlIH0gXSlcclxuICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdTZXQnKSB7XHJcbiAgICAgIGNvbnN0IHByZWZpeCA9IHJlc3VsdC5pbnB1dFsnN2R0ZHByZWZpeG9mZnNldGlucHV0J107XHJcbiAgICAgIGxldCBvZmZzZXQgPSAwO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIG9mZnNldCA9IHJldmVyc2VQcmVmaXgocHJlZml4KTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuICAgICAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8gSG93ID9cclxuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdObyBhY3RpdmUgcHJvZmlsZSBmb3IgN2R0ZCcsIHVuZGVmaW5lZCwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UHJlZml4T2Zmc2V0KHByb2ZpbGVJZCwgb2Zmc2V0KSk7XHJcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuICAgICAgY29uc3QgbmV3TE8gPSBsb2FkT3JkZXIubWFwKGVudHJ5ID0+ICh7XHJcbiAgICAgICAgLi4uZW50cnksXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgcHJlZml4OiBtYWtlUHJlZml4KHJldmVyc2VQcmVmaXgoZW50cnkuZGF0YS5wcmVmaXgpICsgb2Zmc2V0KSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KSk7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIG5ld0xPKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfSlcclxuICAuY2F0Y2goZXJyID0+IHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzZXQgcHJlZml4IG9mZnNldCcsIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZpbmRHYW1lKCkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbU1RFQU1fSURdKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VBZGRpdGlvbmFsUGFyYW1ldGVycyhwYXJhbWV0ZXJzOiBzdHJpbmcpIHtcclxuICBjb25zdCB1ZGZQYXJhbSA9IHBhcmFtZXRlcnMuc3BsaXQoJy0nKS5maW5kKHBhcmFtID0+IHBhcmFtLnN0YXJ0c1dpdGgoJ1VzZXJEYXRhRm9sZGVyPScpKTtcclxuICBjb25zdCB1ZGYgPSB1ZGZQYXJhbSA/IHVkZlBhcmFtLnNwbGl0KCc9Jyk/LlsxXT8udHJpbUVuZCgpIDogdW5kZWZpbmVkO1xyXG4gIHJldHVybiAodWRmICYmIHBhdGguaXNBYnNvbHV0ZSh1ZGYpKSA/IHVkZiA6IHVuZGVmaW5lZDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xyXG4gIGNvbnN0IHJlcXVpcmVzUmVzdGFydCA9IHV0aWwuZ2V0U2FmZShjb250ZXh0LmFwaS5nZXRTdGF0ZSgpLFxyXG4gICAgWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJywgJ3VkZiddLCB1bmRlZmluZWQpID09PSB1bmRlZmluZWQ7XHJcbiAgY29uc3QgbGF1bmNoZXJTZXR0aW5ncyA9IGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCgpO1xyXG4gIGNvbnN0IHJlbGF1bmNoRXh0ID0gKCkgPT4ge1xyXG4gICAgcmV0dXJuIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnUmVzdGFydCBSZXF1aXJlZCcsIHtcclxuICAgICAgdGV4dDogJ1RoZSBleHRlbnNpb24gcmVxdWlyZXMgYSByZXN0YXJ0IHRvIGNvbXBsZXRlIHRoZSBVREYgc2V0dXAuICdcclxuICAgICAgICAgICsgJ1RoZSBleHRlbnNpb24gd2lsbCBub3cgZXhpdCAtIHBsZWFzZSByZS1hY3RpdmF0ZSBpdCB2aWEgdGhlIGdhbWVzIHBhZ2Ugb3IgZGFzaGJvYXJkLicsXHJcbiAgICB9LCBbIHsgbGFiZWw6ICdSZXN0YXJ0IEV4dGVuc2lvbicgfSBdKVxyXG4gICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdSZXN0YXJ0IHJlcXVpcmVkJykpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGNvbnN0IHNlbGVjdFVERiA9IGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnQ2hvb3NlIFVzZXIgRGVmaW5lZCBGb2xkZXInLCB7XHJcbiAgICAgIHRleHQ6ICdUaGUgbW9kZGluZyBwYXR0ZXJuIGZvciA3RFREIGlzIGNoYW5naW5nLiBUaGUgTW9kcyBwYXRoIGluc2lkZSB0aGUgZ2FtZSBkaXJlY3RvcnkgJ1xyXG4gICAgICAgICAgKyAnaXMgYmVpbmcgZGVwcmVjYXRlZCBhbmQgbW9kcyBsb2NhdGVkIGluIHRoZSBvbGQgcGF0aCB3aWxsIG5vIGxvbmdlciB3b3JrIGluIHRoZSBuZWFyICdcclxuICAgICAgICAgICsgJ2Z1dHVyZS4gUGxlYXNlIHNlbGVjdCB5b3VyIFVzZXIgRGVmaW5lZCBGb2xkZXIgKFVERikgLSBWb3J0ZXggd2lsbCBkZXBsb3kgdG8gdGhpcyBuZXcgbG9jYXRpb24uJyxcclxuICAgIH0sXHJcbiAgICBbXHJcbiAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdTZWxlY3QgVURGJyB9LFxyXG4gICAgXSk7XHJcbiAgICBpZiAocmVzLmFjdGlvbiAhPT0gJ1NlbGVjdCBVREYnKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0Nhbm5vdCBwcm9jZWVkIHdpdGhvdXQgVUZEJykpO1xyXG4gICAgfVxyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUobGF1bmNoZXJTZXR0aW5ncykpO1xyXG4gICAgYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQpO1xyXG4gICAgY29uc3QgZGlyZWN0b3J5ID0gYXdhaXQgY29udGV4dC5hcGkuc2VsZWN0RGlyKHtcclxuICAgICAgdGl0bGU6ICdTZWxlY3QgVXNlciBEYXRhIEZvbGRlcicsXHJcbiAgICAgIGRlZmF1bHRQYXRoOiBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGxhdW5jaGVyU2V0dGluZ3MpKSxcclxuICAgIH0pO1xyXG4gICAgaWYgKCFkaXJlY3RvcnkpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQ2Fubm90IHByb2NlZWQgd2l0aG91dCBVRkQnKSk7XHJcbiAgICB9XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXJlY3RvcnksICdNb2RzJykpO1xyXG4gICAgY29uc3QgbGF1bmNoZXIgPSBERUZBVUxUX0xBVU5DSEVSX1NFVFRJTkdTO1xyXG4gICAgbGF1bmNoZXIuRGVmYXVsdFJ1bkNvbmZpZy5BZGRpdGlvbmFsUGFyYW1ldGVycyA9IGAtVXNlckRhdGFGb2xkZXI9JHtkaXJlY3Rvcnl9YDtcclxuICAgIGNvbnN0IGxhdW5jaGVyRGF0YSA9IEpTT04uc3RyaW5naWZ5KGxhdW5jaGVyLCBudWxsLCAyKTtcclxuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxhdW5jaGVyU2V0dGluZ3MsIGxhdW5jaGVyRGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0VURGKGRpcmVjdG9yeSkpO1xyXG4gICAgcmV0dXJuIChyZXF1aXJlc1Jlc3RhcnQpID8gcmVsYXVuY2hFeHQoKSA6IFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH07XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsYXVuY2hlclNldHRpbmdzLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb25zdCBzZXR0aW5ncyA9IEpTT04ucGFyc2UoZGF0YSk7XHJcbiAgICBpZiAoc2V0dGluZ3M/LkRlZmF1bHRSdW5Db25maWc/LkFkZGl0aW9uYWxQYXJhbWV0ZXJzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc3QgdWRmID0gcGFyc2VBZGRpdGlvbmFsUGFyYW1ldGVycyhzZXR0aW5ncy5EZWZhdWx0UnVuQ29uZmlnLkFkZGl0aW9uYWxQYXJhbWV0ZXJzKTtcclxuICAgICAgaWYgKCEhdWRmKSB7XHJcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4odWRmLCAnTW9kcycpKTtcclxuICAgICAgICBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0VURGKHVkZikpO1xyXG4gICAgICAgIHJldHVybiAocmVxdWlyZXNSZXN0YXJ0KSA/IHJlbGF1bmNoRXh0KCkgOiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gc2VsZWN0VURGKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBzZWxlY3RVREYoKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xyXG4gIC8vIFRoZSBtb2RpbmZvLnhtbCBmaWxlIGlzIGV4cGVjdGVkIHRvIGFsd2F5cyBiZSBwb3NpdGlvbmVkIGluIHRoZSByb290IGRpcmVjdG9yeVxyXG4gIC8vICBvZiB0aGUgbW9kIGl0c2VsZjsgd2UncmUgZ29pbmcgdG8gZGlzcmVnYXJkIGFueXRoaW5nIHBsYWNlZCBvdXRzaWRlIHRoZSByb290LlxyXG4gIGNvbnN0IG1vZEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfSU5GTyk7XHJcbiAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmRpcm5hbWUobW9kRmlsZSk7XHJcbiAgcmV0dXJuIGdldE1vZE5hbWUocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kRmlsZSkpXHJcbiAgICAudGhlbihtb2ROYW1lID0+IHtcclxuICAgICAgbW9kTmFtZSA9IG1vZE5hbWUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICcnKTtcclxuXHJcbiAgICAgIC8vIFJlbW92ZSBkaXJlY3RvcmllcyBhbmQgYW55dGhpbmcgdGhhdCBpc24ndCBpbiB0aGUgcm9vdFBhdGggKGFsc28gZGlyZWN0b3JpZXMpLlxyXG4gICAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlUGF0aCA9PlxyXG4gICAgICAgIGZpbGVQYXRoLnN0YXJ0c1dpdGgocm9vdFBhdGgpICYmICFmaWxlUGF0aC5lbmRzV2l0aChwYXRoLnNlcCkpO1xyXG5cclxuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbHRlcmVkLm1hcChmaWxlUGF0aCA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5yZWxhdGl2ZShyb290UGF0aCwgZmlsZVBhdGgpLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkQ29udGVudChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gTWFrZSBzdXJlIHdlJ3JlIGFibGUgdG8gc3VwcG9ydCB0aGlzIG1vZC5cclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKSAmJlxyXG4gICAgKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPKSAhPT0gdW5kZWZpbmVkKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kQ2FuZEZpbGUoZmlsZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcclxuICByZXR1cm4gZmlsZXMuZmluZChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcClcclxuICAgIC5maW5kKHNlZyA9PiBST09UX01PRF9DQU5ESURBVEVTLmluY2x1ZGVzKHNlZykpICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYXNDYW5kaWRhdGUoZmlsZXM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XHJcbiAgY29uc3QgY2FuZGlkYXRlID0gZmluZENhbmRGaWxlKGZpbGVzKTtcclxuICByZXR1cm4gY2FuZGlkYXRlICE9PSB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxSb290TW9kKGZpbGVzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkpO1xyXG4gIGNvbnN0IGNhbmRpZGF0ZSA9IGZpbmRDYW5kRmlsZShmaWxlcyk7XHJcbiAgY29uc3QgY2FuZElkeCA9IGNhbmRpZGF0ZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKVxyXG4gICAgLmZpbmRJbmRleChzZWcgPT4gUk9PVF9NT0RfQ0FORElEQVRFUy5pbmNsdWRlcyhzZWcpKTtcclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gZmlsdGVyZWQucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBpdGVyLFxyXG4gICAgICBkZXN0aW5hdGlvbjogaXRlci5zcGxpdChwYXRoLnNlcCkuc2xpY2UoY2FuZElkeCkuam9pbihwYXRoLnNlcCksXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gdGVzdFJvb3RNb2QoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgICBzdXBwb3J0ZWQ6IGhhc0NhbmRpZGF0ZShmaWxlcykgJiYgZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0b0xPUHJlZml4KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBtb2Q6IHR5cGVzLklNb2QpOiBzdHJpbmcge1xyXG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuICdaWlpaLScgKyBtb2QuaWQ7XHJcbiAgfVxyXG5cclxuICAvLyBSZXRyaWV2ZSB0aGUgbG9hZCBvcmRlciBhcyBzdG9yZWQgaW4gVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUuXHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvcHMucHJvZmlsZS5pZF0sIFtdKTtcclxuXHJcbiAgLy8gRmluZCB0aGUgbW9kIGVudHJ5IGluIHRoZSBsb2FkIG9yZGVyIHN0YXRlIGFuZCBpbnNlcnQgdGhlIHByZWZpeCBpbiBmcm9udFxyXG4gIC8vICBvZiB0aGUgbW9kJ3MgbmFtZS9pZC93aGF0ZXZlclxyXG4gIGNvbnN0IGxvRW50cnk6IElMb2FkT3JkZXJFbnRyeSA9IGxvYWRPcmRlci5maW5kKGxvRW50cnkgPT4gbG9FbnRyeS5pZCA9PT0gbW9kLmlkKTtcclxuICByZXR1cm4gKGxvRW50cnk/LmRhdGE/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBsb0VudHJ5LmRhdGEucHJlZml4ICsgJy0nICsgbW9kLmlkXHJcbiAgICA6ICdaWlpaLScgKyBtb2QuaWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcXVpcmVzTGF1bmNoZXIoZ2FtZVBhdGgpIHtcclxuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGdhbWVQYXRoKVxyXG4gICAgLnRoZW4oZmlsZXMgPT4gKGZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKFNURUFNX0RMTCkpICE9PSB1bmRlZmluZWQpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHsgbGF1bmNoZXI6ICdzdGVhbScgfSlcclxuICAgICAgOiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSlcclxuICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEluZm9QYW5lbChwcm9wcykge1xyXG4gIGNvbnN0IHsgdCwgY3VycmVudE9mZnNldCB9ID0gcHJvcHM7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIHBhZGRpbmc6ICcxNnB4JyB9fT5cclxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cclxuICAgICAgICB7dCgnQ3VycmVudCBQcmVmaXggT2Zmc2V0OiAnKX1cclxuICAgICAgICA8aHIvPlxyXG4gICAgICAgIDxsYWJlbCBzdHlsZT17eyBjb2xvcjogJ3JlZCcgfX0+e2N1cnJlbnRPZmZzZXR9PC9sYWJlbD5cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxoci8+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoJzcgRGF5cyB0byBEaWUgbG9hZHMgbW9kcyBpbiBhbHBoYWJldGljIG9yZGVyIHNvIFZvcnRleCBwcmVmaXhlcyAnXHJcbiAgICAgICAgICsgJ3RoZSBkaXJlY3RvcnkgbmFtZXMgd2l0aCBcIkFBQSwgQUFCLCBBQUMsIC4uLlwiIHRvIGVuc3VyZSB0aGV5IGxvYWQgaW4gdGhlIG9yZGVyIHlvdSBzZXQgaGVyZS4nKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBJbmZvUGFuZWxXcmFwKHByb3BzOiB7IGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcgfSkge1xyXG4gIGNvbnN0IHsgYXBpLCBwcm9maWxlSWQgfSA9IHByb3BzO1xyXG4gIGNvbnN0IGN1cnJlbnRPZmZzZXQgPSB1c2VTZWxlY3Rvcigoc3RhdGU6IHR5cGVzLklTdGF0ZSkgPT5cclxuICAgIG1ha2VQcmVmaXgodXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAncHJlZml4T2Zmc2V0JywgcHJvZmlsZUlkXSwgMCkpKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxJbmZvUGFuZWxcclxuICAgICAgdD17YXBpLnRyYW5zbGF0ZX1cclxuICAgICAgY3VycmVudE9mZnNldD17Y3VycmVudE9mZnNldH1cclxuICAgIC8+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZSddLCByZWR1Y2VyKTtcclxuXHJcbiAgY29uc3QgZ2V0TW9kc1BhdGggPSAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCB1ZGYgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICd1ZGYnXSwgdW5kZWZpbmVkKTtcclxuICAgIHJldHVybiB1ZGYgIT09IHVuZGVmaW5lZCA/IHBhdGguam9pbih1ZGYsICdNb2RzJykgOiAnTW9kcyc7XHJcbiAgfVxyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICc3IERheXMgdG8gRGllJyxcclxuICAgIG1lcmdlTW9kczogKG1vZCkgPT4gdG9MT1ByZWZpeChjb250ZXh0LCBtb2QpLFxyXG4gICAgcXVlcnlQYXRoOiB0b0JsdWUoZmluZEdhbWUpLFxyXG4gICAgcmVxdWlyZXNDbGVhbnVwOiB0cnVlLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtdLFxyXG4gICAgcXVlcnlNb2RQYXRoOiBnZXRNb2RzUGF0aCxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiBnYW1lRXhlY3V0YWJsZSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgZ2FtZUV4ZWN1dGFibGUoKSxcclxuICAgIF0sXHJcbiAgICByZXF1aXJlc0xhdW5jaGVyLFxyXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxyXG4gICAgICBoYXNoRmlsZXM6IFsnN0RheXNUb0RpZV9EYXRhL01hbmFnZWQvQXNzZW1ibHktQ1NoYXJwLmRsbCddLFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XHJcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemUoY29udGV4dCksXHJcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6IChsb2FkT3JkZXIpID0+IHNlcmlhbGl6ZShjb250ZXh0LCBsb2FkT3JkZXIpLFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICB0b2dnbGVhYmxlRW50cmllczogZmFsc2UsXHJcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG4gICAgICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIDxJbmZvUGFuZWxXcmFwIGFwaT17Y29udGV4dC5hcGl9IHByb2ZpbGVJZD17cHJvZmlsZUlkfSAvPlxyXG4gICAgICApO1xyXG4gICAgfSkgYXMgYW55LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUwLCAnbG9vdC1zb3J0Jywge30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAnUHJlZml4IE9mZnNldCBBc3NpZ24nLCAoKSA9PiB7XHJcbiAgICBzZXRQcmVmaXhPZmZzZXREaWFsb2coY29udGV4dC5hcGkpO1xyXG4gIH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUwLCAnbG9vdC1zb3J0Jywge30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAnUHJlZml4IE9mZnNldCBSZXNldCcsICgpID0+IHtcclxuICAgIHJlc2V0UHJlZml4T2Zmc2V0KGNvbnRleHQuYXBpKTtcclxuICB9LCAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVHYW1lID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gYWN0aXZlR2FtZSA9PT0gR0FNRV9JRDtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgZ2V0T3ZlcmhhdWxQYXRoID0gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIHJldHVybiBkaXNjb3Zlcnk/LnBhdGg7XHJcbiAgfTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignN2R0ZC1tb2QnLCAyNSxcclxuICAgIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkQ29udGVudCksIHRvQmx1ZShpbnN0YWxsQ29udGVudCkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCc3ZHRkLXJvb3QtbW9kJywgMjAsIHRvQmx1ZSh0ZXN0Um9vdE1vZCksIHRvQmx1ZShpbnN0YWxsUm9vdE1vZCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCc3ZHRkLXJvb3QtbW9kJywgMjAsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgIGdldE92ZXJoYXVsUGF0aCwgKGluc3RydWN0aW9ucykgPT4ge1xyXG4gICAgICBjb25zdCBjYW5kaWRhdGVGb3VuZCA9IGhhc0NhbmRpZGF0ZShpbnN0cnVjdGlvbnNcclxuICAgICAgICAuZmlsdGVyKGluc3RyID0+ICEhaW5zdHIuZGVzdGluYXRpb24pXHJcbiAgICAgICAgLm1hcChpbnN0ciA9PiBpbnN0ci5kZXN0aW5hdGlvbikpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhbmRpZGF0ZUZvdW5kKSBhcyBhbnk7XHJcbiAgICB9LFxyXG4gICAgICB7IG5hbWU6ICdSb290IERpcmVjdG9yeSBNb2QnLCBtZXJnZU1vZHM6IHRydWUsIGRlcGxveW1lbnRFc3NlbnRpYWw6IGZhbHNlIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGQgPT4gbWlncmF0ZTAyMChjb250ZXh0LmFwaSwgb2xkKSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24odG9CbHVlKG9sZCA9PiBtaWdyYXRlMTAwKGNvbnRleHQsIG9sZCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGQgPT4gbWlncmF0ZTEwMTEoY29udGV4dCwgb2xkKSkpO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19