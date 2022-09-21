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
        serializeLoadOrder: ((loadOrder, prev) => (0, loadOrder_1.serialize)(context, loadOrder, prev)),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDZDQUEwQztBQUMxQywyQ0FBaUU7QUFFakUsNkNBQStCO0FBRS9CLHVDQUFvRDtBQUNwRCx5Q0FBcUM7QUFFckMscUNBQWtIO0FBQ2xILDJDQUErRDtBQUMvRCw2Q0FBbUU7QUFFbkUsaUNBQStGO0FBRS9GLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUMxQixNQUFNLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQztBQUV0QyxNQUFNLG1CQUFtQixHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7QUFFeEMsU0FBUyxpQkFBaUIsQ0FBQyxHQUF3Qjs7SUFDakQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLE1BQUEsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLDBDQUFFLEVBQUUsQ0FBQztJQUNyRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUU7UUFFM0IsR0FBRyxDQUFDLHFCQUFxQixDQUFDLDRCQUE0QixFQUFFLFNBQVMsRUFBRSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzNGLE9BQU87S0FDUjtJQUVELEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUEseUJBQWUsRUFBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRCxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzNGLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVB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Q0MsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBRWpGLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUEsdUJBQVUsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RSxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLHVCQUFVLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRSxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLHdCQUFXLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVwRSxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5cclxuaW1wb3J0IHsgc2V0UHJlZml4T2Zmc2V0LCBzZXRVREYgfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5pbXBvcnQgeyByZWR1Y2VyIH0gZnJvbSAnLi9yZWR1Y2Vycyc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBnYW1lRXhlY3V0YWJsZSwgTU9EX0lORk8sIGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCwgREVGQVVMVF9MQVVOQ0hFUl9TRVRUSU5HUyB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgZGVzZXJpYWxpemUsIHNlcmlhbGl6ZSwgdmFsaWRhdGUgfSBmcm9tICcuL2xvYWRPcmRlcic7XHJcbmltcG9ydCB7IG1pZ3JhdGUwMjAsIG1pZ3JhdGUxMDAsIG1pZ3JhdGUxMDExIH0gZnJvbSAnLi9taWdyYXRpb25zJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlckVudHJ5LCBJUHJvcHMgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZW5zdXJlTE9GaWxlLCBnZW5Qcm9wcywgZ2V0TW9kTmFtZSwgbWFrZVByZWZpeCwgcmV2ZXJzZVByZWZpeCwgdG9CbHVlIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmNvbnN0IFNURUFNX0lEID0gJzI1MTU3MCc7XHJcbmNvbnN0IFNURUFNX0RMTCA9ICdzdGVhbWNsaWVudDY0LmRsbCc7XHJcblxyXG5jb25zdCBST09UX01PRF9DQU5ESURBVEVTID0gWydiZXBpbmV4J107XHJcblxyXG5mdW5jdGlvbiByZXNldFByZWZpeE9mZnNldChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XHJcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBIb3cgP1xyXG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignTm8gYWN0aXZlIHByb2ZpbGUgZm9yIDdkdGQnLCB1bmRlZmluZWQsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByZWZpeE9mZnNldChwcm9maWxlSWQsIDApKTtcclxuICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XHJcbiAgY29uc3QgbmV3TE8gPSBsb2FkT3JkZXIubWFwKChlbnRyeSwgaWR4KSA9PiAoe1xyXG4gICAgLi4uZW50cnksXHJcbiAgICBkYXRhOiB7XHJcbiAgICAgIHByZWZpeDogbWFrZVByZWZpeChpZHgpLFxyXG4gICAgfSxcclxuICB9KSk7XHJcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgbmV3TE8pKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2V0UHJlZml4T2Zmc2V0RGlhbG9nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2V0IE5ldyBQcmVmaXggT2Zmc2V0Jywge1xyXG4gICAgdGV4dDogYXBpLnRyYW5zbGF0ZSgnSW5zZXJ0IG5ldyBwcmVmaXggb2Zmc2V0IGZvciBtb2RsZXRzIChBQUEtWlpaKTonKSxcclxuICAgIGlucHV0OiBbXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJzdkdGRwcmVmaXhvZmZzZXRpbnB1dCcsXHJcbiAgICAgICAgbGFiZWw6ICdQcmVmaXggT2Zmc2V0JyxcclxuICAgICAgICB0eXBlOiAndGV4dCcsXHJcbiAgICAgICAgcGxhY2Vob2xkZXI6ICdBQUEnLFxyXG4gICAgICB9XSxcclxuICB9LCBbIHsgbGFiZWw6ICdDYW5jZWwnIH0sIHsgbGFiZWw6ICdTZXQnLCBkZWZhdWx0OiB0cnVlIH0gXSlcclxuICAudGhlbihyZXN1bHQgPT4ge1xyXG4gICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdTZXQnKSB7XHJcbiAgICAgIGNvbnN0IHByZWZpeCA9IHJlc3VsdC5pbnB1dFsnN2R0ZHByZWZpeG9mZnNldGlucHV0J107XHJcbiAgICAgIGxldCBvZmZzZXQgPSAwO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIG9mZnNldCA9IHJldmVyc2VQcmVmaXgocHJlZml4KTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcclxuICAgICAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8gSG93ID9cclxuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdObyBhY3RpdmUgcHJvZmlsZSBmb3IgN2R0ZCcsIHVuZGVmaW5lZCwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UHJlZml4T2Zmc2V0KHByb2ZpbGVJZCwgb2Zmc2V0KSk7XHJcbiAgICAgIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcclxuICAgICAgY29uc3QgbmV3TE8gPSBsb2FkT3JkZXIubWFwKGVudHJ5ID0+ICh7XHJcbiAgICAgICAgLi4uZW50cnksXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgcHJlZml4OiBtYWtlUHJlZml4KHJldmVyc2VQcmVmaXgoZW50cnkuZGF0YS5wcmVmaXgpICsgb2Zmc2V0KSxcclxuICAgICAgICB9LFxyXG4gICAgICB9KSk7XHJcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIG5ld0xPKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfSlcclxuICAuY2F0Y2goZXJyID0+IHtcclxuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBzZXQgcHJlZml4IG9mZnNldCcsIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGZpbmRHYW1lKCkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbU1RFQU1fSURdKVxyXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcGFyc2VBZGRpdGlvbmFsUGFyYW1ldGVycyhwYXJhbWV0ZXJzOiBzdHJpbmcpIHtcclxuICBjb25zdCB1ZGZQYXJhbSA9IHBhcmFtZXRlcnMuc3BsaXQoJy0nKS5maW5kKHBhcmFtID0+IHBhcmFtLnN0YXJ0c1dpdGgoJ1VzZXJEYXRhRm9sZGVyPScpKTtcclxuICBjb25zdCB1ZGYgPSB1ZGZQYXJhbSA/IHVkZlBhcmFtLnNwbGl0KCc9Jyk/LlsxXT8udHJpbUVuZCgpIDogdW5kZWZpbmVkO1xyXG4gIHJldHVybiAodWRmICYmIHBhdGguaXNBYnNvbHV0ZSh1ZGYpKSA/IHVkZiA6IHVuZGVmaW5lZDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xyXG4gIGNvbnN0IHJlcXVpcmVzUmVzdGFydCA9IHV0aWwuZ2V0U2FmZShjb250ZXh0LmFwaS5nZXRTdGF0ZSgpLFxyXG4gICAgWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJywgJ3VkZiddLCB1bmRlZmluZWQpID09PSB1bmRlZmluZWQ7XHJcbiAgY29uc3QgbGF1bmNoZXJTZXR0aW5ncyA9IGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCgpO1xyXG4gIGNvbnN0IHJlbGF1bmNoRXh0ID0gKCkgPT4ge1xyXG4gICAgcmV0dXJuIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnUmVzdGFydCBSZXF1aXJlZCcsIHtcclxuICAgICAgdGV4dDogJ1RoZSBleHRlbnNpb24gcmVxdWlyZXMgYSByZXN0YXJ0IHRvIGNvbXBsZXRlIHRoZSBVREYgc2V0dXAuICdcclxuICAgICAgICAgICsgJ1RoZSBleHRlbnNpb24gd2lsbCBub3cgZXhpdCAtIHBsZWFzZSByZS1hY3RpdmF0ZSBpdCB2aWEgdGhlIGdhbWVzIHBhZ2Ugb3IgZGFzaGJvYXJkLicsXHJcbiAgICB9LCBbIHsgbGFiZWw6ICdSZXN0YXJ0IEV4dGVuc2lvbicgfSBdKVxyXG4gICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdSZXN0YXJ0IHJlcXVpcmVkJykpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIGNvbnN0IHNlbGVjdFVERiA9IGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnQ2hvb3NlIFVzZXIgRGVmaW5lZCBGb2xkZXInLCB7XHJcbiAgICAgIHRleHQ6ICdUaGUgbW9kZGluZyBwYXR0ZXJuIGZvciA3RFREIGlzIGNoYW5naW5nLiBUaGUgTW9kcyBwYXRoIGluc2lkZSB0aGUgZ2FtZSBkaXJlY3RvcnkgJ1xyXG4gICAgICAgICAgKyAnaXMgYmVpbmcgZGVwcmVjYXRlZCBhbmQgbW9kcyBsb2NhdGVkIGluIHRoZSBvbGQgcGF0aCB3aWxsIG5vIGxvbmdlciB3b3JrIGluIHRoZSBuZWFyICdcclxuICAgICAgICAgICsgJ2Z1dHVyZS4gUGxlYXNlIHNlbGVjdCB5b3VyIFVzZXIgRGVmaW5lZCBGb2xkZXIgKFVERikgLSBWb3J0ZXggd2lsbCBkZXBsb3kgdG8gdGhpcyBuZXcgbG9jYXRpb24uJyxcclxuICAgIH0sXHJcbiAgICBbXHJcbiAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdTZWxlY3QgVURGJyB9LFxyXG4gICAgXSk7XHJcbiAgICBpZiAocmVzLmFjdGlvbiAhPT0gJ1NlbGVjdCBVREYnKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0Nhbm5vdCBwcm9jZWVkIHdpdGhvdXQgVUZEJykpO1xyXG4gICAgfVxyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUobGF1bmNoZXJTZXR0aW5ncykpO1xyXG4gICAgYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQpO1xyXG4gICAgY29uc3QgZGlyZWN0b3J5ID0gYXdhaXQgY29udGV4dC5hcGkuc2VsZWN0RGlyKHtcclxuICAgICAgdGl0bGU6ICdTZWxlY3QgVXNlciBEYXRhIEZvbGRlcicsXHJcbiAgICAgIGRlZmF1bHRQYXRoOiBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGxhdW5jaGVyU2V0dGluZ3MpKSxcclxuICAgIH0pO1xyXG4gICAgaWYgKCFkaXJlY3RvcnkpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQ2Fubm90IHByb2NlZWQgd2l0aG91dCBVRkQnKSk7XHJcbiAgICB9XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXJlY3RvcnksICdNb2RzJykpO1xyXG4gICAgY29uc3QgbGF1bmNoZXIgPSBERUZBVUxUX0xBVU5DSEVSX1NFVFRJTkdTO1xyXG4gICAgbGF1bmNoZXIuRGVmYXVsdFJ1bkNvbmZpZy5BZGRpdGlvbmFsUGFyYW1ldGVycyA9IGAtVXNlckRhdGFGb2xkZXI9JHtkaXJlY3Rvcnl9YDtcclxuICAgIGNvbnN0IGxhdW5jaGVyRGF0YSA9IEpTT04uc3RyaW5naWZ5KGxhdW5jaGVyLCBudWxsLCAyKTtcclxuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxhdW5jaGVyU2V0dGluZ3MsIGxhdW5jaGVyRGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0VURGKGRpcmVjdG9yeSkpO1xyXG4gICAgcmV0dXJuIChyZXF1aXJlc1Jlc3RhcnQpID8gcmVsYXVuY2hFeHQoKSA6IFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH07XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsYXVuY2hlclNldHRpbmdzLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb25zdCBzZXR0aW5ncyA9IEpTT04ucGFyc2UoZGF0YSk7XHJcbiAgICBpZiAoc2V0dGluZ3M/LkRlZmF1bHRSdW5Db25maWc/LkFkZGl0aW9uYWxQYXJhbWV0ZXJzICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgY29uc3QgdWRmID0gcGFyc2VBZGRpdGlvbmFsUGFyYW1ldGVycyhzZXR0aW5ncy5EZWZhdWx0UnVuQ29uZmlnLkFkZGl0aW9uYWxQYXJhbWV0ZXJzKTtcclxuICAgICAgaWYgKCEhdWRmKSB7XHJcbiAgICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4odWRmLCAnTW9kcycpKTtcclxuICAgICAgICBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XHJcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0VURGKHVkZikpO1xyXG4gICAgICAgIHJldHVybiAocmVxdWlyZXNSZXN0YXJ0KSA/IHJlbGF1bmNoRXh0KCkgOiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gc2VsZWN0VURGKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBzZWxlY3RVREYoKTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xyXG4gIC8vIFRoZSBtb2RpbmZvLnhtbCBmaWxlIGlzIGV4cGVjdGVkIHRvIGFsd2F5cyBiZSBwb3NpdGlvbmVkIGluIHRoZSByb290IGRpcmVjdG9yeVxyXG4gIC8vICBvZiB0aGUgbW9kIGl0c2VsZjsgd2UncmUgZ29pbmcgdG8gZGlzcmVnYXJkIGFueXRoaW5nIHBsYWNlZCBvdXRzaWRlIHRoZSByb290LlxyXG4gIGNvbnN0IG1vZEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfSU5GTyk7XHJcbiAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmRpcm5hbWUobW9kRmlsZSk7XHJcbiAgcmV0dXJuIGdldE1vZE5hbWUocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kRmlsZSkpXHJcbiAgICAudGhlbihtb2ROYW1lID0+IHtcclxuICAgICAgbW9kTmFtZSA9IG1vZE5hbWUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICcnKTtcclxuXHJcbiAgICAgIC8vIFJlbW92ZSBkaXJlY3RvcmllcyBhbmQgYW55dGhpbmcgdGhhdCBpc24ndCBpbiB0aGUgcm9vdFBhdGggKGFsc28gZGlyZWN0b3JpZXMpLlxyXG4gICAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlUGF0aCA9PlxyXG4gICAgICAgIGZpbGVQYXRoLnN0YXJ0c1dpdGgocm9vdFBhdGgpICYmICFmaWxlUGF0aC5lbmRzV2l0aChwYXRoLnNlcCkpO1xyXG5cclxuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbHRlcmVkLm1hcChmaWxlUGF0aCA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5yZWxhdGl2ZShyb290UGF0aCwgZmlsZVBhdGgpLFxyXG4gICAgICAgIH07XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkQ29udGVudChmaWxlcywgZ2FtZUlkKSB7XHJcbiAgLy8gTWFrZSBzdXJlIHdlJ3JlIGFibGUgdG8gc3VwcG9ydCB0aGlzIG1vZC5cclxuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKSAmJlxyXG4gICAgKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPKSAhPT0gdW5kZWZpbmVkKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaW5kQ2FuZEZpbGUoZmlsZXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcclxuICByZXR1cm4gZmlsZXMuZmluZChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcClcclxuICAgIC5maW5kKHNlZyA9PiBST09UX01PRF9DQU5ESURBVEVTLmluY2x1ZGVzKHNlZykpICE9PSB1bmRlZmluZWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBoYXNDYW5kaWRhdGUoZmlsZXM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XHJcbiAgY29uc3QgY2FuZGlkYXRlID0gZmluZENhbmRGaWxlKGZpbGVzKTtcclxuICByZXR1cm4gY2FuZGlkYXRlICE9PSB1bmRlZmluZWQ7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxSb290TW9kKGZpbGVzOiBzdHJpbmdbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkpO1xyXG4gIGNvbnN0IGNhbmRpZGF0ZSA9IGZpbmRDYW5kRmlsZShmaWxlcyk7XHJcbiAgY29uc3QgY2FuZElkeCA9IGNhbmRpZGF0ZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKVxyXG4gICAgLmZpbmRJbmRleChzZWcgPT4gUk9PVF9NT0RfQ0FORElEQVRFUy5pbmNsdWRlcyhzZWcpKTtcclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gZmlsdGVyZWQucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xyXG4gICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgc291cmNlOiBpdGVyLFxyXG4gICAgICBkZXN0aW5hdGlvbjogaXRlci5zcGxpdChwYXRoLnNlcCkuc2xpY2UoY2FuZElkeCkuam9pbihwYXRoLnNlcCksXHJcbiAgICB9KTtcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gdGVzdFJvb3RNb2QoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgICBzdXBwb3J0ZWQ6IGhhc0NhbmRpZGF0ZShmaWxlcykgJiYgZ2FtZUlkID09PSBHQU1FX0lELFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0b0xPUHJlZml4KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBtb2Q6IHR5cGVzLklNb2QpOiBzdHJpbmcge1xyXG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcclxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuICdaWlpaLScgKyBtb2QuaWQ7XHJcbiAgfVxyXG5cclxuICAvLyBSZXRyaWV2ZSB0aGUgbG9hZCBvcmRlciBhcyBzdG9yZWQgaW4gVm9ydGV4J3MgYXBwbGljYXRpb24gc3RhdGUuXHJcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvcHMucHJvZmlsZS5pZF0sIFtdKTtcclxuXHJcbiAgLy8gRmluZCB0aGUgbW9kIGVudHJ5IGluIHRoZSBsb2FkIG9yZGVyIHN0YXRlIGFuZCBpbnNlcnQgdGhlIHByZWZpeCBpbiBmcm9udFxyXG4gIC8vICBvZiB0aGUgbW9kJ3MgbmFtZS9pZC93aGF0ZXZlclxyXG4gIGxldCBsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnkgPSBsb2FkT3JkZXIuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IG1vZC5pZCk7XHJcbiAgaWYgKGxvRW50cnkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgLy8gVGhlIG1vZCBlbnRyeSB3YXNuJ3QgZm91bmQgaW4gdGhlIGxvYWQgb3JkZXIgc3RhdGUgLSB0aGlzIGlzIHBvdGVudGlhbGx5XHJcbiAgICAvLyAgZHVlIHRvIHRoZSBtb2QgYmVpbmcgcmVtb3ZlZCBhcyBwYXJ0IG9mIGFuIHVwZGF0ZSBvciB1bmluc3RhbGxhdGlvbi5cclxuICAgIC8vICBJdCdzIGltcG9ydGFudCB3ZSBmaW5kIHRoZSBwcmVmaXggb2YgdGhlIG1vZCBpbiB0aGlzIGNhc2UsIGFzIHRoZSBkZXBsb3ltZW50XHJcbiAgICAvLyAgbWV0aG9kIGNvdWxkIHBvdGVudGlhbGx5IGZhaWwgdG8gcmVtb3ZlIHRoZSBtb2QhIFdlJ3JlIGdvaW5nIHRvIGNoZWNrXHJcbiAgICAvLyAgdGhlIHByZXZpb3VzIGxvYWQgb3JkZXIgc2F2ZWQgZm9yIHRoaXMgcHJvZmlsZSBhbmQgdXNlIHRoYXQgaWYgaXQgZXhpc3RzLlxyXG4gICAgY29uc3QgcHJldiA9IHV0aWwuZ2V0U2FmZShwcm9wcy5zdGF0ZSwgWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJywgJ3ByZXZpb3VzTE8nLCBwcm9wcy5wcm9maWxlLmlkXSwgW10pO1xyXG4gICAgbG9FbnRyeSA9IHByZXYuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IG1vZC5pZCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKGxvRW50cnk/LmRhdGE/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBsb0VudHJ5LmRhdGEucHJlZml4ICsgJy0nICsgbW9kLmlkXHJcbiAgICA6ICdaWlpaLScgKyBtb2QuaWQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlcXVpcmVzTGF1bmNoZXIoZ2FtZVBhdGgpIHtcclxuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGdhbWVQYXRoKVxyXG4gICAgLnRoZW4oZmlsZXMgPT4gKGZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLmVuZHNXaXRoKFNURUFNX0RMTCkpICE9PSB1bmRlZmluZWQpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHsgbGF1bmNoZXI6ICdzdGVhbScgfSlcclxuICAgICAgOiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSlcclxuICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIEluZm9QYW5lbChwcm9wcykge1xyXG4gIGNvbnN0IHsgdCwgY3VycmVudE9mZnNldCB9ID0gcHJvcHM7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIHBhZGRpbmc6ICcxNnB4JyB9fT5cclxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cclxuICAgICAgICB7dCgnQ3VycmVudCBQcmVmaXggT2Zmc2V0OiAnKX1cclxuICAgICAgICA8aHIvPlxyXG4gICAgICAgIDxsYWJlbCBzdHlsZT17eyBjb2xvcjogJ3JlZCcgfX0+e2N1cnJlbnRPZmZzZXR9PC9sYWJlbD5cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxoci8+XHJcbiAgICAgIDxkaXY+XHJcbiAgICAgICAge3QoJzcgRGF5cyB0byBEaWUgbG9hZHMgbW9kcyBpbiBhbHBoYWJldGljIG9yZGVyIHNvIFZvcnRleCBwcmVmaXhlcyAnXHJcbiAgICAgICAgICsgJ3RoZSBkaXJlY3RvcnkgbmFtZXMgd2l0aCBcIkFBQSwgQUFCLCBBQUMsIC4uLlwiIHRvIGVuc3VyZSB0aGV5IGxvYWQgaW4gdGhlIG9yZGVyIHlvdSBzZXQgaGVyZS4nKX1cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBJbmZvUGFuZWxXcmFwKHByb3BzOiB7IGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcHJvZmlsZUlkOiBzdHJpbmcgfSkge1xyXG4gIGNvbnN0IHsgYXBpLCBwcm9maWxlSWQgfSA9IHByb3BzO1xyXG4gIGNvbnN0IGN1cnJlbnRPZmZzZXQgPSB1c2VTZWxlY3Rvcigoc3RhdGU6IHR5cGVzLklTdGF0ZSkgPT5cclxuICAgIG1ha2VQcmVmaXgodXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgICBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAncHJlZml4T2Zmc2V0JywgcHJvZmlsZUlkXSwgMCkpKTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxJbmZvUGFuZWxcclxuICAgICAgdD17YXBpLnRyYW5zbGF0ZX1cclxuICAgICAgY3VycmVudE9mZnNldD17Y3VycmVudE9mZnNldH1cclxuICAgIC8+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xyXG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZSddLCByZWR1Y2VyKTtcclxuXHJcbiAgY29uc3QgZ2V0TW9kc1BhdGggPSAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCB1ZGYgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICd1ZGYnXSwgdW5kZWZpbmVkKTtcclxuICAgIHJldHVybiB1ZGYgIT09IHVuZGVmaW5lZCA/IHBhdGguam9pbih1ZGYsICdNb2RzJykgOiAnTW9kcyc7XHJcbiAgfVxyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZSh7XHJcbiAgICBpZDogR0FNRV9JRCxcclxuICAgIG5hbWU6ICc3IERheXMgdG8gRGllJyxcclxuICAgIG1lcmdlTW9kczogKG1vZCkgPT4gdG9MT1ByZWZpeChjb250ZXh0LCBtb2QpLFxyXG4gICAgcXVlcnlQYXRoOiB0b0JsdWUoZmluZEdhbWUpLFxyXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtdLFxyXG4gICAgcXVlcnlNb2RQYXRoOiBnZXRNb2RzUGF0aCxcclxuICAgIGxvZ286ICdnYW1lYXJ0LmpwZycsXHJcbiAgICBleGVjdXRhYmxlOiBnYW1lRXhlY3V0YWJsZSxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgZ2FtZUV4ZWN1dGFibGUoKSxcclxuICAgIF0sXHJcbiAgICByZXF1aXJlc0xhdW5jaGVyLFxyXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcclxuICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxyXG4gICAgfSxcclxuICAgIGRldGFpbHM6IHtcclxuICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxyXG4gICAgICBoYXNoRmlsZXM6IFsnN0RheXNUb0RpZV9EYXRhL01hbmFnZWQvQXNzZW1ibHktQ1NoYXJwLmRsbCddLFxyXG4gICAgfSxcclxuICB9KTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XHJcbiAgICBkZXNlcmlhbGl6ZUxvYWRPcmRlcjogKCkgPT4gZGVzZXJpYWxpemUoY29udGV4dCksXHJcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6ICgobG9hZE9yZGVyLCBwcmV2KSA9PiBzZXJpYWxpemUoY29udGV4dCwgbG9hZE9yZGVyLCBwcmV2KSkgYXMgYW55LFxyXG4gICAgdmFsaWRhdGUsXHJcbiAgICBnYW1lSWQ6IEdBTUVfSUQsXHJcbiAgICB0b2dnbGVhYmxlRW50cmllczogZmFsc2UsXHJcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+IHtcclxuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xyXG4gICAgICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIDxJbmZvUGFuZWxXcmFwIGFwaT17Y29udGV4dC5hcGl9IHByb2ZpbGVJZD17cHJvZmlsZUlkfSAvPlxyXG4gICAgICApO1xyXG4gICAgfSkgYXMgYW55LFxyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUwLCAnbG9vdC1zb3J0Jywge30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAnUHJlZml4IE9mZnNldCBBc3NpZ24nLCAoKSA9PiB7XHJcbiAgICBzZXRQcmVmaXhPZmZzZXREaWFsb2coY29udGV4dC5hcGkpO1xyXG4gIH0sICgpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xyXG4gIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUwLCAnbG9vdC1zb3J0Jywge30sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAnUHJlZml4IE9mZnNldCBSZXNldCcsICgpID0+IHtcclxuICAgIHJlc2V0UHJlZml4T2Zmc2V0KGNvbnRleHQuYXBpKTtcclxuICB9LCAoKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBhY3RpdmVHYW1lID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgICByZXR1cm4gYWN0aXZlR2FtZSA9PT0gR0FNRV9JRDtcclxuICB9KTtcclxuXHJcbiAgY29uc3QgZ2V0T3ZlcmhhdWxQYXRoID0gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIHJldHVybiBkaXNjb3Zlcnk/LnBhdGg7XHJcbiAgfTtcclxuXHJcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignN2R0ZC1tb2QnLCAyNSxcclxuICAgIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkQ29udGVudCksIHRvQmx1ZShpbnN0YWxsQ29udGVudCkpO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCc3ZHRkLXJvb3QtbW9kJywgMjAsIHRvQmx1ZSh0ZXN0Um9vdE1vZCksIHRvQmx1ZShpbnN0YWxsUm9vdE1vZCkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNb2RUeXBlKCc3ZHRkLXJvb3QtbW9kJywgMjAsIChnYW1lSWQpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcclxuICAgIGdldE92ZXJoYXVsUGF0aCwgKGluc3RydWN0aW9ucykgPT4ge1xyXG4gICAgICBjb25zdCBjYW5kaWRhdGVGb3VuZCA9IGhhc0NhbmRpZGF0ZShpbnN0cnVjdGlvbnNcclxuICAgICAgICAuZmlsdGVyKGluc3RyID0+ICEhaW5zdHIuZGVzdGluYXRpb24pXHJcbiAgICAgICAgLm1hcChpbnN0ciA9PiBpbnN0ci5kZXN0aW5hdGlvbikpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhbmRpZGF0ZUZvdW5kKSBhcyBhbnk7XHJcbiAgICB9LFxyXG4gICAgICB7IG5hbWU6ICdSb290IERpcmVjdG9yeSBNb2QnLCBtZXJnZU1vZHM6IHRydWUsIGRlcGxveW1lbnRFc3NlbnRpYWw6IGZhbHNlIH0pO1xyXG5cclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGQgPT4gbWlncmF0ZTAyMChjb250ZXh0LmFwaSwgb2xkKSkpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24odG9CbHVlKG9sZCA9PiBtaWdyYXRlMTAwKGNvbnRleHQsIG9sZCkpKTtcclxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGQgPT4gbWlncmF0ZTEwMTEoY29udGV4dCwgb2xkKSkpO1xyXG5cclxuICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgZGVmYXVsdDogbWFpbixcclxufTtcclxuIl19