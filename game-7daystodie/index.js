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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUF3QjtBQUN4Qiw2Q0FBMEM7QUFDMUMsMkNBQWlFO0FBRWpFLDZDQUErQjtBQUUvQix1Q0FBb0Q7QUFDcEQseUNBQXFDO0FBRXJDLHFDQUFrSDtBQUNsSCwyQ0FBK0Q7QUFDL0QsNkNBQW1FO0FBRW5FLGlDQUErRjtBQUUvRixNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDMUIsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUM7QUFFdEMsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBRXhDLFNBQVMsaUJBQWlCLENBQUMsR0FBd0I7O0lBQ2pELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLFNBQVMsR0FBRyxNQUFBLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxFQUFFLENBQUM7SUFDckQsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFO1FBRTNCLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyw0QkFBNEIsRUFBRSxTQUFTLEVBQUUsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUMzRixPQUFPO0tBQ1I7SUFFRCxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEQsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzRixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsS0FB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QyxFQUNDLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUVqRixPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLHVCQUFVLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkUsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBQSx1QkFBVSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkUsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBQSx3QkFBVyxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFcEUsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5cbmltcG9ydCB7IHNldFByZWZpeE9mZnNldCwgc2V0VURGIH0gZnJvbSAnLi9hY3Rpb25zJztcbmltcG9ydCB7IHJlZHVjZXIgfSBmcm9tICcuL3JlZHVjZXJzJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgZ2FtZUV4ZWN1dGFibGUsIE1PRF9JTkZPLCBsYXVuY2hlclNldHRpbmdzRmlsZVBhdGgsIERFRkFVTFRfTEFVTkNIRVJfU0VUVElOR1MgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBkZXNlcmlhbGl6ZSwgc2VyaWFsaXplLCB2YWxpZGF0ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcbmltcG9ydCB7IG1pZ3JhdGUwMjAsIG1pZ3JhdGUxMDAsIG1pZ3JhdGUxMDExIH0gZnJvbSAnLi9taWdyYXRpb25zJztcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSVByb3BzIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBlbnN1cmVMT0ZpbGUsIGdlblByb3BzLCBnZXRNb2ROYW1lLCBtYWtlUHJlZml4LCByZXZlcnNlUHJlZml4LCB0b0JsdWUgfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBTVEVBTV9JRCA9ICcyNTE1NzAnO1xuY29uc3QgU1RFQU1fRExMID0gJ3N0ZWFtY2xpZW50NjQuZGxsJztcblxuY29uc3QgUk9PVF9NT0RfQ0FORElEQVRFUyA9IFsnYmVwaW5leCddO1xuXG5mdW5jdGlvbiByZXNldFByZWZpeE9mZnNldChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gSG93ID9cbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdObyBhY3RpdmUgcHJvZmlsZSBmb3IgN2R0ZCcsIHVuZGVmaW5lZCwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByZWZpeE9mZnNldChwcm9maWxlSWQsIDApKTtcbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgW10pO1xuICBjb25zdCBuZXdMTyA9IGxvYWRPcmRlci5tYXAoKGVudHJ5LCBpZHgpID0+ICh7XG4gICAgLi4uZW50cnksXG4gICAgZGF0YToge1xuICAgICAgcHJlZml4OiBtYWtlUHJlZml4KGlkeCksXG4gICAgfSxcbiAgfSkpO1xuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRMb2FkT3JkZXIocHJvZmlsZUlkLCBuZXdMTykpO1xufVxuXG5mdW5jdGlvbiBzZXRQcmVmaXhPZmZzZXREaWFsb2coYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnU2V0IE5ldyBQcmVmaXggT2Zmc2V0Jywge1xuICAgIHRleHQ6IGFwaS50cmFuc2xhdGUoJ0luc2VydCBuZXcgcHJlZml4IG9mZnNldCBmb3IgbW9kbGV0cyAoQUFBLVpaWik6JyksXG4gICAgaW5wdXQ6IFtcbiAgICAgIHtcbiAgICAgICAgaWQ6ICc3ZHRkcHJlZml4b2Zmc2V0aW5wdXQnLFxuICAgICAgICBsYWJlbDogJ1ByZWZpeCBPZmZzZXQnLFxuICAgICAgICB0eXBlOiAndGV4dCcsXG4gICAgICAgIHBsYWNlaG9sZGVyOiAnQUFBJyxcbiAgICAgIH1dLFxuICB9LCBbIHsgbGFiZWw6ICdDYW5jZWwnIH0sIHsgbGFiZWw6ICdTZXQnLCBkZWZhdWx0OiB0cnVlIH0gXSlcbiAgLnRoZW4ocmVzdWx0ID0+IHtcbiAgICBpZiAocmVzdWx0LmFjdGlvbiA9PT0gJ1NldCcpIHtcbiAgICAgIGNvbnN0IHByZWZpeCA9IHJlc3VsdC5pbnB1dFsnN2R0ZHByZWZpeG9mZnNldGlucHV0J107XG4gICAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9mZnNldCA9IHJldmVyc2VQcmVmaXgocHJlZml4KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xuICAgICAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIEhvdyA/XG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ05vIGFjdGl2ZSBwcm9maWxlIGZvciA3ZHRkJywgdW5kZWZpbmVkLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UHJlZml4T2Zmc2V0KHByb2ZpbGVJZCwgb2Zmc2V0KSk7XG4gICAgICBjb25zdCBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSk7XG4gICAgICBjb25zdCBuZXdMTyA9IGxvYWRPcmRlci5tYXAoZW50cnkgPT4gKHtcbiAgICAgICAgLi4uZW50cnksXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBwcmVmaXg6IG1ha2VQcmVmaXgocmV2ZXJzZVByZWZpeChlbnRyeS5kYXRhLnByZWZpeCkgKyBvZmZzZXQpLFxuICAgICAgICB9LFxuICAgICAgfSkpO1xuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgbmV3TE8pKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9KVxuICAuY2F0Y2goZXJyID0+IHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc2V0IHByZWZpeCBvZmZzZXQnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZpbmRHYW1lKCkge1xuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW1NURUFNX0lEXSlcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xufVxuXG5mdW5jdGlvbiBwYXJzZUFkZGl0aW9uYWxQYXJhbWV0ZXJzKHBhcmFtZXRlcnM6IHN0cmluZykge1xuICBjb25zdCB1ZGZQYXJhbSA9IHBhcmFtZXRlcnMuc3BsaXQoJy0nKS5maW5kKHBhcmFtID0+IHBhcmFtLnN0YXJ0c1dpdGgoJ1VzZXJEYXRhRm9sZGVyPScpKTtcbiAgY29uc3QgdWRmID0gdWRmUGFyYW0gPyB1ZGZQYXJhbS5zcGxpdCgnPScpPy5bMV0/LnRyaW1FbmQoKSA6IHVuZGVmaW5lZDtcbiAgcmV0dXJuICh1ZGYgJiYgcGF0aC5pc0Fic29sdXRlKHVkZikpID8gdWRmIDogdW5kZWZpbmVkO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCkge1xuICBjb25zdCByZXF1aXJlc1Jlc3RhcnQgPSB1dGlsLmdldFNhZmUoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSxcbiAgICBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAndWRmJ10sIHVuZGVmaW5lZCkgPT09IHVuZGVmaW5lZDtcbiAgY29uc3QgbGF1bmNoZXJTZXR0aW5ncyA9IGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCgpO1xuICBjb25zdCByZWxhdW5jaEV4dCA9ICgpID0+IHtcbiAgICByZXR1cm4gY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdSZXN0YXJ0IFJlcXVpcmVkJywge1xuICAgICAgdGV4dDogJ1RoZSBleHRlbnNpb24gcmVxdWlyZXMgYSByZXN0YXJ0IHRvIGNvbXBsZXRlIHRoZSBVREYgc2V0dXAuICdcbiAgICAgICAgICArICdUaGUgZXh0ZW5zaW9uIHdpbGwgbm93IGV4aXQgLSBwbGVhc2UgcmUtYWN0aXZhdGUgaXQgdmlhIHRoZSBnYW1lcyBwYWdlIG9yIGRhc2hib2FyZC4nLFxuICAgIH0sIFsgeyBsYWJlbDogJ1Jlc3RhcnQgRXh0ZW5zaW9uJyB9IF0pXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnUmVzdGFydCByZXF1aXJlZCcpKTtcbiAgICB9KTtcbiAgfVxuICBjb25zdCBzZWxlY3RVREYgPSBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdDaG9vc2UgVXNlciBEZWZpbmVkIEZvbGRlcicsIHtcbiAgICAgIHRleHQ6ICdUaGUgbW9kZGluZyBwYXR0ZXJuIGZvciA3RFREIGlzIGNoYW5naW5nLiBUaGUgTW9kcyBwYXRoIGluc2lkZSB0aGUgZ2FtZSBkaXJlY3RvcnkgJ1xuICAgICAgICAgICsgJ2lzIGJlaW5nIGRlcHJlY2F0ZWQgYW5kIG1vZHMgbG9jYXRlZCBpbiB0aGUgb2xkIHBhdGggd2lsbCBubyBsb25nZXIgd29yayBpbiB0aGUgbmVhciAnXG4gICAgICAgICAgKyAnZnV0dXJlLiBQbGVhc2Ugc2VsZWN0IHlvdXIgVXNlciBEZWZpbmVkIEZvbGRlciAoVURGKSAtIFZvcnRleCB3aWxsIGRlcGxveSB0byB0aGlzIG5ldyBsb2NhdGlvbi4nLFxuICAgIH0sXG4gICAgW1xuICAgICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcbiAgICAgIHsgbGFiZWw6ICdTZWxlY3QgVURGJyB9LFxuICAgIF0pO1xuICAgIGlmIChyZXMuYWN0aW9uICE9PSAnU2VsZWN0IFVERicpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0Nhbm5vdCBwcm9jZWVkIHdpdGhvdXQgVUZEJykpO1xuICAgIH1cbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShsYXVuY2hlclNldHRpbmdzKSk7XG4gICAgYXdhaXQgZW5zdXJlTE9GaWxlKGNvbnRleHQpO1xuICAgIGNvbnN0IGRpcmVjdG9yeSA9IGF3YWl0IGNvbnRleHQuYXBpLnNlbGVjdERpcih7XG4gICAgICB0aXRsZTogJ1NlbGVjdCBVc2VyIERhdGEgRm9sZGVyJyxcbiAgICAgIGRlZmF1bHRQYXRoOiBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGxhdW5jaGVyU2V0dGluZ3MpKSxcbiAgICB9KTtcbiAgICBpZiAoIWRpcmVjdG9yeSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQ2Fubm90IHByb2NlZWQgd2l0aG91dCBVRkQnKSk7XG4gICAgfVxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpcmVjdG9yeSwgJ01vZHMnKSk7XG4gICAgY29uc3QgbGF1bmNoZXIgPSBERUZBVUxUX0xBVU5DSEVSX1NFVFRJTkdTO1xuICAgIGxhdW5jaGVyLkRlZmF1bHRSdW5Db25maWcuQWRkaXRpb25hbFBhcmFtZXRlcnMgPSBgLVVzZXJEYXRhRm9sZGVyPSR7ZGlyZWN0b3J5fWA7XG4gICAgY29uc3QgbGF1bmNoZXJEYXRhID0gSlNPTi5zdHJpbmdpZnkobGF1bmNoZXIsIG51bGwsIDIpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxhdW5jaGVyU2V0dGluZ3MsIGxhdW5jaGVyRGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFVERihkaXJlY3RvcnkpKTtcbiAgICByZXR1cm4gKHJlcXVpcmVzUmVzdGFydCkgPyByZWxhdW5jaEV4dCgpIDogUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH07XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsYXVuY2hlclNldHRpbmdzLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgIGlmIChzZXR0aW5ncz8uRGVmYXVsdFJ1bkNvbmZpZz8uQWRkaXRpb25hbFBhcmFtZXRlcnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgdWRmID0gcGFyc2VBZGRpdGlvbmFsUGFyYW1ldGVycyhzZXR0aW5ncy5EZWZhdWx0UnVuQ29uZmlnLkFkZGl0aW9uYWxQYXJhbWV0ZXJzKTtcbiAgICAgIGlmICghIXVkZikge1xuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbih1ZGYsICdNb2RzJykpO1xuICAgICAgICBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFVERih1ZGYpKTtcbiAgICAgICAgcmV0dXJuIChyZXF1aXJlc1Jlc3RhcnQpID8gcmVsYXVuY2hFeHQoKSA6IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNlbGVjdFVERigpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHNlbGVjdFVERigpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIC8vIFRoZSBtb2RpbmZvLnhtbCBmaWxlIGlzIGV4cGVjdGVkIHRvIGFsd2F5cyBiZSBwb3NpdGlvbmVkIGluIHRoZSByb290IGRpcmVjdG9yeVxuICAvLyAgb2YgdGhlIG1vZCBpdHNlbGY7IHdlJ3JlIGdvaW5nIHRvIGRpc3JlZ2FyZCBhbnl0aGluZyBwbGFjZWQgb3V0c2lkZSB0aGUgcm9vdC5cbiAgY29uc3QgbW9kRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPKTtcbiAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmRpcm5hbWUobW9kRmlsZSk7XG4gIHJldHVybiBnZXRNb2ROYW1lKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1vZEZpbGUpKVxuICAgIC50aGVuKG1vZE5hbWUgPT4ge1xuICAgICAgbW9kTmFtZSA9IG1vZE5hbWUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICcnKTtcblxuICAgICAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIGFuZCBhbnl0aGluZyB0aGF0IGlzbid0IGluIHRoZSByb290UGF0aCAoYWxzbyBkaXJlY3RvcmllcykuXG4gICAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlUGF0aCA9PlxuICAgICAgICBmaWxlUGF0aC5zdGFydHNXaXRoKHJvb3RQYXRoKSAmJiAhZmlsZVBhdGguZW5kc1dpdGgocGF0aC5zZXApKTtcblxuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbHRlcmVkLm1hcChmaWxlUGF0aCA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGgucmVsYXRpdmUocm9vdFBhdGgsIGZpbGVQYXRoKSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkQ29udGVudChmaWxlcywgZ2FtZUlkKSB7XG4gIC8vIE1ha2Ugc3VyZSB3ZSdyZSBhYmxlIHRvIHN1cHBvcnQgdGhpcyBtb2QuXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpICYmXG4gICAgKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPKSAhPT0gdW5kZWZpbmVkKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZENhbmRGaWxlKGZpbGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKVxuICAgIC5maW5kKHNlZyA9PiBST09UX01PRF9DQU5ESURBVEVTLmluY2x1ZGVzKHNlZykpICE9PSB1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBoYXNDYW5kaWRhdGUoZmlsZXM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IGZpbmRDYW5kRmlsZShmaWxlcyk7XG4gIHJldHVybiBjYW5kaWRhdGUgIT09IHVuZGVmaW5lZDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFJvb3RNb2QoZmlsZXM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApKTtcbiAgY29uc3QgY2FuZGlkYXRlID0gZmluZENhbmRGaWxlKGZpbGVzKTtcbiAgY29uc3QgY2FuZElkeCA9IGNhbmRpZGF0ZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKVxuICAgIC5maW5kSW5kZXgoc2VnID0+IFJPT1RfTU9EX0NBTkRJREFURVMuaW5jbHVkZXMoc2VnKSk7XG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWx0ZXJlZC5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XG4gICAgYWNjdW0ucHVzaCh7XG4gICAgICB0eXBlOiAnY29weScsXG4gICAgICBzb3VyY2U6IGl0ZXIsXG4gICAgICBkZXN0aW5hdGlvbjogaXRlci5zcGxpdChwYXRoLnNlcCkuc2xpY2UoY2FuZElkeCkuam9pbihwYXRoLnNlcCksXG4gICAgfSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCBbXSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRlc3RSb290TW9kKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgcmVxdWlyZWRGaWxlczogW10sXG4gICAgc3VwcG9ydGVkOiBoYXNDYW5kaWRhdGUoZmlsZXMpICYmIGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvTE9QcmVmaXgoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIG1vZDogdHlwZXMuSU1vZCk6IHN0cmluZyB7XG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ1paWlotJyArIG1vZC5pZDtcbiAgfVxuXG4gIC8vIFJldHJpZXZlIHRoZSBsb2FkIG9yZGVyIGFzIHN0b3JlZCBpbiBWb3J0ZXgncyBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvcHMucHJvZmlsZS5pZF0sIFtdKTtcblxuICAvLyBGaW5kIHRoZSBtb2QgZW50cnkgaW4gdGhlIGxvYWQgb3JkZXIgc3RhdGUgYW5kIGluc2VydCB0aGUgcHJlZml4IGluIGZyb250XG4gIC8vICBvZiB0aGUgbW9kJ3MgbmFtZS9pZC93aGF0ZXZlclxuICBsZXQgbG9FbnRyeTogSUxvYWRPcmRlckVudHJ5ID0gbG9hZE9yZGVyLmZpbmQobG9FbnRyeSA9PiBsb0VudHJ5LmlkID09PSBtb2QuaWQpO1xuICBpZiAobG9FbnRyeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gVGhlIG1vZCBlbnRyeSB3YXNuJ3QgZm91bmQgaW4gdGhlIGxvYWQgb3JkZXIgc3RhdGUgLSB0aGlzIGlzIHBvdGVudGlhbGx5XG4gICAgLy8gIGR1ZSB0byB0aGUgbW9kIGJlaW5nIHJlbW92ZWQgYXMgcGFydCBvZiBhbiB1cGRhdGUgb3IgdW5pbnN0YWxsYXRpb24uXG4gICAgLy8gIEl0J3MgaW1wb3J0YW50IHdlIGZpbmQgdGhlIHByZWZpeCBvZiB0aGUgbW9kIGluIHRoaXMgY2FzZSwgYXMgdGhlIGRlcGxveW1lbnRcbiAgICAvLyAgbWV0aG9kIGNvdWxkIHBvdGVudGlhbGx5IGZhaWwgdG8gcmVtb3ZlIHRoZSBtb2QhIFdlJ3JlIGdvaW5nIHRvIGNoZWNrXG4gICAgLy8gIHRoZSBwcmV2aW91cyBsb2FkIG9yZGVyIHNhdmVkIGZvciB0aGlzIHByb2ZpbGUgYW5kIHVzZSB0aGF0IGlmIGl0IGV4aXN0cy5cbiAgICBjb25zdCBwcmV2ID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLCBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAncHJldmlvdXNMTycsIHByb3BzLnByb2ZpbGUuaWRdLCBbXSk7XG4gICAgbG9FbnRyeSA9IHByZXYuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IG1vZC5pZCk7XG4gIH1cblxuICByZXR1cm4gKGxvRW50cnk/LmRhdGE/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxuICAgID8gbG9FbnRyeS5kYXRhLnByZWZpeCArICctJyArIG1vZC5pZFxuICAgIDogJ1paWlotJyArIG1vZC5pZDtcbn1cblxuZnVuY3Rpb24gcmVxdWlyZXNMYXVuY2hlcihnYW1lUGF0aCkge1xuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGdhbWVQYXRoKVxuICAgIC50aGVuKGZpbGVzID0+IChmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS5lbmRzV2l0aChTVEVBTV9ETEwpKSAhPT0gdW5kZWZpbmVkKVxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoeyBsYXVuY2hlcjogJ3N0ZWFtJyB9KVxuICAgICAgOiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSlcbiAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVqZWN0KGVycikpO1xufVxuXG5mdW5jdGlvbiBJbmZvUGFuZWwocHJvcHMpIHtcbiAgY29uc3QgeyB0LCBjdXJyZW50T2Zmc2V0IH0gPSBwcm9wcztcblxuICByZXR1cm4gKFxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgcGFkZGluZzogJzE2cHgnIH19PlxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cbiAgICAgICAge3QoJ0N1cnJlbnQgUHJlZml4IE9mZnNldDogJyl9XG4gICAgICAgIDxoci8+XG4gICAgICAgIDxsYWJlbCBzdHlsZT17eyBjb2xvcjogJ3JlZCcgfX0+e2N1cnJlbnRPZmZzZXR9PC9sYWJlbD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGhyLz5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KCc3IERheXMgdG8gRGllIGxvYWRzIG1vZHMgaW4gYWxwaGFiZXRpYyBvcmRlciBzbyBWb3J0ZXggcHJlZml4ZXMgJ1xuICAgICAgICAgKyAndGhlIGRpcmVjdG9yeSBuYW1lcyB3aXRoIFwiQUFBLCBBQUIsIEFBQywgLi4uXCIgdG8gZW5zdXJlIHRoZXkgbG9hZCBpbiB0aGUgb3JkZXIgeW91IHNldCBoZXJlLicpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmZ1bmN0aW9uIEluZm9QYW5lbFdyYXAocHJvcHM6IHsgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZyB9KSB7XG4gIGNvbnN0IHsgYXBpLCBwcm9maWxlSWQgfSA9IHByb3BzO1xuICBjb25zdCBjdXJyZW50T2Zmc2V0ID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XG4gICAgbWFrZVByZWZpeCh1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAncHJlZml4T2Zmc2V0JywgcHJvZmlsZUlkXSwgMCkpKTtcblxuICByZXR1cm4gKFxuICAgIDxJbmZvUGFuZWxcbiAgICAgIHQ9e2FwaS50cmFuc2xhdGV9XG4gICAgICBjdXJyZW50T2Zmc2V0PXtjdXJyZW50T2Zmc2V0fVxuICAgIC8+XG4gICk7XG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJ10sIHJlZHVjZXIpO1xuXG4gIGNvbnN0IGdldE1vZHNQYXRoID0gKCkgPT4ge1xuICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICBjb25zdCB1ZGYgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICd1ZGYnXSwgdW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdWRmICE9PSB1bmRlZmluZWQgPyBwYXRoLmpvaW4odWRmLCAnTW9kcycpIDogJ01vZHMnO1xuICB9XG5cbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xuICAgIGlkOiBHQU1FX0lELFxuICAgIG5hbWU6ICc3IERheXMgdG8gRGllJyxcbiAgICBtZXJnZU1vZHM6IChtb2QpID0+IHRvTE9QcmVmaXgoY29udGV4dCwgbW9kKSxcbiAgICBxdWVyeVBhdGg6IHRvQmx1ZShmaW5kR2FtZSksXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtdLFxuICAgIHF1ZXJ5TW9kUGF0aDogZ2V0TW9kc1BhdGgsXG4gICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcbiAgICBleGVjdXRhYmxlOiBnYW1lRXhlY3V0YWJsZSxcbiAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICBnYW1lRXhlY3V0YWJsZSgpLFxuICAgIF0sXG4gICAgcmVxdWlyZXNMYXVuY2hlcixcbiAgICBzZXR1cDogdG9CbHVlKChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSkpLFxuICAgIGVudmlyb25tZW50OiB7XG4gICAgICBTdGVhbUFQUElkOiBTVEVBTV9JRCxcbiAgICB9LFxuICAgIGRldGFpbHM6IHtcbiAgICAgIHN0ZWFtQXBwSWQ6ICtTVEVBTV9JRCxcbiAgICAgIGhhc2hGaWxlczogWyc3RGF5c1RvRGllX0RhdGEvTWFuYWdlZC9Bc3NlbWJseS1DU2hhcnAuZGxsJ10sXG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplKGNvbnRleHQpLFxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKChsb2FkT3JkZXIsIHByZXYpID0+IHNlcmlhbGl6ZShjb250ZXh0LCBsb2FkT3JkZXIsIHByZXYpKSBhcyBhbnksXG4gICAgdmFsaWRhdGUsXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxuICAgIHRvZ2dsZWFibGVFbnRyaWVzOiBmYWxzZSxcbiAgICB1c2FnZUluc3RydWN0aW9uczogKCgpID0+IHtcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XG4gICAgICBpZiAocHJvZmlsZUlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8SW5mb1BhbmVsV3JhcCBhcGk9e2NvbnRleHQuYXBpfSBwcm9maWxlSWQ9e3Byb2ZpbGVJZH0gLz5cbiAgICAgICk7XG4gICAgfSkgYXMgYW55LFxuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUwLCAnbG9vdC1zb3J0Jywge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ1ByZWZpeCBPZmZzZXQgQXNzaWduJywgKCkgPT4ge1xuICAgIHNldFByZWZpeE9mZnNldERpYWxvZyhjb250ZXh0LmFwaSk7XG4gIH0sICgpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgYWN0aXZlR2FtZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUwLCAnbG9vdC1zb3J0Jywge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ1ByZWZpeCBPZmZzZXQgUmVzZXQnLCAoKSA9PiB7XG4gICAgcmVzZXRQcmVmaXhPZmZzZXQoY29udGV4dC5hcGkpO1xuICB9LCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICByZXR1cm4gYWN0aXZlR2FtZSA9PT0gR0FNRV9JRDtcbiAgfSk7XG5cbiAgY29uc3QgZ2V0T3ZlcmhhdWxQYXRoID0gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIHJldHVybiBkaXNjb3Zlcnk/LnBhdGg7XG4gIH07XG5cbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignN2R0ZC1tb2QnLCAyNSxcbiAgICB0b0JsdWUodGVzdFN1cHBvcnRlZENvbnRlbnQpLCB0b0JsdWUoaW5zdGFsbENvbnRlbnQpKTtcblxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCc3ZHRkLXJvb3QtbW9kJywgMjAsIHRvQmx1ZSh0ZXN0Um9vdE1vZCksIHRvQmx1ZShpbnN0YWxsUm9vdE1vZCkpO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnN2R0ZC1yb290LW1vZCcsIDIwLCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgZ2V0T3ZlcmhhdWxQYXRoLCAoaW5zdHJ1Y3Rpb25zKSA9PiB7XG4gICAgICBjb25zdCBjYW5kaWRhdGVGb3VuZCA9IGhhc0NhbmRpZGF0ZShpbnN0cnVjdGlvbnNcbiAgICAgICAgLmZpbHRlcihpbnN0ciA9PiAhIWluc3RyLmRlc3RpbmF0aW9uKVxuICAgICAgICAubWFwKGluc3RyID0+IGluc3RyLmRlc3RpbmF0aW9uKSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhbmRpZGF0ZUZvdW5kKSBhcyBhbnk7XG4gICAgfSxcbiAgICAgIHsgbmFtZTogJ1Jvb3QgRGlyZWN0b3J5IE1vZCcsIG1lcmdlTW9kczogdHJ1ZSwgZGVwbG95bWVudEVzc2VudGlhbDogZmFsc2UgfSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbih0b0JsdWUob2xkID0+IG1pZ3JhdGUwMjAoY29udGV4dC5hcGksIG9sZCkpKTtcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbih0b0JsdWUob2xkID0+IG1pZ3JhdGUxMDAoY29udGV4dCwgb2xkKSkpO1xuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGQgPT4gbWlncmF0ZTEwMTEoY29udGV4dCwgb2xkKSkpO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogbWFpbixcbn07XG4iXX0=