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
exports.onWillDeploy = onWillDeploy;
exports.onDidDeploy = onDidDeploy;
exports.menuMod = menuMod;
exports.removeMenuMod = removeMenuMod;
exports.ensureMenuMod = ensureMenuMod;
exports.exportMenuMod = exportMenuMod;
exports.importMenuMod = importMenuMod;
const path_1 = __importDefault(require("path"));
const bluebird_1 = __importDefault(require("bluebird"));
const vortex_api_1 = require("vortex-api");
const IniParser = require('vortex-parse-ini');
const shortid_1 = require("shortid");
const migrations_1 = require("./migrations");
const util_1 = require("./collections/util");
const util_2 = require("./util");
const common_1 = require("./common");
const INVALID_CHARS = /[:/\\*?"<>|]/g;
const INPUT_SETTINGS_FILENAME = 'input.settings';
const DX_11_USER_SETTINGS_FILENAME = 'user.settings';
const DX_12_USER_SETTINGS_FILENAME = 'dx12user.settings';
const BACKUP_TAG = '.vortex_backup';
const CACHE_FILENAME = 'vortex_menumod.cache';
function getExistingCache(state, activeProfile) {
    return __awaiter(this, void 0, void 0, function* () {
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        const modName = menuMod(activeProfile.name);
        const mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID, modName], undefined);
        if (mod === undefined) {
            return [];
        }
        try {
            const cacheData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(stagingFolder, mod.installationPath, CACHE_FILENAME), { encoding: 'utf8' });
            const currentCache = JSON.parse(cacheData);
            return currentCache;
        }
        catch (err) {
            (0, vortex_api_1.log)('warn', 'W3: failed to read/parse cache file', err);
            return [];
        }
    });
}
function toFileMapKey(filePath) {
    return path_1.default.basename(filePath)
        .toLowerCase()
        .replace(common_1.PART_SUFFIX, '');
}
;
function readModData(filePath) {
    return vortex_api_1.fs.readFileAsync(filePath, { encoding: 'utf8' })
        .catch(err => Promise.resolve(undefined));
}
function populateCache(api, activeProfile, modIds, initialCacheValue) {
    const state = api.store.getState();
    const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    const modState = vortex_api_1.util.getSafe(activeProfile, ['modState'], {});
    let nextAvailableId = Object.keys(loadOrder).length;
    const getNextId = () => {
        return nextAvailableId++;
    };
    const toIdx = (loItem) => (loadOrder.indexOf(loItem) || getNextId());
    const invalidModTypes = ['witcher3menumoddocuments'];
    const affectedModIds = modIds === undefined ? Object.keys(mods) : modIds;
    const enabledMods = affectedModIds
        .filter(key => {
        var _a, _b;
        return (((_a = mods[key]) === null || _a === void 0 ? void 0 : _a.installationPath) !== undefined)
            && !!((_b = modState[key]) === null || _b === void 0 ? void 0 : _b.enabled) &&
            !invalidModTypes.includes(mods[key].type);
    })
        .sort((lhs, rhs) => (toIdx(lhs)) - (toIdx(rhs)))
        .map(key => mods[key]);
    const getRelevantModEntries = (source) => __awaiter(this, void 0, void 0, function* () {
        let allEntries = [];
        yield require('turbowalk').default(source, entries => {
            const relevantEntries = entries.filter(entry => (entry.filePath.endsWith(common_1.PART_SUFFIX))
                && (entry.filePath.indexOf(common_1.INPUT_XML_FILENAME) === -1))
                .map(entry => entry.filePath);
            allEntries = [].concat(allEntries, relevantEntries);
        }).catch(err => {
            if (['ENOENT', 'ENOTFOUND'].indexOf(err.code) === -1) {
                (0, vortex_api_1.log)('error', 'Failed to lookup menu mod files', { path: source, error: err.message });
            }
        });
        return allEntries;
    });
    const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
    return bluebird_1.default.reduce(enabledMods, (accum, mod) => {
        if (mod.installationPath === undefined) {
            return accum;
        }
        return getRelevantModEntries(path_1.default.join(stagingFolder, mod.installationPath))
            .then(entries => {
            return bluebird_1.default.each(entries, filepath => {
                return readModData(filepath)
                    .then(data => {
                    if (data !== undefined) {
                        accum.push({ id: mod.id, filepath, data });
                    }
                });
            })
                .then(() => Promise.resolve(accum));
        });
    }, initialCacheValue !== undefined ? initialCacheValue : [])
        .then(newCache => {
        const modName = menuMod(activeProfile.name);
        let mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID, modName], undefined);
        if ((mod === null || mod === void 0 ? void 0 : mod.installationPath) === undefined) {
            (0, vortex_api_1.log)('warn', 'failed to ascertain installation path', modName);
            return Promise.resolve();
        }
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(stagingFolder, mod.installationPath, CACHE_FILENAME), JSON.stringify(newCache));
    });
}
function convertFilePath(filePath, installPath) {
    const segments = filePath.split(path_1.default.sep);
    const idx = segments.reduce((prev, seg, idx) => {
        if (seg.toLowerCase() === common_1.GAME_ID) {
            return idx;
        }
        else {
            return prev;
        }
    }, -1);
    if (idx === -1) {
        (0, vortex_api_1.log)('error', 'unexpected menu mod filepath', filePath);
        return filePath;
    }
    const relPath = segments.slice(idx + 2).join(path_1.default.sep);
    return path_1.default.join(installPath, relPath);
}
function onWillDeploy(api, deployment, activeProfile) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const state = api.store.getState();
        if ((activeProfile === null || activeProfile === void 0 ? void 0 : activeProfile.name) === undefined) {
            return;
        }
        const installPath = vortex_api_1.selectors.installPathForGame(state, activeProfile.gameId);
        const modName = menuMod(activeProfile.name);
        const destinationFolder = path_1.default.join(installPath, modName);
        const game = vortex_api_1.util.getGame(activeProfile.gameId);
        const discovery = vortex_api_1.selectors.discoveryByGame(state, activeProfile.gameId);
        const modPaths = game.getModPaths(discovery.path);
        const docModPath = modPaths['witcher3menumoddocuments'];
        const currentCache = yield getExistingCache(state, activeProfile);
        if (currentCache.length === 0) {
            return;
        }
        const docFiles = ((_a = deployment['witcher3menumodroot']) !== null && _a !== void 0 ? _a : [])
            .filter(file => (file.relPath.endsWith(common_1.PART_SUFFIX))
            && (file.relPath.indexOf(common_1.INPUT_XML_FILENAME) === -1));
        if (docFiles.length <= 0) {
            return;
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modState = vortex_api_1.util.getSafe(activeProfile, ['modState'], {});
        const invalidModTypes = ['witcher3menumoddocuments'];
        const enabledMods = Object.keys(mods)
            .filter(key => { var _a; return !!((_a = modState[key]) === null || _a === void 0 ? void 0 : _a.enabled) && !invalidModTypes.includes(mods[key].type); });
        const parser = new IniParser.default(new IniParser.WinapiFormat());
        const fileMap = yield cacheToFileMap(state, activeProfile);
        if (fileMap === undefined) {
            return;
        }
        const keys = Object.keys(fileMap);
        const matcher = (entry) => keys.includes(toFileMapKey(entry.relPath));
        const newCache = yield bluebird_1.default.reduce(keys, (accum, key) => __awaiter(this, void 0, void 0, function* () {
            if (docFiles.find(matcher) !== undefined) {
                const mergedData = yield parser.read(path_1.default.join(docModPath, key));
                yield bluebird_1.default.each(fileMap[key], (iter) => __awaiter(this, void 0, void 0, function* () {
                    if (enabledMods.includes(iter.id)) {
                        const tempPath = path_1.default.join(destinationFolder, key) + (0, shortid_1.generate)();
                        const modData = yield toIniFileObject(iter.data, tempPath);
                        const modKeys = Object.keys(modData.data);
                        let changed = false;
                        return bluebird_1.default.each(modKeys, modKey => {
                            if ((mergedData.data[modKey] !== undefined)
                                && (modData.data[modKey] !== undefined)
                                && (mergedData.data[modKey] !== modData.data[modKey])) {
                                modData.data[modKey] = mergedData.data[modKey];
                                changed = true;
                            }
                        }).then(() => __awaiter(this, void 0, void 0, function* () {
                            let newModData;
                            if (changed) {
                                yield parser.write(iter.filepath, modData);
                                newModData = yield readModData(iter.filepath);
                            }
                            else {
                                newModData = iter.data;
                            }
                            if (newModData !== undefined) {
                                accum.push({ id: iter.id, filepath: iter.filepath, data: newModData });
                            }
                        }));
                    }
                }));
            }
            return Promise.resolve(accum);
        }), []);
        return vortex_api_1.fs.writeFileAsync(path_1.default.join(destinationFolder, CACHE_FILENAME), JSON.stringify(newCache));
    });
}
function toIniFileObject(data, tempDest) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield vortex_api_1.fs.writeFileAsync(tempDest, data, { encoding: 'utf8' });
            const parser = new IniParser.default(new IniParser.WinapiFormat());
            const iniData = yield parser.read(tempDest);
            yield vortex_api_1.fs.removeAsync(tempDest);
            return Promise.resolve(iniData);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function onDidDeploy(api, deployment, activeProfile) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const loadOrder = (0, migrations_1.getPersistentLoadOrder)(api);
        const docFiles = deployment['witcher3menumodroot'].filter(file => (file.relPath.endsWith(common_1.PART_SUFFIX))
            && (file.relPath.indexOf(common_1.INPUT_XML_FILENAME) === -1));
        if (docFiles.length <= 0) {
            return;
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const modState = vortex_api_1.util.getSafe(activeProfile, ['modState'], {});
        let nextAvailableId = loadOrder.length;
        const getNextId = () => {
            return nextAvailableId++;
        };
        const invalidModTypes = ['witcher3menumoddocuments'];
        const enabledMods = Object.keys(mods)
            .filter(key => { var _a; return !!((_a = modState[key]) === null || _a === void 0 ? void 0 : _a.enabled) && !invalidModTypes.includes(mods[key].type); })
            .sort((lhs, rhs) => { var _a, _b; return (((_a = loadOrder[rhs]) === null || _a === void 0 ? void 0 : _a.pos) || getNextId()) - (((_b = loadOrder[lhs]) === null || _b === void 0 ? void 0 : _b.pos) || getNextId()); });
        const currentCache = yield getExistingCache(state, activeProfile);
        const inCache = new Set(currentCache.map(entry => entry.id));
        const notInCache = new Set(docFiles.map(file => file.source)
            .filter(modId => !inCache.has(modId)));
        return ensureMenuMod(api, activeProfile)
            .then(() => ((currentCache.length === 0) && (enabledMods.length > 0))
            ? populateCache(api, activeProfile)
            : (notInCache.size !== 0)
                ? populateCache(api, activeProfile, Array.from(notInCache), currentCache)
                : Promise.resolve())
            .then(() => writeCacheToFiles(api, activeProfile))
            .then(() => menuMod(activeProfile.name))
            .catch(err => (err instanceof vortex_api_1.util.UserCanceled)
            ? Promise.resolve()
            : Promise.reject(err));
    });
}
function sanitizeProfileName(input) {
    return input.replace(INVALID_CHARS, '_');
}
function menuMod(profileName) {
    return `Witcher 3 Menu Mod Data (${sanitizeProfileName(profileName)})`;
}
function createMenuMod(api, modName, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const mod = {
            id: modName,
            state: 'installed',
            attributes: {
                name: 'Witcher 3 Menu Mod',
                description: 'This mod is a collective merge of setting files required by any/all '
                    + 'menu mods the user has installed - please do not disable/remove unless '
                    + 'all menu mods have been removed from your game first.',
                logicalFileName: 'Witcher 3 Menu Mod',
                modId: 42,
                version: '1.0.0',
                variant: sanitizeProfileName(profile.name.replace(INVALID_CHARS, '_')),
                installTime: new Date(),
            },
            installationPath: modName,
            type: 'witcher3menumoddocuments',
        };
        return yield new Promise((resolve, reject) => {
            api.events.emit('create-mod', profile.gameId, mod, (error) => __awaiter(this, void 0, void 0, function* () {
                if (error !== null) {
                    return reject(error);
                }
                resolve();
            }));
        });
    });
}
function removeMenuMod(api, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const modName = menuMod(profile.name);
        const mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', profile.gameId, modName], undefined);
        if (mod === undefined) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            api.events.emit('remove-mod', profile.gameId, mod.id, (error) => __awaiter(this, void 0, void 0, function* () {
                if (error !== null) {
                    (0, vortex_api_1.log)('error', 'failed to remove menu mod', error);
                }
                return resolve();
            }));
        });
    });
}
function cacheToFileMap(state, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentCache = yield getExistingCache(state, profile);
        if (currentCache.length === 0) {
            return undefined;
        }
        const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
        const fileMap = currentCache.reduce((accum, entry) => {
            accum[toFileMapKey(entry.filepath)] =
                [].concat(accum[toFileMapKey(entry.filepath)] || [], [{
                        id: entry.id,
                        data: entry.data,
                        filepath: convertFilePath(entry.filepath, stagingFolder),
                    }]);
            return accum;
        }, {});
        return fileMap;
    });
}
const copyIniFile = (source, dest) => vortex_api_1.fs.copyAsync(source, dest)
    .then(() => Promise.resolve(dest)).catch(err => Promise.resolve(undefined));
const getInitialDoc = (filePath) => {
    return vortex_api_1.fs.statAsync(filePath + BACKUP_TAG)
        .then(() => Promise.resolve(filePath + BACKUP_TAG))
        .catch(err => vortex_api_1.fs.statAsync(filePath)
        .then(() => Promise.resolve(filePath)))
        .catch(err => {
        (0, vortex_api_1.log)('warn', 'W3: cannot find original file', err.message);
        return Promise.resolve(undefined);
    });
};
function writeCacheToFiles(api, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const modName = menuMod(profile.name);
        const installPath = vortex_api_1.selectors.installPathForGame(state, profile.gameId);
        const destinationFolder = path_1.default.join(installPath, modName);
        const game = vortex_api_1.util.getGame(profile.gameId);
        const discovery = vortex_api_1.selectors.discoveryByGame(state, profile.gameId);
        const modPaths = game.getModPaths(discovery.path);
        const docModPath = modPaths['witcher3menumoddocuments'];
        const currentCache = yield getExistingCache(state, profile);
        if (currentCache.length === 0)
            return;
        const fileMap = yield cacheToFileMap(state, profile);
        if (!fileMap)
            return;
        const parser = new IniParser.default(new IniParser.WinapiFormat());
        const keys = Object.keys(fileMap);
        for (const key of keys) {
            try {
                const source = yield getInitialDoc(path_1.default.join(docModPath, key));
                if (!source)
                    continue;
                yield copyIniFile(source, path_1.default.join(destinationFolder, key));
                const initialData = yield parser.read(path_1.default.join(destinationFolder, key));
                for (const modEntry of fileMap[key]) {
                    const tempFilePath = path_1.default.join(destinationFolder, key) + (0, shortid_1.generate)();
                    const modData = yield toIniFileObject(modEntry.data, tempFilePath);
                    for (const modKey of Object.keys(modData.data)) {
                        initialData.data[modKey] = Object.assign(Object.assign({}, initialData.data[modKey]), modData.data[modKey]);
                    }
                }
                yield parser.write(path_1.default.join(destinationFolder, key), initialData);
            }
            catch (err) {
                if (err.code === 'ENOENT' && [
                    path_1.default.join(docModPath, INPUT_SETTINGS_FILENAME),
                    path_1.default.join(docModPath, DX_11_USER_SETTINGS_FILENAME),
                    path_1.default.join(docModPath, DX_12_USER_SETTINGS_FILENAME),
                ].includes(err.path)) {
                    api.showErrorNotification('Failed to install menu mod', new vortex_api_1.util.DataInvalid('Required setting files are missing - please run the game at least once and try again.'), { allowReport: false });
                    return;
                }
                throw err;
            }
        }
    });
}
function ensureMenuMod(api, profile) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const modName = menuMod(profile.name);
        const mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', profile.gameId, modName], undefined);
        if (mod === undefined) {
            try {
                yield createMenuMod(api, modName, profile);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
        else {
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'installTime', new Date()));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'name', 'Witcher 3 Menu Mod'));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'type', 'witcher3menumoddocuments'));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'logicalFileName', 'Witcher 3 Menu Mod'));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'modId', 42));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'version', '1.0.0'));
            api.store.dispatch(vortex_api_1.actions.setModAttribute(profile.gameId, modName, 'variant', sanitizeProfileName(profile.name)));
        }
        return Promise.resolve(modName);
    });
}
function exportMenuMod(api, profile, includedMods) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const deployment = yield (0, util_2.getDeployment)(api, includedMods);
            if (deployment === undefined) {
                throw new Error('Failed to get deployment');
            }
            const modName = yield onDidDeploy(api, deployment, profile);
            if (modName === undefined) {
                return undefined;
            }
            const mods = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'mods', common_1.GAME_ID], {});
            const modId = Object.keys(mods).find(id => id === modName);
            if (modId === undefined) {
                throw new Error('Menu mod is missing');
            }
            const installPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
            const modPath = path_1.default.join(installPath, mods[modId].installationPath);
            const data = yield (0, util_1.prepareFileData)(modPath);
            return data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function importMenuMod(api, profile, fileData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const modName = yield ensureMenuMod(api, profile);
            const mod = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'mods', profile.gameId, modName], undefined);
            const installPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
            const destPath = path_1.default.join(installPath, mod.installationPath);
            yield (0, util_1.restoreFileData)(fileData, destPath);
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudW1vZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lbnVtb2QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUE0S0Esb0NBaUZDO0FBa0JELGtDQXVDQztBQU1ELDBCQUVDO0FBK0JELHNDQXdCQztBQWtHRCxzQ0ErQkM7QUFFRCxzQ0EwQkM7QUFFRCxzQ0FhQztBQWhpQkQsZ0RBQXdCO0FBQ3hCLHdEQUFnQztBQUNoQywyQ0FBc0U7QUFDdEUsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDOUMscUNBQW1DO0FBRW5DLDZDQUFzRDtBQUN0RCw2Q0FBc0U7QUFDdEUsaUNBQXVDO0FBQ3ZDLHFDQUFvRTtBQUdwRSxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUM7QUFDdEMsTUFBTSx1QkFBdUIsR0FBRyxnQkFBZ0IsQ0FBQztBQUNqRCxNQUFNLDRCQUE0QixHQUFHLGVBQWUsQ0FBQztBQUNyRCxNQUFNLDRCQUE0QixHQUFHLG1CQUFtQixDQUFDO0FBQ3pELE1BQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDO0FBY3BDLE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFBO0FBZTdDLFNBQWUsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLGFBQWE7O1FBQ2xELE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNuRSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLE1BQU0sR0FBRyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUN0QixPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7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QU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsQ0FBQztJQUNILENBQUM7Q0FBQTtBQUVELFNBQXNCLGFBQWEsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVE7O1FBSXhELElBQUksQ0FBQztZQUNILE1BQU0sT0FBTyxHQUFHLE1BQU0sYUFBYSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNsRCxNQUFNLEdBQUcsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDckcsTUFBTSxXQUFXLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQzFFLE1BQU0sUUFBUSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzlELE1BQU0sSUFBQSxzQkFBZSxFQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUNiLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuY29uc3QgSW5pUGFyc2VyID0gcmVxdWlyZSgndm9ydGV4LXBhcnNlLWluaScpO1xyXG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ3Nob3J0aWQnO1xyXG5cclxuaW1wb3J0IHsgZ2V0UGVyc2lzdGVudExvYWRPcmRlciB9IGZyb20gJy4vbWlncmF0aW9ucyc7XHJcbmltcG9ydCB7IHByZXBhcmVGaWxlRGF0YSwgcmVzdG9yZUZpbGVEYXRhIH0gZnJvbSAnLi9jb2xsZWN0aW9ucy91dGlsJztcclxuaW1wb3J0IHsgZ2V0RGVwbG95bWVudCB9IGZyb20gJy4vdXRpbCc7XHJcbmltcG9ydCB7IEdBTUVfSUQsIElOUFVUX1hNTF9GSUxFTkFNRSwgUEFSVF9TVUZGSVggfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG4vLyBtb3N0IG9mIHRoZXNlIGFyZSBpbnZhbGlkIG9uIHdpbmRvd3Mgb25seSBidXQgaXQncyBub3Qgd29ydGggdGhlIGVmZm9ydCBhbGxvd2luZyB0aGVtIGVsc2V3aGVyZVxyXG5jb25zdCBJTlZBTElEX0NIQVJTID0gL1s6L1xcXFwqP1wiPD58XS9nO1xyXG5jb25zdCBJTlBVVF9TRVRUSU5HU19GSUxFTkFNRSA9ICdpbnB1dC5zZXR0aW5ncyc7XHJcbmNvbnN0IERYXzExX1VTRVJfU0VUVElOR1NfRklMRU5BTUUgPSAndXNlci5zZXR0aW5ncyc7XHJcbmNvbnN0IERYXzEyX1VTRVJfU0VUVElOR1NfRklMRU5BTUUgPSAnZHgxMnVzZXIuc2V0dGluZ3MnO1xyXG5jb25zdCBCQUNLVVBfVEFHID0gJy52b3J0ZXhfYmFja3VwJztcclxuXHJcbmludGVyZmFjZSBJQ2FjaGVFbnRyeSB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBmaWxlcGF0aDogc3RyaW5nO1xyXG4gIGRhdGE6IHN0cmluZztcclxufVxyXG5cclxudHlwZSBJRmlsZU1hcCA9IHsgW2VudHJ5SWQ6IHN0cmluZ106IElDYWNoZUVudHJ5W10gfTtcclxuXHJcbi8vIFdlJ3JlIGdvaW5nIHRvIHNhdmUgcGVyIG1vZCBpbmkgc2V0dGluZ3MgZm9yIGVhY2hcclxuLy8gIGZpbGUgKHdoZXJlIGFwcGxpY2FibGUpIGludG8gdGhpcyBjYWNoZSBmaWxlIHNvXHJcbi8vICB3ZSBjYW4ga2VlcCB0cmFjayBvZiBjaGFuZ2VzIHRoYXQgdGhlIHVzZXIgbWFkZVxyXG4vLyAgZHVyaW5nIGhpcyBwbGF5dGhyb3VnaC5cclxuY29uc3QgQ0FDSEVfRklMRU5BTUUgPSAndm9ydGV4X21lbnVtb2QuY2FjaGUnXHJcbi8qIENhY2hlIGZvcm1hdCBzaG91bGQgYmUgYXMgZm9sbG93czpcclxuICBbXHJcbiAgICB7XHJcbiAgICAgIGlkOiAkbW9kSWRcclxuICAgICAgZmlsZXBhdGg6ICcuLi9pbnB1dC5zZXR0aW5ncycsXHJcbiAgICAgIGRhdGE6ICdpbmkgZGF0YSBpbiBzdHJpbmcgZm9ybWF0JyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIGlkOiAkbW9kSWRcclxuICAgICAgZmlsZW5hbWU6ICcuLi91c2VyLnNldHRpbmdzJyxcclxuICAgICAgZGF0YTogJ2luaSBkYXRhIGluIHN0cmluZyBmb3JtYXQnLFxyXG4gICAgfSxcclxuICBdXHJcbiovXHJcbmFzeW5jIGZ1bmN0aW9uIGdldEV4aXN0aW5nQ2FjaGUoc3RhdGUsIGFjdGl2ZVByb2ZpbGUpIHtcclxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QoYWN0aXZlUHJvZmlsZS5uYW1lKTtcclxuICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgY2FjaGVEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlcixcclxuICAgICAgbW9kLmluc3RhbGxhdGlvblBhdGgsIENBQ0hFX0ZJTEVOQU1FKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29uc3QgY3VycmVudENhY2hlID0gSlNPTi5wYXJzZShjYWNoZURhdGEpO1xyXG4gICAgcmV0dXJuIGN1cnJlbnRDYWNoZTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIC8vIFdlIHdlcmUgdW5hYmxlIHRvIHJlYWQvcGFyc2UgdGhlIGNhY2hlIGZpbGUgLSB0aGlzIGlzIHBlcmZlY3RseVxyXG4gICAgLy8gIHZhbGlkIHdoZW4gdGhlIGNhY2hlIGZpbGUgaGFzbid0IGJlZW4gY3JlYXRlZCB5ZXQsIGFuZCBldmVuIGlmL3doZW5cclxuICAgIC8vICB0aGUgZXJyb3IgaXMgbW9yZSBzZXJpb3VzIC0gd2Ugc2hvdWxkbid0IGJsb2NrIHRoZSBkZXBsb3ltZW50LlxyXG4gICAgbG9nKCd3YXJuJywgJ1czOiBmYWlsZWQgdG8gcmVhZC9wYXJzZSBjYWNoZSBmaWxlJywgZXJyKTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvRmlsZU1hcEtleShmaWxlUGF0aCkge1xyXG4gIHJldHVybiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKVxyXG4gICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgIC5yZXBsYWNlKFBBUlRfU1VGRklYLCAnJyk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiByZWFkTW9kRGF0YShmaWxlUGF0aCkge1xyXG4gIHJldHVybiBmcy5yZWFkRmlsZUFzeW5jKGZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSlcclxuICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBwb3B1bGF0ZUNhY2hlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgYWN0aXZlUHJvZmlsZTogdHlwZXMuSVByb2ZpbGUsIG1vZElkcz86IHN0cmluZ1tdLCBpbml0aWFsQ2FjaGVWYWx1ZT86IElDYWNoZUVudHJ5W10pIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoYWN0aXZlUHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XHJcblxyXG4gIGxldCBuZXh0QXZhaWxhYmxlSWQgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpLmxlbmd0aDtcclxuICBjb25zdCBnZXROZXh0SWQgPSAoKSA9PiB7XHJcbiAgICByZXR1cm4gbmV4dEF2YWlsYWJsZUlkKys7XHJcbiAgfVxyXG4gIGNvbnN0IHRvSWR4ID0gKGxvSXRlbSkgPT4gKGxvYWRPcmRlci5pbmRleE9mKGxvSXRlbSkgfHwgZ2V0TmV4dElkKCkpO1xyXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XHJcbiAgY29uc3QgYWZmZWN0ZWRNb2RJZHMgPSBtb2RJZHMgPT09IHVuZGVmaW5lZCA/IE9iamVjdC5rZXlzKG1vZHMpIDogbW9kSWRzO1xyXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gYWZmZWN0ZWRNb2RJZHNcclxuICAgIC5maWx0ZXIoa2V5ID0+IChtb2RzW2tleV0/Lmluc3RhbGxhdGlvblBhdGggIT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgICAgICYmICEhbW9kU3RhdGVba2V5XT8uZW5hYmxlZCAmJlxyXG4gICAgICAgICAgICAgICAgIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2RzW2tleV0udHlwZSkpXHJcbiAgICAuc29ydCgobGhzLCByaHMpID0+ICh0b0lkeChsaHMpKSAtICh0b0lkeChyaHMpKSlcclxuICAgIC5tYXAoa2V5ID0+IG1vZHNba2V5XSk7XHJcblxyXG4gIGNvbnN0IGdldFJlbGV2YW50TW9kRW50cmllcyA9IGFzeW5jIChzb3VyY2UpID0+IHtcclxuICAgIGxldCBhbGxFbnRyaWVzID0gW107XHJcbiAgICBhd2FpdCByZXF1aXJlKCd0dXJib3dhbGsnKS5kZWZhdWx0KHNvdXJjZSwgZW50cmllcyA9PiB7XHJcbiAgICAgIGNvbnN0IHJlbGV2YW50RW50cmllcyA9IGVudHJpZXMuZmlsdGVyKGVudHJ5ID0+XHJcbiAgICAgICAgICAgKGVudHJ5LmZpbGVQYXRoLmVuZHNXaXRoKFBBUlRfU1VGRklYKSlcclxuICAgICAgICAmJiAoZW50cnkuZmlsZVBhdGguaW5kZXhPZihJTlBVVF9YTUxfRklMRU5BTUUpID09PSAtMSkpXHJcbiAgICAgICAgICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5maWxlUGF0aCk7XHJcblxyXG4gICAgICBhbGxFbnRyaWVzID0gW10uY29uY2F0KGFsbEVudHJpZXMsIHJlbGV2YW50RW50cmllcyk7XHJcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBpZiAgKFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluZGV4T2YoZXJyLmNvZGUpID09PSAtMSkge1xyXG4gICAgICAgIGxvZygnZXJyb3InLCAnRmFpbGVkIHRvIGxvb2t1cCBtZW51IG1vZCBmaWxlcycsXHJcbiAgICAgICAgICB7IHBhdGg6IHNvdXJjZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiBhbGxFbnRyaWVzO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKGVuYWJsZWRNb2RzLCAoYWNjdW0sIG1vZDogdHlwZXMuSU1vZCkgPT4ge1xyXG4gICAgaWYgKG1vZC5pbnN0YWxsYXRpb25QYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGdldFJlbGV2YW50TW9kRW50cmllcyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgbW9kLmluc3RhbGxhdGlvblBhdGgpKVxyXG4gICAgICAudGhlbihlbnRyaWVzID0+IHtcclxuICAgICAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChlbnRyaWVzLCBmaWxlcGF0aCA9PiB7XHJcbiAgICAgICAgICByZXR1cm4gcmVhZE1vZERhdGEoZmlsZXBhdGgpXHJcbiAgICAgICAgICAgIC50aGVuKGRhdGEgPT4ge1xyXG4gICAgICAgICAgICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgIGFjY3VtLnB1c2goeyBpZDogbW9kLmlkLCBmaWxlcGF0aCwgZGF0YSB9KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoYWNjdW0pKVxyXG4gICAgICB9KVxyXG4gIH0sIGluaXRpYWxDYWNoZVZhbHVlICE9PSB1bmRlZmluZWQgPyBpbml0aWFsQ2FjaGVWYWx1ZSA6IFtdKVxyXG4gIC50aGVuKG5ld0NhY2hlID0+IHtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSBtZW51TW9kKGFjdGl2ZVByb2ZpbGUubmFtZSk7XHJcbiAgICBsZXQgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xyXG4gICAgaWYgKG1vZD8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGxvZygnd2FybicsICdmYWlsZWQgdG8gYXNjZXJ0YWluIGluc3RhbGxhdGlvbiBwYXRoJywgbW9kTmFtZSk7XHJcbiAgICAgIC8vIFdlIHdpbGwgY3JlYXRlIGl0IG9uIHRoZSBuZXh0IHJ1bi5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4oc3RhZ2luZ0ZvbGRlciwgbW9kLmluc3RhbGxhdGlvblBhdGgsIENBQ0hFX0ZJTEVOQU1FKSwgSlNPTi5zdHJpbmdpZnkobmV3Q2FjaGUpKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gY29udmVydEZpbGVQYXRoKGZpbGVQYXRoLCBpbnN0YWxsUGF0aCkgeyBcclxuICAvLyBQcmUtY29sbGVjdGlvbnMgd2Ugd291bGQgdXNlIGFic29sdXRlIHBhdGhzIHBvaW50aW5nXHJcbiAgLy8gIHRvIHRoZSBtZW51IG1vZCBpbnB1dCBtb2RpZmljYXRpb25zOyB0aGlzIHdpbGwgb2J2aW91c2x5XHJcbiAgLy8gIHdvcmsganVzdCBmaW5lIG9uIHRoZSBjdXJhdG9yJ3MgZW5kLCBidXQgcmVscGF0aHMgc2hvdWxkIGJlIHVzZWRcclxuICAvLyAgb24gdGhlIHVzZXIncyBlbmQuIFRoaXMgZnVuY3RvciB3aWxsIGNvbnZlcnQgdGhlIGFicyBwYXRoIGZyb21cclxuICAvLyAgdGhlIGN1cmF0b3IncyBwYXRoIHRvIHRoZSB1c2VyJ3MgcGF0aC5cclxuICBjb25zdCBzZWdtZW50cyA9IGZpbGVQYXRoLnNwbGl0KHBhdGguc2VwKTtcclxuICBjb25zdCBpZHggPSBzZWdtZW50cy5yZWR1Y2UoKHByZXYsIHNlZywgaWR4KSA9PiB7XHJcbiAgICBpZiAoc2VnLnRvTG93ZXJDYXNlKCkgPT09IEdBTUVfSUQpIHtcclxuICAgICAgcmV0dXJuIGlkeDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgfVxyXG4gIH0sIC0xKTtcclxuICBpZiAoaWR4ID09PSAtMSkge1xyXG4gICAgbG9nKCdlcnJvcicsICd1bmV4cGVjdGVkIG1lbnUgbW9kIGZpbGVwYXRoJywgZmlsZVBhdGgpO1xyXG4gICAgcmV0dXJuIGZpbGVQYXRoO1xyXG4gIH1cclxuICAvLyBXZSBzbGljZSBvZmYgZXZlcnl0aGluZyB1cCB0byB0aGUgR0FNRV9JRCBhbmQgdGhlICdtb2RzJyBmb2xkZXIuXHJcbiAgY29uc3QgcmVsUGF0aCA9IHNlZ21lbnRzLnNsaWNlKGlkeCArIDIpLmpvaW4ocGF0aC5zZXApO1xyXG4gIHJldHVybiBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIHJlbFBhdGgpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb25XaWxsRGVwbG95KGFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSkge1xyXG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XHJcbiAgLy8gICByZXR1cm47XHJcbiAgLy8gfVxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgaWYgKGFjdGl2ZVByb2ZpbGU/Lm5hbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIGFjdGl2ZVByb2ZpbGUuZ2FtZUlkKTtcclxuICBjb25zdCBtb2ROYW1lID0gbWVudU1vZChhY3RpdmVQcm9maWxlLm5hbWUpO1xyXG4gIGNvbnN0IGRlc3RpbmF0aW9uRm9sZGVyID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2ROYW1lKTtcclxuICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKGFjdGl2ZVByb2ZpbGUuZ2FtZUlkKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBhY3RpdmVQcm9maWxlLmdhbWVJZCk7XHJcbiAgY29uc3QgbW9kUGF0aHMgPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcclxuICBjb25zdCBkb2NNb2RQYXRoID0gbW9kUGF0aHNbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xyXG4gIGNvbnN0IGN1cnJlbnRDYWNoZSA9IGF3YWl0IGdldEV4aXN0aW5nQ2FjaGUoc3RhdGUsIGFjdGl2ZVByb2ZpbGUpO1xyXG4gIGlmIChjdXJyZW50Q2FjaGUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAvLyBOb3RoaW5nIHRvIGNvbXBhcmUsIHVzZXIgZG9lcyBub3QgaGF2ZSBhIGNhY2hlLlxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgZG9jRmlsZXMgPSAoZGVwbG95bWVudFsnd2l0Y2hlcjNtZW51bW9kcm9vdCddID8/IFtdKVxyXG4gICAgLmZpbHRlcihmaWxlID0+IChmaWxlLnJlbFBhdGguZW5kc1dpdGgoUEFSVF9TVUZGSVgpKVxyXG4gICAgICAgICAgICAgICAgICYmIChmaWxlLnJlbFBhdGguaW5kZXhPZihJTlBVVF9YTUxfRklMRU5BTUUpID09PSAtMSkpO1xyXG5cclxuICBpZiAoZG9jRmlsZXMubGVuZ3RoIDw9IDApIHtcclxuICAgIC8vIE5vIGRvYyBmaWxlcywgbm8gcHJvYmxlbS5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShhY3RpdmVQcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcclxuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xyXG4gIGNvbnN0IGVuYWJsZWRNb2RzID0gT2JqZWN0LmtleXMobW9kcylcclxuICAgIC5maWx0ZXIoa2V5ID0+ICEhbW9kU3RhdGVba2V5XT8uZW5hYmxlZCAmJiAhaW52YWxpZE1vZFR5cGVzLmluY2x1ZGVzKG1vZHNba2V5XS50eXBlKSk7XHJcblxyXG4gIGNvbnN0IHBhcnNlciA9IG5ldyBJbmlQYXJzZXIuZGVmYXVsdChuZXcgSW5pUGFyc2VyLldpbmFwaUZvcm1hdCgpKTtcclxuXHJcbiAgY29uc3QgZmlsZU1hcCA9IGF3YWl0IGNhY2hlVG9GaWxlTWFwKHN0YXRlLCBhY3RpdmVQcm9maWxlKTtcclxuICBpZiAoZmlsZU1hcCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoZmlsZU1hcCk7XHJcbiAgY29uc3QgbWF0Y2hlciA9IChlbnRyeSkgPT4ga2V5cy5pbmNsdWRlcyh0b0ZpbGVNYXBLZXkoZW50cnkucmVsUGF0aCkpO1xyXG4gIGNvbnN0IG5ld0NhY2hlID0gYXdhaXQgQmx1ZWJpcmQucmVkdWNlKGtleXMsIGFzeW5jIChhY2N1bSwga2V5KSA9PiB7XHJcbiAgICBpZiAoZG9jRmlsZXMuZmluZChtYXRjaGVyKSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGNvbnN0IG1lcmdlZERhdGEgPSBhd2FpdCBwYXJzZXIucmVhZChwYXRoLmpvaW4oZG9jTW9kUGF0aCwga2V5KSk7XHJcbiAgICAgIGF3YWl0IEJsdWViaXJkLmVhY2goZmlsZU1hcFtrZXldLCBhc3luYyAoaXRlcjogSUNhY2hlRW50cnkpID0+IHtcclxuICAgICAgICBpZiAoZW5hYmxlZE1vZHMuaW5jbHVkZXMoaXRlci5pZCkpIHtcclxuICAgICAgICAgIGNvbnN0IHRlbXBQYXRoID0gcGF0aC5qb2luKGRlc3RpbmF0aW9uRm9sZGVyLCBrZXkpICsgZ2VuZXJhdGUoKTtcclxuICAgICAgICAgIGNvbnN0IG1vZERhdGEgPSBhd2FpdCB0b0luaUZpbGVPYmplY3QoaXRlci5kYXRhLCB0ZW1wUGF0aCk7XHJcbiAgICAgICAgICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobW9kRGF0YS5kYXRhKTtcclxuICAgICAgICAgIGxldCBjaGFuZ2VkID0gZmFsc2U7XHJcbiAgICAgICAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChtb2RLZXlzLCBtb2RLZXkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoKG1lcmdlZERhdGEuZGF0YVttb2RLZXldICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgJiYgKG1vZERhdGEuZGF0YVttb2RLZXldICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgJiYgKG1lcmdlZERhdGEuZGF0YVttb2RLZXldICE9PSBtb2REYXRhLmRhdGFbbW9kS2V5XSkpIHtcclxuICAgICAgICAgICAgICAgIG1vZERhdGEuZGF0YVttb2RLZXldID0gbWVyZ2VkRGF0YS5kYXRhW21vZEtleV07XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSkudGhlbihhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBuZXdNb2REYXRhO1xyXG4gICAgICAgICAgICBpZiAoY2hhbmdlZCkge1xyXG4gICAgICAgICAgICAgIGF3YWl0IHBhcnNlci53cml0ZShpdGVyLmZpbGVwYXRoLCBtb2REYXRhKTtcclxuICAgICAgICAgICAgICBuZXdNb2REYXRhID0gYXdhaXQgcmVhZE1vZERhdGEoaXRlci5maWxlcGF0aCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgbmV3TW9kRGF0YSA9IGl0ZXIuZGF0YTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG5ld01vZERhdGEgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIGFjY3VtLnB1c2goeyBpZDogaXRlci5pZCwgZmlsZXBhdGg6IGl0ZXIuZmlsZXBhdGgsIGRhdGE6IG5ld01vZERhdGEgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcclxuICB9LCBbXSk7XHJcblxyXG4gIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4oZGVzdGluYXRpb25Gb2xkZXIsIENBQ0hFX0ZJTEVOQU1FKSwgSlNPTi5zdHJpbmdpZnkobmV3Q2FjaGUpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gdG9JbmlGaWxlT2JqZWN0KGRhdGEsIHRlbXBEZXN0KSB7XHJcbiAgLy8gR2l2ZW4gdGhhdCB3aW5hcGkgcmVxdWlyZXMgYSBmaWxlIHRvIGNvcnJlY3RseSByZWFkL3BhcnNlXHJcbiAgLy8gIGFuIEluaUZpbGUgb2JqZWN0LCB3ZSdyZSBnb2luZyB0byB1c2UgdGhpcyBoYWNreSBkaXNndXN0aW5nXHJcbiAgLy8gIGZ1bmN0aW9uIHRvIHF1aWNrbHkgY3JlYXRlIGEgdGVtcCBmaWxlLCByZWFkIGl0LCBkZXN0cm95IGl0XHJcbiAgLy8gIGFuZCByZXR1cm4gdGhlIG9iamVjdCBiYWNrIHRvIHRoZSBjYWxsZXIuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKHRlbXBEZXN0LCBkYXRhLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XHJcbiAgICBjb25zdCBpbmlEYXRhID0gYXdhaXQgcGFyc2VyLnJlYWQodGVtcERlc3QpO1xyXG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmModGVtcERlc3QpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpbmlEYXRhKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uRGlkRGVwbG95KGFwaSwgZGVwbG95bWVudCwgYWN0aXZlUHJvZmlsZSkge1xyXG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XHJcbiAgLy8gICByZXR1cm47XHJcbiAgLy8gfVxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbG9hZE9yZGVyID0gZ2V0UGVyc2lzdGVudExvYWRPcmRlcihhcGkpO1xyXG4gIGNvbnN0IGRvY0ZpbGVzID0gZGVwbG95bWVudFsnd2l0Y2hlcjNtZW51bW9kcm9vdCddLmZpbHRlcihmaWxlID0+IChmaWxlLnJlbFBhdGguZW5kc1dpdGgoUEFSVF9TVUZGSVgpKVxyXG4gICAgJiYgKGZpbGUucmVsUGF0aC5pbmRleE9mKElOUFVUX1hNTF9GSUxFTkFNRSkgPT09IC0xKSk7XHJcblxyXG4gIGlmIChkb2NGaWxlcy5sZW5ndGggPD0gMCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKGFjdGl2ZVByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xyXG4gIGxldCBuZXh0QXZhaWxhYmxlSWQgPSBsb2FkT3JkZXIubGVuZ3RoO1xyXG4gIGNvbnN0IGdldE5leHRJZCA9ICgpID0+IHtcclxuICAgIHJldHVybiBuZXh0QXZhaWxhYmxlSWQrKztcclxuICB9XHJcbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnXTtcclxuICBjb25zdCBlbmFibGVkTW9kcyA9IE9iamVjdC5rZXlzKG1vZHMpXHJcbiAgICAuZmlsdGVyKGtleSA9PiAhIW1vZFN0YXRlW2tleV0/LmVuYWJsZWQgJiYgIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2RzW2tleV0udHlwZSkpXHJcbiAgICAuc29ydCgobGhzLCByaHMpID0+IChsb2FkT3JkZXJbcmhzXT8ucG9zIHx8IGdldE5leHRJZCgpKSAtIChsb2FkT3JkZXJbbGhzXT8ucG9zIHx8IGdldE5leHRJZCgpKSlcclxuXHJcbiAgY29uc3QgY3VycmVudENhY2hlID0gYXdhaXQgZ2V0RXhpc3RpbmdDYWNoZShzdGF0ZSwgYWN0aXZlUHJvZmlsZSk7XHJcbiAgY29uc3QgaW5DYWNoZSA9IG5ldyBTZXQoY3VycmVudENhY2hlLm1hcChlbnRyeSA9PiBlbnRyeS5pZCkpO1xyXG4gIGNvbnN0IG5vdEluQ2FjaGU6IFNldDxzdHJpbmc+ID0gbmV3IFNldChkb2NGaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnNvdXJjZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIobW9kSWQgPT4gIWluQ2FjaGUuaGFzKG1vZElkKSkpO1xyXG4gIHJldHVybiBlbnN1cmVNZW51TW9kKGFwaSwgYWN0aXZlUHJvZmlsZSlcclxuICAgIC50aGVuKCgpID0+ICgoY3VycmVudENhY2hlLmxlbmd0aCA9PT0gMCkgJiYgKGVuYWJsZWRNb2RzLmxlbmd0aCA+IDApKVxyXG4gICAgICA/IHBvcHVsYXRlQ2FjaGUoYXBpLCBhY3RpdmVQcm9maWxlKVxyXG4gICAgICA6IChub3RJbkNhY2hlLnNpemUgIT09IDApXHJcbiAgICAgICAgPyBwb3B1bGF0ZUNhY2hlKGFwaSwgYWN0aXZlUHJvZmlsZSwgQXJyYXkuZnJvbShub3RJbkNhY2hlKSwgY3VycmVudENhY2hlKVxyXG4gICAgICAgIDogUHJvbWlzZS5yZXNvbHZlKCkpXHJcbiAgICAudGhlbigoKSA9PiB3cml0ZUNhY2hlVG9GaWxlcyhhcGksIGFjdGl2ZVByb2ZpbGUpKVxyXG4gICAgLnRoZW4oKCkgPT4gbWVudU1vZChhY3RpdmVQcm9maWxlLm5hbWUpKVxyXG4gICAgLmNhdGNoKGVyciA9PiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXHJcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKClcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2FuaXRpemVQcm9maWxlTmFtZShpbnB1dCkge1xyXG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKElOVkFMSURfQ0hBUlMsICdfJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtZW51TW9kKHByb2ZpbGVOYW1lKSB7XHJcbiAgcmV0dXJuIGBXaXRjaGVyIDMgTWVudSBNb2QgRGF0YSAoJHtzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGVOYW1lKX0pYDtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlTWVudU1vZChhcGksIG1vZE5hbWUsIHByb2ZpbGUpIHtcclxuICBjb25zdCBtb2QgPSB7XHJcbiAgICBpZDogbW9kTmFtZSxcclxuICAgIHN0YXRlOiAnaW5zdGFsbGVkJyxcclxuICAgIGF0dHJpYnV0ZXM6IHtcclxuICAgICAgbmFtZTogJ1dpdGNoZXIgMyBNZW51IE1vZCcsXHJcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhpcyBtb2QgaXMgYSBjb2xsZWN0aXZlIG1lcmdlIG9mIHNldHRpbmcgZmlsZXMgcmVxdWlyZWQgYnkgYW55L2FsbCAnXHJcbiAgICAgICAgICAgICAgICAgKyAnbWVudSBtb2RzIHRoZSB1c2VyIGhhcyBpbnN0YWxsZWQgLSBwbGVhc2UgZG8gbm90IGRpc2FibGUvcmVtb3ZlIHVubGVzcyAnXHJcbiAgICAgICAgICAgICAgICAgKyAnYWxsIG1lbnUgbW9kcyBoYXZlIGJlZW4gcmVtb3ZlZCBmcm9tIHlvdXIgZ2FtZSBmaXJzdC4nLFxyXG4gICAgICBsb2dpY2FsRmlsZU5hbWU6ICdXaXRjaGVyIDMgTWVudSBNb2QnLFxyXG4gICAgICBtb2RJZDogNDIsIC8vIE1lYW5pbmcgb2YgbGlmZVxyXG4gICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxyXG4gICAgICB2YXJpYW50OiBzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGUubmFtZS5yZXBsYWNlKElOVkFMSURfQ0hBUlMsICdfJykpLFxyXG4gICAgICBpbnN0YWxsVGltZTogbmV3IERhdGUoKSxcclxuICAgIH0sXHJcbiAgICBpbnN0YWxsYXRpb25QYXRoOiBtb2ROYW1lLFxyXG4gICAgdHlwZTogJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cycsXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGFwaS5ldmVudHMuZW1pdCgnY3JlYXRlLW1vZCcsIHByb2ZpbGUuZ2FtZUlkLCBtb2QsIGFzeW5jIChlcnJvcikgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgICByZXNvbHZlKCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbW92ZU1lbnVNb2QoYXBpLCBwcm9maWxlKSB7XHJcbiAgLy8gaWYgKCFpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcclxuICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAvLyB9XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBtb2ROYW1lID0gbWVudU1vZChwcm9maWxlLm5hbWUpO1xyXG4gIGNvbnN0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBwcm9maWxlLmdhbWVJZCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBhcGkuZXZlbnRzLmVtaXQoJ3JlbW92ZS1tb2QnLCBwcm9maWxlLmdhbWVJZCwgbW9kLmlkLCBhc3luYyAoZXJyb3IpID0+IHtcclxuICAgICAgaWYgKGVycm9yICE9PSBudWxsKSB7XHJcbiAgICAgICAgLy8gVGhlIGZhY3QgdGhhdCB3ZSdyZSBhdHRlbXB0aW5nIHRvIHJlbW92ZSB0aGUgYWdncmVnYXRlZCBtZW51IG1vZCBtZWFucyB0aGF0XHJcbiAgICAgICAgLy8gIHRoZSB1c2VyIG5vIGxvbmdlciBoYXMgYW55IG1lbnUgbW9kcyBpbnN0YWxsZWQgYW5kIHRoZXJlZm9yZSBpdCdzIHNhZmUgdG9cclxuICAgICAgICAvLyAgaWdub3JlIGFueSBlcnJvcnMgdGhhdCBtYXkgaGF2ZSBiZWVuIHJhaXNlZCBkdXJpbmcgcmVtb3ZhbC5cclxuICAgICAgICAvLyBUaGUgbWFpbiBwcm9ibGVtIGhlcmUgaXMgdGhlIGZhY3QgdGhhdCB1c2VycyBhcmUgYWN0aXZlbHkgbWVzc2luZyB3aXRoXHJcbiAgICAgICAgLy8gIHRoZSBtZW51IG1vZCB3ZSBnZW5lcmF0ZSBjYXVzaW5nIG9kZCBlcnJvcnMgdG8gcG9wIHVwLlxyXG4gICAgICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHJlbW92ZSBtZW51IG1vZCcsIGVycm9yKTtcclxuICAgICAgICAvLyByZXR1cm4gcmVqZWN0KGVycm9yKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNhY2hlVG9GaWxlTWFwKHN0YXRlLCBwcm9maWxlKSB7XHJcbiAgLy8gT3JnYW5pemVzIGNhY2hlIGVudHJpZXMgaW50byBhIGZpbGVNYXAgd2hpY2hcclxuICAvLyAgY2FuIGJlIHVzZWQgdG8gbG9vcCB0aHJvdWdoIGVhY2ggbW9kIGVudHJ5J3NcclxuICAvLyAgZGF0YSBvbiBhIHBlciBmaWxlIGJhc2lzLlxyXG4gIGNvbnN0IGN1cnJlbnRDYWNoZSA9IGF3YWl0IGdldEV4aXN0aW5nQ2FjaGUoc3RhdGUsIHByb2ZpbGUpO1xyXG4gIGlmIChjdXJyZW50Q2FjaGUubGVuZ3RoID09PSAwKSB7XHJcbiAgICAvLyBOb3RoaW5nIHRvIGRvIGhlcmUuXHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IGZpbGVNYXAgPSBjdXJyZW50Q2FjaGUucmVkdWNlKChhY2N1bSwgZW50cnkpID0+IHtcclxuICAgIGFjY3VtW3RvRmlsZU1hcEtleShlbnRyeS5maWxlcGF0aCldID1cclxuICAgICAgW10uY29uY2F0KGFjY3VtW3RvRmlsZU1hcEtleShlbnRyeS5maWxlcGF0aCldIHx8IFtdLFxyXG4gICAgICBbe1xyXG4gICAgICAgIGlkOiBlbnRyeS5pZCxcclxuICAgICAgICBkYXRhOiBlbnRyeS5kYXRhLFxyXG4gICAgICAgIGZpbGVwYXRoOiBjb252ZXJ0RmlsZVBhdGgoZW50cnkuZmlsZXBhdGgsIHN0YWdpbmdGb2xkZXIpLFxyXG4gICAgICB9XSk7XHJcblxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIGZpbGVNYXA7XHJcbn1cclxuXHJcbmNvbnN0IGNvcHlJbmlGaWxlID0gKHNvdXJjZTogc3RyaW5nLCBkZXN0OiBzdHJpbmcpID0+IGZzLmNvcHlBc3luYyhzb3VyY2UsIGRlc3QpXHJcbiAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZGVzdCkpLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSk7XHJcblxyXG5jb25zdCBnZXRJbml0aWFsRG9jID0gKGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcclxuICByZXR1cm4gZnMuc3RhdEFzeW5jKGZpbGVQYXRoICsgQkFDS1VQX1RBRylcclxuICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlUGF0aCArIEJBQ0tVUF9UQUcpKVxyXG4gICAgLmNhdGNoKGVyciA9PiBmcy5zdGF0QXN5bmMoZmlsZVBhdGgpXHJcbiAgICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlUGF0aCkpKVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIC8vIFdlIGNvdWxkbid0IGZpbmQgdGhlIG9yaWdpbmFsIGRvY3VtZW50LiBUaGlzXHJcbiAgICAgIC8vICBjYW4gcG90ZW50aWFsbHkgaGFwcGVuIHdoZW4gdGhlIC5wYXJ0LnR4dCBzdWZmaXhcclxuICAgICAgLy8gIGdldHMgYWRkZWQgdG8gZmlsZXMgdGhhdCBhcmUgbm90IHN1cHBvc2VkIHRvIGJlXHJcbiAgICAgIC8vICBkZXBsb3llZCB0byB0aGUgZG9jdW1lbnRzIGZvbGRlciwgbG9nIGFuZCBjb250aW51ZS5cclxuICAgICAgbG9nKCd3YXJuJywgJ1czOiBjYW5ub3QgZmluZCBvcmlnaW5hbCBmaWxlJywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgICB9KTtcclxufTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHdyaXRlQ2FjaGVUb0ZpbGVzKGFwaSwgcHJvZmlsZSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QocHJvZmlsZS5uYW1lKTtcclxuICBjb25zdCBpbnN0YWxsUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIHByb2ZpbGUuZ2FtZUlkKTtcclxuICBjb25zdCBkZXN0aW5hdGlvbkZvbGRlciA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kTmFtZSk7XHJcbiAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShwcm9maWxlLmdhbWVJZCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgcHJvZmlsZS5nYW1lSWQpO1xyXG4gIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XHJcbiAgY29uc3QgZG9jTW9kUGF0aCA9IG1vZFBhdGhzWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnXTtcclxuICBjb25zdCBjdXJyZW50Q2FjaGUgPSBhd2FpdCBnZXRFeGlzdGluZ0NhY2hlKHN0YXRlLCBwcm9maWxlKTtcclxuICBpZiAoY3VycmVudENhY2hlLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xyXG5cclxuICBjb25zdCBmaWxlTWFwID0gYXdhaXQgY2FjaGVUb0ZpbGVNYXAoc3RhdGUsIHByb2ZpbGUpO1xyXG4gIGlmICghZmlsZU1hcCkgcmV0dXJuO1xyXG5cclxuICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XHJcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGZpbGVNYXApO1xyXG5cclxuICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBzb3VyY2UgPSBhd2FpdCBnZXRJbml0aWFsRG9jKHBhdGguam9pbihkb2NNb2RQYXRoLCBrZXkpKTtcclxuICAgICAgaWYgKCFzb3VyY2UpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgYXdhaXQgY29weUluaUZpbGUoc291cmNlLCBwYXRoLmpvaW4oZGVzdGluYXRpb25Gb2xkZXIsIGtleSkpO1xyXG4gICAgICBjb25zdCBpbml0aWFsRGF0YSA9IGF3YWl0IHBhcnNlci5yZWFkKHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwga2V5KSk7XHJcblxyXG4gICAgICBmb3IgKGNvbnN0IG1vZEVudHJ5IG9mIGZpbGVNYXBba2V5XSkge1xyXG4gICAgICAgIGNvbnN0IHRlbXBGaWxlUGF0aCA9IHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwga2V5KSArIGdlbmVyYXRlKCk7XHJcbiAgICAgICAgY29uc3QgbW9kRGF0YSA9IGF3YWl0IHRvSW5pRmlsZU9iamVjdChtb2RFbnRyeS5kYXRhLCB0ZW1wRmlsZVBhdGgpO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IG1vZEtleSBvZiBPYmplY3Qua2V5cyhtb2REYXRhLmRhdGEpKSB7XHJcbiAgICAgICAgICBpbml0aWFsRGF0YS5kYXRhW21vZEtleV0gPSB7XHJcbiAgICAgICAgICAgIC4uLmluaXRpYWxEYXRhLmRhdGFbbW9kS2V5XSxcclxuICAgICAgICAgICAgLi4ubW9kRGF0YS5kYXRhW21vZEtleV0sXHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBhd2FpdCBwYXJzZXIud3JpdGUocGF0aC5qb2luKGRlc3RpbmF0aW9uRm9sZGVyLCBrZXkpLCBpbml0aWFsRGF0YSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJyAmJiBbXHJcbiAgICAgICAgcGF0aC5qb2luKGRvY01vZFBhdGgsIElOUFVUX1NFVFRJTkdTX0ZJTEVOQU1FKSxcclxuICAgICAgICBwYXRoLmpvaW4oZG9jTW9kUGF0aCwgRFhfMTFfVVNFUl9TRVRUSU5HU19GSUxFTkFNRSksXHJcbiAgICAgICAgcGF0aC5qb2luKGRvY01vZFBhdGgsIERYXzEyX1VTRVJfU0VUVElOR1NfRklMRU5BTUUpLFxyXG4gICAgICBdLmluY2x1ZGVzKGVyci5wYXRoKSkge1xyXG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBpbnN0YWxsIG1lbnUgbW9kJywgbmV3IHV0aWwuRGF0YUludmFsaWQoJ1JlcXVpcmVkIHNldHRpbmcgZmlsZXMgYXJlIG1pc3NpbmcgLSBwbGVhc2UgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgYW5kIHRyeSBhZ2Fpbi4nKSwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHRocm93IGVycjtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVNZW51TW9kKGFwaSwgcHJvZmlsZSkge1xyXG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XHJcbiAgLy8gICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgLy8gfVxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QocHJvZmlsZS5uYW1lKTtcclxuICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgcHJvZmlsZS5nYW1lSWQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgY3JlYXRlTWVudU1vZChhcGksIG1vZE5hbWUsIHByb2ZpbGUpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBnaXZlIHRoZSB1c2VyIGFuIGluZGljYXRpb24gd2hlbiB0aGlzIHdhcyBsYXN0IHVwZGF0ZWRcclxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSwgJ2luc3RhbGxUaW1lJywgbmV3IERhdGUoKSkpO1xyXG4gICAgLy8gdGhlIHJlc3QgaGVyZSBpcyBvbmx5IHJlcXVpcmVkIHRvIHVwZGF0ZSBtb2RzIGZyb20gcHJldmlvdXMgdm9ydGV4IHZlcnNpb25zXHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ25hbWUnLCAnV2l0Y2hlciAzIE1lbnUgTW9kJykpO1xyXG5cclxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndHlwZScsICd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnKSk7XHJcblxyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdsb2dpY2FsRmlsZU5hbWUnLCAnV2l0Y2hlciAzIE1lbnUgTW9kJykpO1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLCAnbW9kSWQnLCA0MikpO1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLCAndmVyc2lvbicsICcxLjAuMCcpKTtcclxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSwgJ3ZhcmlhbnQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbml0aXplUHJvZmlsZU5hbWUocHJvZmlsZS5uYW1lKSkpO1xyXG4gIH1cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZE5hbWUpO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXhwb3J0TWVudU1vZChhcGksIHByb2ZpbGUsIGluY2x1ZGVkTW9kcykge1xyXG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XHJcbiAgLy8gICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIC8vIH1cclxuICB0cnkge1xyXG4gICAgY29uc3QgZGVwbG95bWVudCA9IGF3YWl0IGdldERlcGxveW1lbnQoYXBpLCBpbmNsdWRlZE1vZHMpO1xyXG4gICAgaWYgKGRlcGxveW1lbnQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBnZXQgZGVwbG95bWVudCcpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbW9kTmFtZSA9IGF3YWl0IG9uRGlkRGVwbG95KGFwaSwgZGVwbG95bWVudCwgcHJvZmlsZSk7XHJcbiAgICBpZiAobW9kTmFtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIFRoZSBpbnN0YWxsZWQgbW9kcyBkbyBub3QgcmVxdWlyZSBhIG1lbnUgbW9kLlxyXG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gICAgY29uc3QgbW9kSWQgPSBPYmplY3Qua2V5cyhtb2RzKS5maW5kKGlkID0+IGlkID09PSBtb2ROYW1lKTtcclxuICAgIGlmIChtb2RJZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWVudSBtb2QgaXMgbWlzc2luZycpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZHNbbW9kSWRdLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHByZXBhcmVGaWxlRGF0YShtb2RQYXRoKTtcclxuICAgIHJldHVybiBkYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW1wb3J0TWVudU1vZChhcGksIHByb2ZpbGUsIGZpbGVEYXRhKSB7XHJcbiAgLy8gaWYgKCFpc1NldHRpbmdzTWVyZ2VTdXBwcmVzc2VkKGFwaSkpIHtcclxuICAvLyAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICAvLyB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSBhd2FpdCBlbnN1cmVNZW51TW9kKGFwaSwgcHJvZmlsZSk7XHJcbiAgICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdtb2RzJywgcHJvZmlsZS5nYW1lSWQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xyXG4gICAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGRlc3RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCk7XHJcbiAgICBhd2FpdCByZXN0b3JlRmlsZURhdGEoZmlsZURhdGEsIGRlc3RQYXRoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG4iXX0=