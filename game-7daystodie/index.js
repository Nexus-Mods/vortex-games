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
const vortex_api_1 = require("vortex-api");
const React = __importStar(require("react"));
const actions_1 = require("./actions");
const reducers_1 = require("./reducers");
const common_1 = require("./common");
const loadOrder_1 = require("./loadOrder");
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const STEAM_ID = '251570';
const STEAM_DLL = 'steamclient64.dll';
const ROOT_MOD_CANDIDATES = ['bepinex'];
function resetPrefixOffset(api) {
    var _a;
    const state = api.getState();
    const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
    if (profileId === undefined) {
        api.showErrorNotification('No active profile for 7dtd', undefined, { allowReport: false });
        return;
    }
    api.store.dispatch((0, actions_1.setPrefixOffset)(profileId, 0));
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
            api.store.dispatch((0, actions_1.setPrefixOffset)(profileId, offset));
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
            context.api.store.dispatch((0, actions_1.setUDF)(directory));
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
                    context.api.store.dispatch((0, actions_1.setUDF)(udf));
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
    let loEntry = loadOrder.find(loEntry => loEntry.id === mod.id);
    if (loEntry === undefined) {
        const prev = vortex_api_1.util.getSafe(props.state, ['settings', '7daystodie', 'previousLO', props.profile.id], []);
        loEntry = prev.find(loEntry => loEntry.id === mod.id);
    }
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
    context.registerReducer(['settings', '7daystodie'], reducers_1.reducer);
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
        serializeLoadOrder: (loadOrder, prev) => (0, loadOrder_1.serialize)(context, loadOrder, prev),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDZDQUEwQztBQUMxQywyQ0FBaUU7QUFFakUsNkNBQStCO0FBRS9CLHVDQUFvRDtBQUNwRCx5Q0FBcUM7QUFFckMscUNBQWtIO0FBQ2xILDJDQUErRDtBQUMvRCw2Q0FBbUU7QUFFbkUsaUNBQStGO0FBRS9GLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUMxQixNQUFNLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQztBQUV0QyxNQUFNLG1CQUFtQixHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7QUFFeEMsU0FBUyxpQkFBaUIsQ0FBQyxHQUF3Qjs7SUFDakQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLE1BQUEsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLDBDQUFFLEVBQUUsQ0FBQztJQUNyRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7UUFFM0IsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDRCQUE0QixFQUFFLFNBQVMsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzNGLE9BQU87S0FDUjtJQUVELEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUEseUJBQWUsRUFBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRCxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzNGLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVB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QUksRUFBRSxvQkFBb0IsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFFakYsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBQSx1QkFBVSxFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUEsdUJBQVUsRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25FLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUEsd0JBQVcsRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXBFLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XHJcblxyXG5pbXBvcnQgeyBzZXRQcmVmaXhPZmZzZXQsIHNldFVERiB9IGZyb20gJy4vYWN0aW9ucyc7XHJcbmltcG9ydCB7IHJlZHVjZXIgfSBmcm9tICcuL3JlZHVjZXJzJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIGdhbWVFeGVjdXRhYmxlLCBNT0RfSU5GTywgbGF1bmNoZXJTZXR0aW5nc0ZpbGVQYXRoLCBERUZBVUxUX0xBVU5DSEVSX1NFVFRJTkdTIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBkZXNlcmlhbGl6ZSwgc2VyaWFsaXplLCB2YWxpZGF0ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcclxuaW1wb3J0IHsgbWlncmF0ZTAyMCwgbWlncmF0ZTEwMCwgbWlncmF0ZTEwMTEgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBlbnN1cmVMT0ZpbGUsIGdlblByb3BzLCBnZXRNb2ROYW1lLCBtYWtlUHJlZml4LCByZXZlcnNlUHJlZml4LCB0b0JsdWUgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuY29uc3QgU1RFQU1fSUQgPSAnMjUxNTcwJztcclxuY29uc3QgU1RFQU1fRExMID0gJ3N0ZWFtY2xpZW50NjQuZGxsJztcclxuXHJcbmNvbnN0IFJPT1RfTU9EX0NBTkRJREFURVMgPSBbJ2JlcGluZXgnXTtcclxuXHJcbmZ1bmN0aW9uIHJlc2V0UHJlZml4T2Zmc2V0KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIEhvdyA/XHJcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdObyBhY3RpdmUgcHJvZmlsZSBmb3IgN2R0ZCcsIHVuZGVmaW5lZCwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UHJlZml4T2Zmc2V0KHByb2ZpbGVJZCwgMCkpO1xyXG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuICBjb25zdCBuZXdMTyA9IGxvYWRPcmRlci5tYXAoKGVudHJ5LCBpZHgpID0+ICh7XHJcbiAgICAuLi5lbnRyeSxcclxuICAgIGRhdGE6IHtcclxuICAgICAgcHJlZml4OiBtYWtlUHJlZml4KGlkeCksXHJcbiAgICB9LFxyXG4gIH0pKTtcclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZUlkLCBuZXdMTykpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRQcmVmaXhPZmZzZXREaWFsb2coYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgcmV0dXJuIGFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdTZXQgTmV3IFByZWZpeCBPZmZzZXQnLCB7XHJcbiAgICB0ZXh0OiBhcGkudHJhbnNsYXRlKCdJbnNlcnQgbmV3IHByZWZpeCBvZmZzZXQgZm9yIG1vZGxldHMgKEFBQS1aWlopOicpLFxyXG4gICAgaW5wdXQ6IFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAnN2R0ZHByZWZpeG9mZnNldGlucHV0JyxcclxuICAgICAgICBsYWJlbDogJ1ByZWZpeCBPZmZzZXQnLFxyXG4gICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICBwbGFjZWhvbGRlcjogJ0FBQScsXHJcbiAgICAgIH1dLFxyXG4gIH0sIFsgeyBsYWJlbDogJ0NhbmNlbCcgfSwgeyBsYWJlbDogJ1NldCcsIGRlZmF1bHQ6IHRydWUgfSBdKVxyXG4gIC50aGVuKHJlc3VsdCA9PiB7XHJcbiAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ1NldCcpIHtcclxuICAgICAgY29uc3QgcHJlZml4ID0gcmVzdWx0LmlucHV0Wyc3ZHRkcHJlZml4b2Zmc2V0aW5wdXQnXTtcclxuICAgICAgbGV0IG9mZnNldCA9IDA7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgb2Zmc2V0ID0gcmV2ZXJzZVByZWZpeChwcmVmaXgpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG4gICAgICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAvLyBIb3cgP1xyXG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ05vIGFjdGl2ZSBwcm9maWxlIGZvciA3ZHRkJywgdW5kZWZpbmVkLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmVmaXhPZmZzZXQocHJvZmlsZUlkLCBvZmZzZXQpKTtcclxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgW10pO1xyXG4gICAgICBjb25zdCBuZXdMTyA9IGxvYWRPcmRlci5tYXAoZW50cnkgPT4gKHtcclxuICAgICAgICAuLi5lbnRyeSxcclxuICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICBwcmVmaXg6IG1ha2VQcmVmaXgocmV2ZXJzZVByZWZpeChlbnRyeS5kYXRhLnByZWZpeCkgKyBvZmZzZXQpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pKTtcclxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgbmV3TE8pKTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9KVxyXG4gIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHNldCBwcmVmaXggb2Zmc2V0JywgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZmluZEdhbWUoKSB7XHJcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtTVEVBTV9JRF0pXHJcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJzZUFkZGl0aW9uYWxQYXJhbWV0ZXJzKHBhcmFtZXRlcnM6IHN0cmluZykge1xyXG4gIGNvbnN0IHVkZlBhcmFtID0gcGFyYW1ldGVycy5zcGxpdCgnLScpLmZpbmQocGFyYW0gPT4gcGFyYW0uc3RhcnRzV2l0aCgnVXNlckRhdGFGb2xkZXI9JykpO1xyXG4gIGNvbnN0IHVkZiA9IHVkZlBhcmFtID8gdWRmUGFyYW0uc3BsaXQoJz0nKT8uWzFdPy50cmltRW5kKCkgOiB1bmRlZmluZWQ7XHJcbiAgcmV0dXJuICh1ZGYgJiYgcGF0aC5pc0Fic29sdXRlKHVkZikpID8gdWRmIDogdW5kZWZpbmVkO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XHJcbiAgY29uc3QgcmVxdWlyZXNSZXN0YXJ0ID0gdXRpbC5nZXRTYWZlKGNvbnRleHQuYXBpLmdldFN0YXRlKCksXHJcbiAgICBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAndWRmJ10sIHVuZGVmaW5lZCkgPT09IHVuZGVmaW5lZDtcclxuICBjb25zdCBsYXVuY2hlclNldHRpbmdzID0gbGF1bmNoZXJTZXR0aW5nc0ZpbGVQYXRoKCk7XHJcbiAgY29uc3QgcmVsYXVuY2hFeHQgPSAoKSA9PiB7XHJcbiAgICByZXR1cm4gY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdSZXN0YXJ0IFJlcXVpcmVkJywge1xyXG4gICAgICB0ZXh0OiAnVGhlIGV4dGVuc2lvbiByZXF1aXJlcyBhIHJlc3RhcnQgdG8gY29tcGxldGUgdGhlIFVERiBzZXR1cC4gJ1xyXG4gICAgICAgICAgKyAnVGhlIGV4dGVuc2lvbiB3aWxsIG5vdyBleGl0IC0gcGxlYXNlIHJlLWFjdGl2YXRlIGl0IHZpYSB0aGUgZ2FtZXMgcGFnZSBvciBkYXNoYm9hcmQuJyxcclxuICAgIH0sIFsgeyBsYWJlbDogJ1Jlc3RhcnQgRXh0ZW5zaW9uJyB9IF0pXHJcbiAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ1Jlc3RhcnQgcmVxdWlyZWQnKSk7XHJcbiAgICB9KTtcclxuICB9XHJcbiAgY29uc3Qgc2VsZWN0VURGID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgY29uc3QgcmVzID0gYXdhaXQgY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdDaG9vc2UgVXNlciBEZWZpbmVkIEZvbGRlcicsIHtcclxuICAgICAgdGV4dDogJ1RoZSBtb2RkaW5nIHBhdHRlcm4gZm9yIDdEVEQgaXMgY2hhbmdpbmcuIFRoZSBNb2RzIHBhdGggaW5zaWRlIHRoZSBnYW1lIGRpcmVjdG9yeSAnXHJcbiAgICAgICAgICArICdpcyBiZWluZyBkZXByZWNhdGVkIGFuZCBtb2RzIGxvY2F0ZWQgaW4gdGhlIG9sZCBwYXRoIHdpbGwgbm8gbG9uZ2VyIHdvcmsgaW4gdGhlIG5lYXIgJ1xyXG4gICAgICAgICAgKyAnZnV0dXJlLiBQbGVhc2Ugc2VsZWN0IHlvdXIgVXNlciBEZWZpbmVkIEZvbGRlciAoVURGKSAtIFZvcnRleCB3aWxsIGRlcGxveSB0byB0aGlzIG5ldyBsb2NhdGlvbi4nLFxyXG4gICAgfSxcclxuICAgIFtcclxuICAgICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcclxuICAgICAgeyBsYWJlbDogJ1NlbGVjdCBVREYnIH0sXHJcbiAgICBdKTtcclxuICAgIGlmIChyZXMuYWN0aW9uICE9PSAnU2VsZWN0IFVERicpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQ2Fubm90IHByb2NlZWQgd2l0aG91dCBVRkQnKSk7XHJcbiAgICB9XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShsYXVuY2hlclNldHRpbmdzKSk7XHJcbiAgICBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XHJcbiAgICBjb25zdCBkaXJlY3RvcnkgPSBhd2FpdCBjb250ZXh0LmFwaS5zZWxlY3REaXIoe1xyXG4gICAgICB0aXRsZTogJ1NlbGVjdCBVc2VyIERhdGEgRm9sZGVyJyxcclxuICAgICAgZGVmYXVsdFBhdGg6IHBhdGguam9pbihwYXRoLmRpcm5hbWUobGF1bmNoZXJTZXR0aW5ncykpLFxyXG4gICAgfSk7XHJcbiAgICBpZiAoIWRpcmVjdG9yeSkge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdDYW5ub3QgcHJvY2VlZCB3aXRob3V0IFVGRCcpKTtcclxuICAgIH1cclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpcmVjdG9yeSwgJ01vZHMnKSk7XHJcbiAgICBjb25zdCBsYXVuY2hlciA9IERFRkFVTFRfTEFVTkNIRVJfU0VUVElOR1M7XHJcbiAgICBsYXVuY2hlci5EZWZhdWx0UnVuQ29uZmlnLkFkZGl0aW9uYWxQYXJhbWV0ZXJzID0gYC1Vc2VyRGF0YUZvbGRlcj0ke2RpcmVjdG9yeX1gO1xyXG4gICAgY29uc3QgbGF1bmNoZXJEYXRhID0gSlNPTi5zdHJpbmdpZnkobGF1bmNoZXIsIG51bGwsIDIpO1xyXG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMobGF1bmNoZXJTZXR0aW5ncywgbGF1bmNoZXJEYXRhLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRVREYoZGlyZWN0b3J5KSk7XHJcbiAgICByZXR1cm4gKHJlcXVpcmVzUmVzdGFydCkgPyByZWxhdW5jaEV4dCgpIDogUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGxhdW5jaGVyU2V0dGluZ3MsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGNvbnN0IHNldHRpbmdzID0gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgIGlmIChzZXR0aW5ncz8uRGVmYXVsdFJ1bkNvbmZpZz8uQWRkaXRpb25hbFBhcmFtZXRlcnMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb25zdCB1ZGYgPSBwYXJzZUFkZGl0aW9uYWxQYXJhbWV0ZXJzKHNldHRpbmdzLkRlZmF1bHRSdW5Db25maWcuQWRkaXRpb25hbFBhcmFtZXRlcnMpO1xyXG4gICAgICBpZiAoISF1ZGYpIHtcclxuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbih1ZGYsICdNb2RzJykpO1xyXG4gICAgICAgIGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0KTtcclxuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRVREYodWRmKSk7XHJcbiAgICAgICAgcmV0dXJuIChyZXF1aXJlc1Jlc3RhcnQpID8gcmVsYXVuY2hFeHQoKSA6IFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBzZWxlY3RVREYoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIHNlbGVjdFVERigpO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbENvbnRlbnQoZmlsZXM6IHN0cmluZ1tdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgLy8gVGhlIG1vZGluZm8ueG1sIGZpbGUgaXMgZXhwZWN0ZWQgdG8gYWx3YXlzIGJlIHBvc2l0aW9uZWQgaW4gdGhlIHJvb3QgZGlyZWN0b3J5XHJcbiAgLy8gIG9mIHRoZSBtb2QgaXRzZWxmOyB3ZSdyZSBnb2luZyB0byBkaXNyZWdhcmQgYW55dGhpbmcgcGxhY2VkIG91dHNpZGUgdGhlIHJvb3QuXHJcbiAgY29uc3QgbW9kRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPKTtcclxuICBjb25zdCByb290UGF0aCA9IHBhdGguZGlybmFtZShtb2RGaWxlKTtcclxuICByZXR1cm4gZ2V0TW9kTmFtZShwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtb2RGaWxlKSlcclxuICAgIC50aGVuKG1vZE5hbWUgPT4ge1xyXG4gICAgICBtb2ROYW1lID0gbW9kTmFtZS5yZXBsYWNlKC9bXmEtekEtWjAtOV0vZywgJycpO1xyXG5cclxuICAgICAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIGFuZCBhbnl0aGluZyB0aGF0IGlzbid0IGluIHRoZSByb290UGF0aCAoYWxzbyBkaXJlY3RvcmllcykuXHJcbiAgICAgIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGVQYXRoID0+XHJcbiAgICAgICAgZmlsZVBhdGguc3RhcnRzV2l0aChyb290UGF0aCkgJiYgIWZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSk7XHJcblxyXG4gICAgICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gZmlsdGVyZWQubWFwKGZpbGVQYXRoID0+IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLnJlbGF0aXZlKHJvb3RQYXRoLCBmaWxlUGF0aCksXHJcbiAgICAgICAgfTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWRDb250ZW50KGZpbGVzLCBnYW1lSWQpIHtcclxuICAvLyBNYWtlIHN1cmUgd2UncmUgYWJsZSB0byBzdXBwb3J0IHRoaXMgbW9kLlxyXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpICYmXHJcbiAgICAoZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0lORk8pICE9PSB1bmRlZmluZWQpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGZpbmRDYW5kRmlsZShmaWxlczogc3RyaW5nW10pOiBzdHJpbmcge1xyXG4gIHJldHVybiBmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKVxyXG4gICAgLmZpbmQoc2VnID0+IFJPT1RfTU9EX0NBTkRJREFURVMuaW5jbHVkZXMoc2VnKSkgIT09IHVuZGVmaW5lZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhhc0NhbmRpZGF0ZShmaWxlczogc3RyaW5nW10pOiBib29sZWFuIHtcclxuICBjb25zdCBjYW5kaWRhdGUgPSBmaW5kQ2FuZEZpbGUoZmlsZXMpO1xyXG4gIHJldHVybiBjYW5kaWRhdGUgIT09IHVuZGVmaW5lZDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFJvb3RNb2QoZmlsZXM6IHN0cmluZ1tdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSk7XHJcbiAgY29uc3QgY2FuZGlkYXRlID0gZmluZENhbmRGaWxlKGZpbGVzKTtcclxuICBjb25zdCBjYW5kSWR4ID0gY2FuZGlkYXRlLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApXHJcbiAgICAuZmluZEluZGV4KHNlZyA9PiBST09UX01PRF9DQU5ESURBVEVTLmluY2x1ZGVzKHNlZykpO1xyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWx0ZXJlZC5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XHJcbiAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGl0ZXIsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBpdGVyLnNwbGl0KHBhdGguc2VwKS5zbGljZShjYW5kSWR4KS5qb2luKHBhdGguc2VwKSxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIFtdKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiB0ZXN0Um9vdE1vZChmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICAgIHN1cHBvcnRlZDogaGFzQ2FuZGlkYXRlKGZpbGVzKSAmJiBnYW1lSWQgPT09IEdBTUVfSUQsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvTE9QcmVmaXgoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIG1vZDogdHlwZXMuSU1vZCk6IHN0cmluZyB7XHJcbiAgY29uc3QgcHJvcHM6IElQcm9wcyA9IGdlblByb3BzKGNvbnRleHQpO1xyXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gJ1paWlotJyArIG1vZC5pZDtcclxuICB9XHJcblxyXG4gIC8vIFJldHJpZXZlIHRoZSBsb2FkIG9yZGVyIGFzIHN0b3JlZCBpbiBWb3J0ZXgncyBhcHBsaWNhdGlvbiBzdGF0ZS5cclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUocHJvcHMuc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9wcy5wcm9maWxlLmlkXSwgW10pO1xyXG5cclxuICAvLyBGaW5kIHRoZSBtb2QgZW50cnkgaW4gdGhlIGxvYWQgb3JkZXIgc3RhdGUgYW5kIGluc2VydCB0aGUgcHJlZml4IGluIGZyb250XHJcbiAgLy8gIG9mIHRoZSBtb2QncyBuYW1lL2lkL3doYXRldmVyXHJcbiAgbGV0IGxvRW50cnk6IElMb2FkT3JkZXJFbnRyeSA9IGxvYWRPcmRlci5maW5kKGxvRW50cnkgPT4gbG9FbnRyeS5pZCA9PT0gbW9kLmlkKTtcclxuICBpZiAobG9FbnRyeSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBUaGUgbW9kIGVudHJ5IHdhc24ndCBmb3VuZCBpbiB0aGUgbG9hZCBvcmRlciBzdGF0ZSAtIHRoaXMgaXMgcG90ZW50aWFsbHlcclxuICAgIC8vICBkdWUgdG8gdGhlIG1vZCBiZWluZyByZW1vdmVkIGFzIHBhcnQgb2YgYW4gdXBkYXRlIG9yIHVuaW5zdGFsbGF0aW9uLlxyXG4gICAgLy8gIEl0J3MgaW1wb3J0YW50IHdlIGZpbmQgdGhlIHByZWZpeCBvZiB0aGUgbW9kIGluIHRoaXMgY2FzZSwgYXMgdGhlIGRlcGxveW1lbnRcclxuICAgIC8vICBtZXRob2QgY291bGQgcG90ZW50aWFsbHkgZmFpbCB0byByZW1vdmUgdGhlIG1vZCEgV2UncmUgZ29pbmcgdG8gY2hlY2tcclxuICAgIC8vICB0aGUgcHJldmlvdXMgbG9hZCBvcmRlciBzYXZlZCBmb3IgdGhpcyBwcm9maWxlIGFuZCB1c2UgdGhhdCBpZiBpdCBleGlzdHMuXHJcbiAgICBjb25zdCBwcmV2ID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLCBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAncHJldmlvdXNMTycsIHByb3BzLnByb2ZpbGUuaWRdLCBbXSk7XHJcbiAgICBsb0VudHJ5ID0gcHJldi5maW5kKGxvRW50cnkgPT4gbG9FbnRyeS5pZCA9PT0gbW9kLmlkKTtcclxuICB9XHJcblxyXG4gIHJldHVybiAobG9FbnRyeT8uZGF0YT8ucHJlZml4ICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IGxvRW50cnkuZGF0YS5wcmVmaXggKyAnLScgKyBtb2QuaWRcclxuICAgIDogJ1paWlotJyArIG1vZC5pZDtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVxdWlyZXNMYXVuY2hlcihnYW1lUGF0aCkge1xyXG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoZ2FtZVBhdGgpXHJcbiAgICAudGhlbihmaWxlcyA9PiAoZmlsZXMuZmluZChmaWxlID0+IGZpbGUuZW5kc1dpdGgoU1RFQU1fRExMKSkgIT09IHVuZGVmaW5lZClcclxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoeyBsYXVuY2hlcjogJ3N0ZWFtJyB9KVxyXG4gICAgICA6IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKVxyXG4gICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gSW5mb1BhbmVsKHByb3BzKSB7XHJcbiAgY29uc3QgeyB0LCBjdXJyZW50T2Zmc2V0IH0gPSBwcm9wcztcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgcGFkZGluZzogJzE2cHgnIH19PlxyXG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4Jywgd2hpdGVTcGFjZTogJ25vd3JhcCcsIGFsaWduSXRlbXM6ICdjZW50ZXInIH19PlxyXG4gICAgICAgIHt0KCdDdXJyZW50IFByZWZpeCBPZmZzZXQ6ICcpfVxyXG4gICAgICAgIDxoci8+XHJcbiAgICAgICAgPGxhYmVsIHN0eWxlPXt7IGNvbG9yOiAncmVkJyB9fT57Y3VycmVudE9mZnNldH08L2xhYmVsPlxyXG4gICAgICA8L2Rpdj5cclxuICAgICAgPGhyLz5cclxuICAgICAgPGRpdj5cclxuICAgICAgICB7dCgnNyBEYXlzIHRvIERpZSBsb2FkcyBtb2RzIGluIGFscGhhYmV0aWMgb3JkZXIgc28gVm9ydGV4IHByZWZpeGVzICdcclxuICAgICAgICAgKyAndGhlIGRpcmVjdG9yeSBuYW1lcyB3aXRoIFwiQUFBLCBBQUIsIEFBQywgLi4uXCIgdG8gZW5zdXJlIHRoZXkgbG9hZCBpbiB0aGUgb3JkZXIgeW91IHNldCBoZXJlLicpfVxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEluZm9QYW5lbFdyYXAocHJvcHM6IHsgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZyB9KSB7XHJcbiAgY29uc3QgeyBhcGksIHByb2ZpbGVJZCB9ID0gcHJvcHM7XHJcbiAgY29uc3QgY3VycmVudE9mZnNldCA9IHVzZVNlbGVjdG9yKChzdGF0ZTogdHlwZXMuSVN0YXRlKSA9PlxyXG4gICAgbWFrZVByZWZpeCh1dGlsLmdldFNhZmUoc3RhdGUsXHJcbiAgICAgIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICdwcmVmaXhPZmZzZXQnLCBwcm9maWxlSWRdLCAwKSkpO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPEluZm9QYW5lbFxyXG4gICAgICB0PXthcGkudHJhbnNsYXRlfVxyXG4gICAgICBjdXJyZW50T2Zmc2V0PXtjdXJyZW50T2Zmc2V0fVxyXG4gICAgLz5cclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XHJcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJ10sIHJlZHVjZXIpO1xyXG5cclxuICBjb25zdCBnZXRNb2RzUGF0aCA9ICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IHVkZiA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJywgJ3VkZiddLCB1bmRlZmluZWQpO1xyXG4gICAgcmV0dXJuIHVkZiAhPT0gdW5kZWZpbmVkID8gcGF0aC5qb2luKHVkZiwgJ01vZHMnKSA6ICdNb2RzJztcclxuICB9XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcclxuICAgIGlkOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJzcgRGF5cyB0byBEaWUnLFxyXG4gICAgbWVyZ2VNb2RzOiAobW9kKSA9PiB0b0xPUHJlZml4KGNvbnRleHQsIG1vZCksXHJcbiAgICBxdWVyeVBhdGg6IHRvQmx1ZShmaW5kR2FtZSksXHJcbiAgICBzdXBwb3J0ZWRUb29sczogW10sXHJcbiAgICBxdWVyeU1vZFBhdGg6IGdldE1vZHNQYXRoLFxyXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgIGV4ZWN1dGFibGU6IGdhbWVFeGVjdXRhYmxlLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICBnYW1lRXhlY3V0YWJsZSgpLFxyXG4gICAgXSxcclxuICAgIHJlcXVpcmVzTGF1bmNoZXIsXHJcbiAgICBzZXR1cDogdG9CbHVlKChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSkpLFxyXG4gICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXHJcbiAgICB9LFxyXG4gICAgZGV0YWlsczoge1xyXG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fSUQsXHJcbiAgICAgIGhhc2hGaWxlczogWyc3RGF5c1RvRGllX0RhdGEvTWFuYWdlZC9Bc3NlbWJseS1DU2hhcnAuZGxsJ10sXHJcbiAgICB9LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTG9hZE9yZGVyKHtcclxuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyOiAoKSA9PiBkZXNlcmlhbGl6ZShjb250ZXh0KSxcclxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlciwgcHJldikgPT4gc2VyaWFsaXplKGNvbnRleHQsIGxvYWRPcmRlciwgcHJldiksXHJcbiAgICB2YWxpZGF0ZSxcclxuICAgIGdhbWVJZDogR0FNRV9JRCxcclxuICAgIHRvZ2dsZWFibGVFbnRyaWVzOiBmYWxzZSxcclxuICAgIHVzYWdlSW5zdHJ1Y3Rpb25zOiAoKCkgPT4ge1xyXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XHJcbiAgICAgIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgPEluZm9QYW5lbFdyYXAgYXBpPXtjb250ZXh0LmFwaX0gcHJvZmlsZUlkPXtwcm9maWxlSWR9IC8+XHJcbiAgICAgICk7XHJcbiAgICB9KSBhcyBhbnksXHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNTAsICdsb290LXNvcnQnLCB7fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICdQcmVmaXggT2Zmc2V0IEFzc2lnbicsICgpID0+IHtcclxuICAgIHNldFByZWZpeE9mZnNldERpYWxvZyhjb250ZXh0LmFwaSk7XHJcbiAgfSwgKCkgPT4ge1xyXG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgYWN0aXZlR2FtZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gICAgcmV0dXJuIGFjdGl2ZUdhbWUgPT09IEdBTUVfSUQ7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ2ZiLWxvYWQtb3JkZXItaWNvbnMnLCAxNTAsICdsb290LXNvcnQnLCB7fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICdQcmVmaXggT2Zmc2V0IFJlc2V0JywgKCkgPT4ge1xyXG4gICAgcmVzZXRQcmVmaXhPZmZzZXQoY29udGV4dC5hcGkpO1xyXG4gIH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xyXG4gIH0pO1xyXG5cclxuICBjb25zdCBnZXRPdmVyaGF1bFBhdGggPSAoZ2FtZTogdHlwZXMuSUdhbWUpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgcmV0dXJuIGRpc2NvdmVyeT8ucGF0aDtcclxuICB9O1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCc3ZHRkLW1vZCcsIDI1LFxyXG4gICAgdG9CbHVlKHRlc3RTdXBwb3J0ZWRDb250ZW50KSwgdG9CbHVlKGluc3RhbGxDb250ZW50KSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJzdkdGQtcm9vdC1tb2QnLCAyMCwgdG9CbHVlKHRlc3RSb290TW9kKSwgdG9CbHVlKGluc3RhbGxSb290TW9kKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJzdkdGQtcm9vdC1tb2QnLCAyMCwgKGdhbWVJZCkgPT4gZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gICAgZ2V0T3ZlcmhhdWxQYXRoLCAoaW5zdHJ1Y3Rpb25zKSA9PiB7XHJcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZUZvdW5kID0gaGFzQ2FuZGlkYXRlKGluc3RydWN0aW9uc1xyXG4gICAgICAgIC5maWx0ZXIoaW5zdHIgPT4gISFpbnN0ci5kZXN0aW5hdGlvbilcclxuICAgICAgICAubWFwKGluc3RyID0+IGluc3RyLmRlc3RpbmF0aW9uKSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2FuZGlkYXRlRm91bmQpIGFzIGFueTtcclxuICAgIH0sXHJcbiAgICAgIHsgbmFtZTogJ1Jvb3QgRGlyZWN0b3J5IE1vZCcsIG1lcmdlTW9kczogdHJ1ZSwgZGVwbG95bWVudEVzc2VudGlhbDogZmFsc2UgfSk7XHJcblxyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24odG9CbHVlKG9sZCA9PiBtaWdyYXRlMDIwKGNvbnRleHQuYXBpLCBvbGQpKSk7XHJcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbih0b0JsdWUob2xkID0+IG1pZ3JhdGUxMDAoY29udGV4dCwgb2xkKSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24odG9CbHVlKG9sZCA9PiBtaWdyYXRlMTAxMShjb250ZXh0LCBvbGQpKSk7XHJcblxyXG4gIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICBkZWZhdWx0OiBtYWluLFxyXG59O1xyXG4iXX0=