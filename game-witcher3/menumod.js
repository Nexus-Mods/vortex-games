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
exports.importMenuMod = exports.exportMenuMod = exports.ensureMenuMod = exports.removeMenuMod = exports.menuMod = exports.onDidDeploy = exports.onWillDeploy = void 0;
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
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
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
exports.onWillDeploy = onWillDeploy;
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
exports.onDidDeploy = onDidDeploy;
function sanitizeProfileName(input) {
    return input.replace(INVALID_CHARS, '_');
}
function menuMod(profileName) {
    return `Witcher 3 Menu Mod Data (${sanitizeProfileName(profileName)})`;
}
exports.menuMod = menuMod;
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
exports.removeMenuMod = removeMenuMod;
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
exports.ensureMenuMod = ensureMenuMod;
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
exports.exportMenuMod = exportMenuMod;
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
exports.importMenuMod = importMenuMod;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudW1vZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lbnVtb2QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLHdEQUFnQztBQUNoQywyQ0FBc0U7QUFDdEUsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDOUMscUNBQW1DO0FBRW5DLDZDQUFzRDtBQUN0RCw2Q0FBc0U7QUFDdEUsaUNBQXVDO0FBQ3ZDLHFDQUFvRTtBQUdwRSxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUM7QUFDdEMsTUFBTSx1QkFBdUIsR0FBRyxnQkFBZ0IsQ0FBQztBQUNqRCxNQUFNLDRCQUE0QixHQUFHLGVBQWUsQ0FBQztBQUNyRCxNQUFNLDRCQUE0QixHQUFHLG1CQUFtQixDQUFDO0FBQ3pELE1BQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDO0FBY3BDLE1BQU0sY0FBYyxHQUFHLHNCQUFzQixDQUFBO0FBZTdDLFNBQWUsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLGFBQWE7O1FBQ2xELE1BQU0sYUFBYSxHQUFHLHNCQUFTLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztRQUNuRSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVDLE1BQU0sR0FBRyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUU7WUFDckIsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUVELElBQUk7WUFDRixNQUFNLFNBQVMsR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQzlELEdBQUcsQ0FBQyxn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Q0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDOUQsTUFBTSxJQUFBLHNCQUFlLEVBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQzNDO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDO0NBQUE7QUFiRCxzQ0FhQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmNvbnN0IEluaVBhcnNlciA9IHJlcXVpcmUoJ3ZvcnRleC1wYXJzZS1pbmknKTtcclxuaW1wb3J0IHsgZ2VuZXJhdGUgfSBmcm9tICdzaG9ydGlkJztcclxuXHJcbmltcG9ydCB7IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xyXG5pbXBvcnQgeyBwcmVwYXJlRmlsZURhdGEsIHJlc3RvcmVGaWxlRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdXRpbCc7XHJcbmltcG9ydCB7IGdldERlcGxveW1lbnQgfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgeyBHQU1FX0lELCBJTlBVVF9YTUxfRklMRU5BTUUsIFBBUlRfU1VGRklYIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuLy8gbW9zdCBvZiB0aGVzZSBhcmUgaW52YWxpZCBvbiB3aW5kb3dzIG9ubHkgYnV0IGl0J3Mgbm90IHdvcnRoIHRoZSBlZmZvcnQgYWxsb3dpbmcgdGhlbSBlbHNld2hlcmVcclxuY29uc3QgSU5WQUxJRF9DSEFSUyA9IC9bOi9cXFxcKj9cIjw+fF0vZztcclxuY29uc3QgSU5QVVRfU0VUVElOR1NfRklMRU5BTUUgPSAnaW5wdXQuc2V0dGluZ3MnO1xyXG5jb25zdCBEWF8xMV9VU0VSX1NFVFRJTkdTX0ZJTEVOQU1FID0gJ3VzZXIuc2V0dGluZ3MnO1xyXG5jb25zdCBEWF8xMl9VU0VSX1NFVFRJTkdTX0ZJTEVOQU1FID0gJ2R4MTJ1c2VyLnNldHRpbmdzJztcclxuY29uc3QgQkFDS1VQX1RBRyA9ICcudm9ydGV4X2JhY2t1cCc7XHJcblxyXG5pbnRlcmZhY2UgSUNhY2hlRW50cnkge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgZmlsZXBhdGg6IHN0cmluZztcclxuICBkYXRhOiBzdHJpbmc7XHJcbn1cclxuXHJcbnR5cGUgSUZpbGVNYXAgPSB7IFtlbnRyeUlkOiBzdHJpbmddOiBJQ2FjaGVFbnRyeVtdIH07XHJcblxyXG4vLyBXZSdyZSBnb2luZyB0byBzYXZlIHBlciBtb2QgaW5pIHNldHRpbmdzIGZvciBlYWNoXHJcbi8vICBmaWxlICh3aGVyZSBhcHBsaWNhYmxlKSBpbnRvIHRoaXMgY2FjaGUgZmlsZSBzb1xyXG4vLyAgd2UgY2FuIGtlZXAgdHJhY2sgb2YgY2hhbmdlcyB0aGF0IHRoZSB1c2VyIG1hZGVcclxuLy8gIGR1cmluZyBoaXMgcGxheXRocm91Z2guXHJcbmNvbnN0IENBQ0hFX0ZJTEVOQU1FID0gJ3ZvcnRleF9tZW51bW9kLmNhY2hlJ1xyXG4vKiBDYWNoZSBmb3JtYXQgc2hvdWxkIGJlIGFzIGZvbGxvd3M6XHJcbiAgW1xyXG4gICAge1xyXG4gICAgICBpZDogJG1vZElkXHJcbiAgICAgIGZpbGVwYXRoOiAnLi4vaW5wdXQuc2V0dGluZ3MnLFxyXG4gICAgICBkYXRhOiAnaW5pIGRhdGEgaW4gc3RyaW5nIGZvcm1hdCcsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBpZDogJG1vZElkXHJcbiAgICAgIGZpbGVuYW1lOiAnLi4vdXNlci5zZXR0aW5ncycsXHJcbiAgICAgIGRhdGE6ICdpbmkgZGF0YSBpbiBzdHJpbmcgZm9ybWF0JyxcclxuICAgIH0sXHJcbiAgXVxyXG4qL1xyXG5hc3luYyBmdW5jdGlvbiBnZXRFeGlzdGluZ0NhY2hlKHN0YXRlLCBhY3RpdmVQcm9maWxlKSB7XHJcbiAgY29uc3Qgc3RhZ2luZ0ZvbGRlciA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gIGNvbnN0IG1vZE5hbWUgPSBtZW51TW9kKGFjdGl2ZVByb2ZpbGUubmFtZSk7XHJcbiAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNhY2hlRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsXHJcbiAgICAgIG1vZC5pbnN0YWxsYXRpb25QYXRoLCBDQUNIRV9GSUxFTkFNRSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICAgIGNvbnN0IGN1cnJlbnRDYWNoZSA9IEpTT04ucGFyc2UoY2FjaGVEYXRhKTtcclxuICAgIHJldHVybiBjdXJyZW50Q2FjaGU7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBXZSB3ZXJlIHVuYWJsZSB0byByZWFkL3BhcnNlIHRoZSBjYWNoZSBmaWxlIC0gdGhpcyBpcyBwZXJmZWN0bHlcclxuICAgIC8vICB2YWxpZCB3aGVuIHRoZSBjYWNoZSBmaWxlIGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LCBhbmQgZXZlbiBpZi93aGVuXHJcbiAgICAvLyAgdGhlIGVycm9yIGlzIG1vcmUgc2VyaW91cyAtIHdlIHNob3VsZG4ndCBibG9jayB0aGUgZGVwbG95bWVudC5cclxuICAgIGxvZygnd2FybicsICdXMzogZmFpbGVkIHRvIHJlYWQvcGFyc2UgY2FjaGUgZmlsZScsIGVycik7XHJcbiAgICByZXR1cm4gW107XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiB0b0ZpbGVNYXBLZXkoZmlsZVBhdGgpIHtcclxuICByZXR1cm4gcGF0aC5iYXNlbmFtZShmaWxlUGF0aClcclxuICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgICAgICAucmVwbGFjZShQQVJUX1NVRkZJWCwgJycpO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gcmVhZE1vZERhdGEoZmlsZVBhdGgpIHtcclxuICByZXR1cm4gZnMucmVhZEZpbGVBc3luYyhmaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKTtcclxufVxyXG5cclxuZnVuY3Rpb24gcG9wdWxhdGVDYWNoZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGFjdGl2ZVByb2ZpbGU6IHR5cGVzLklQcm9maWxlLCBtb2RJZHM/OiBzdHJpbmdbXSwgaW5pdGlhbENhY2hlVmFsdWU/OiBJQ2FjaGVFbnRyeVtdKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBsb2FkT3JkZXIgPSBnZXRQZXJzaXN0ZW50TG9hZE9yZGVyKGFwaSk7XHJcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xyXG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKGFjdGl2ZVByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xyXG5cclxuICBsZXQgbmV4dEF2YWlsYWJsZUlkID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKS5sZW5ndGg7XHJcbiAgY29uc3QgZ2V0TmV4dElkID0gKCkgPT4ge1xyXG4gICAgcmV0dXJuIG5leHRBdmFpbGFibGVJZCsrO1xyXG4gIH1cclxuICBjb25zdCB0b0lkeCA9IChsb0l0ZW0pID0+IChsb2FkT3JkZXIuaW5kZXhPZihsb0l0ZW0pIHx8IGdldE5leHRJZCgpKTtcclxuICBjb25zdCBpbnZhbGlkTW9kVHlwZXMgPSBbJ3dpdGNoZXIzbWVudW1vZGRvY3VtZW50cyddO1xyXG4gIGNvbnN0IGFmZmVjdGVkTW9kSWRzID0gbW9kSWRzID09PSB1bmRlZmluZWQgPyBPYmplY3Qua2V5cyhtb2RzKSA6IG1vZElkcztcclxuICBjb25zdCBlbmFibGVkTW9kcyA9IGFmZmVjdGVkTW9kSWRzXHJcbiAgICAuZmlsdGVyKGtleSA9PiAobW9kc1trZXldPy5pbnN0YWxsYXRpb25QYXRoICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgICAmJiAhIW1vZFN0YXRlW2tleV0/LmVuYWJsZWQgJiZcclxuICAgICAgICAgICAgICAgICFpbnZhbGlkTW9kVHlwZXMuaW5jbHVkZXMobW9kc1trZXldLnR5cGUpKVxyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiAodG9JZHgobGhzKSkgLSAodG9JZHgocmhzKSkpXHJcbiAgICAubWFwKGtleSA9PiBtb2RzW2tleV0pO1xyXG5cclxuICBjb25zdCBnZXRSZWxldmFudE1vZEVudHJpZXMgPSBhc3luYyAoc291cmNlKSA9PiB7XHJcbiAgICBsZXQgYWxsRW50cmllcyA9IFtdO1xyXG4gICAgYXdhaXQgcmVxdWlyZSgndHVyYm93YWxrJykuZGVmYXVsdChzb3VyY2UsIGVudHJpZXMgPT4ge1xyXG4gICAgICBjb25zdCByZWxldmFudEVudHJpZXMgPSBlbnRyaWVzLmZpbHRlcihlbnRyeSA9PlxyXG4gICAgICAgICAgIChlbnRyeS5maWxlUGF0aC5lbmRzV2l0aChQQVJUX1NVRkZJWCkpXHJcbiAgICAgICAgJiYgKGVudHJ5LmZpbGVQYXRoLmluZGV4T2YoSU5QVVRfWE1MX0ZJTEVOQU1FKSA9PT0gLTEpKVxyXG4gICAgICAgICAgICAgIC5tYXAoZW50cnkgPT4gZW50cnkuZmlsZVBhdGgpO1xyXG5cclxuICAgICAgYWxsRW50cmllcyA9IFtdLmNvbmNhdChhbGxFbnRyaWVzLCByZWxldmFudEVudHJpZXMpO1xyXG4gICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgaWYgIChbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmRleE9mKGVyci5jb2RlKSA9PT0gLTEpIHtcclxuICAgICAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBsb29rdXAgbWVudSBtb2QgZmlsZXMnLFxyXG4gICAgICAgICAgeyBwYXRoOiBzb3VyY2UsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICByZXR1cm4gYWxsRW50cmllcztcclxuICB9O1xyXG5cclxuICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgcmV0dXJuIEJsdWViaXJkLnJlZHVjZShlbmFibGVkTW9kcywgKGFjY3VtLCBtb2Q6IHR5cGVzLklNb2QpID0+IHtcclxuICAgIGlmIChtb2QuaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH1cclxuICAgIHJldHVybiBnZXRSZWxldmFudE1vZEVudHJpZXMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIG1vZC5pbnN0YWxsYXRpb25QYXRoKSlcclxuICAgICAgLnRoZW4oZW50cmllcyA9PiB7XHJcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLmVhY2goZW50cmllcywgZmlsZXBhdGggPT4ge1xyXG4gICAgICAgICAgcmV0dXJuIHJlYWRNb2REYXRhKGZpbGVwYXRoKVxyXG4gICAgICAgICAgICAudGhlbihkYXRhID0+IHtcclxuICAgICAgICAgICAgICBpZiAoZGF0YSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBhY2N1bS5wdXNoKHsgaWQ6IG1vZC5pZCwgZmlsZXBhdGgsIGRhdGEgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKSlcclxuICAgICAgfSlcclxuICB9LCBpbml0aWFsQ2FjaGVWYWx1ZSAhPT0gdW5kZWZpbmVkID8gaW5pdGlhbENhY2hlVmFsdWUgOiBbXSlcclxuICAudGhlbihuZXdDYWNoZSA9PiB7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gbWVudU1vZChhY3RpdmVQcm9maWxlLm5hbWUpO1xyXG4gICAgbGV0IG1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcclxuICAgIGlmIChtb2Q/Lmluc3RhbGxhdGlvblBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBsb2coJ3dhcm4nLCAnZmFpbGVkIHRvIGFzY2VydGFpbiBpbnN0YWxsYXRpb24gcGF0aCcsIG1vZE5hbWUpO1xyXG4gICAgICAvLyBXZSB3aWxsIGNyZWF0ZSBpdCBvbiB0aGUgbmV4dCBydW4uXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMocGF0aC5qb2luKHN0YWdpbmdGb2xkZXIsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCBDQUNIRV9GSUxFTkFNRSksIEpTT04uc3RyaW5naWZ5KG5ld0NhY2hlKSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbnZlcnRGaWxlUGF0aChmaWxlUGF0aCwgaW5zdGFsbFBhdGgpIHsgXHJcbiAgLy8gUHJlLWNvbGxlY3Rpb25zIHdlIHdvdWxkIHVzZSBhYnNvbHV0ZSBwYXRocyBwb2ludGluZ1xyXG4gIC8vICB0byB0aGUgbWVudSBtb2QgaW5wdXQgbW9kaWZpY2F0aW9uczsgdGhpcyB3aWxsIG9idmlvdXNseVxyXG4gIC8vICB3b3JrIGp1c3QgZmluZSBvbiB0aGUgY3VyYXRvcidzIGVuZCwgYnV0IHJlbHBhdGhzIHNob3VsZCBiZSB1c2VkXHJcbiAgLy8gIG9uIHRoZSB1c2VyJ3MgZW5kLiBUaGlzIGZ1bmN0b3Igd2lsbCBjb252ZXJ0IHRoZSBhYnMgcGF0aCBmcm9tXHJcbiAgLy8gIHRoZSBjdXJhdG9yJ3MgcGF0aCB0byB0aGUgdXNlcidzIHBhdGguXHJcbiAgY29uc3Qgc2VnbWVudHMgPSBmaWxlUGF0aC5zcGxpdChwYXRoLnNlcCk7XHJcbiAgY29uc3QgaWR4ID0gc2VnbWVudHMucmVkdWNlKChwcmV2LCBzZWcsIGlkeCkgPT4ge1xyXG4gICAgaWYgKHNlZy50b0xvd2VyQ2FzZSgpID09PSBHQU1FX0lEKSB7XHJcbiAgICAgIHJldHVybiBpZHg7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH1cclxuICB9LCAtMSk7XHJcbiAgaWYgKGlkeCA9PT0gLTEpIHtcclxuICAgIGxvZygnZXJyb3InLCAndW5leHBlY3RlZCBtZW51IG1vZCBmaWxlcGF0aCcsIGZpbGVQYXRoKTtcclxuICAgIHJldHVybiBmaWxlUGF0aDtcclxuICB9XHJcbiAgLy8gV2Ugc2xpY2Ugb2ZmIGV2ZXJ5dGhpbmcgdXAgdG8gdGhlIEdBTUVfSUQgYW5kIHRoZSAnbW9kcycgZm9sZGVyLlxyXG4gIGNvbnN0IHJlbFBhdGggPSBzZWdtZW50cy5zbGljZShpZHggKyAyKS5qb2luKHBhdGguc2VwKTtcclxuICByZXR1cm4gcGF0aC5qb2luKGluc3RhbGxQYXRoLCByZWxQYXRoKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG9uV2lsbERlcGxveShhcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpIHtcclxuICAvLyBpZiAoIWlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xyXG4gIC8vICAgcmV0dXJuO1xyXG4gIC8vIH1cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGlmIChhY3RpdmVQcm9maWxlPy5uYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBhY3RpdmVQcm9maWxlLmdhbWVJZCk7XHJcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QoYWN0aXZlUHJvZmlsZS5uYW1lKTtcclxuICBjb25zdCBkZXN0aW5hdGlvbkZvbGRlciA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kTmFtZSk7XHJcbiAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShhY3RpdmVQcm9maWxlLmdhbWVJZCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgYWN0aXZlUHJvZmlsZS5nYW1lSWQpO1xyXG4gIGNvbnN0IG1vZFBhdGhzID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XHJcbiAgY29uc3QgZG9jTW9kUGF0aCA9IG1vZFBhdGhzWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnXTtcclxuICBjb25zdCBjdXJyZW50Q2FjaGUgPSBhd2FpdCBnZXRFeGlzdGluZ0NhY2hlKHN0YXRlLCBhY3RpdmVQcm9maWxlKTtcclxuICBpZiAoY3VycmVudENhY2hlLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgLy8gTm90aGluZyB0byBjb21wYXJlLCB1c2VyIGRvZXMgbm90IGhhdmUgYSBjYWNoZS5cclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IGRvY0ZpbGVzID0gKGRlcGxveW1lbnRbJ3dpdGNoZXIzbWVudW1vZHJvb3QnXSA/PyBbXSlcclxuICAgIC5maWx0ZXIoZmlsZSA9PiAoZmlsZS5yZWxQYXRoLmVuZHNXaXRoKFBBUlRfU1VGRklYKSlcclxuICAgICAgICAgICAgICAgICAmJiAoZmlsZS5yZWxQYXRoLmluZGV4T2YoSU5QVVRfWE1MX0ZJTEVOQU1FKSA9PT0gLTEpKTtcclxuXHJcbiAgaWYgKGRvY0ZpbGVzLmxlbmd0aCA8PSAwKSB7XHJcbiAgICAvLyBObyBkb2MgZmlsZXMsIG5vIHByb2JsZW0uXHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBjb25zdCBtb2RzID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSk7XHJcbiAgY29uc3QgbW9kU3RhdGUgPSB1dGlsLmdldFNhZmUoYWN0aXZlUHJvZmlsZSwgWydtb2RTdGF0ZSddLCB7fSk7XHJcbiAgY29uc3QgaW52YWxpZE1vZFR5cGVzID0gWyd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnXTtcclxuICBjb25zdCBlbmFibGVkTW9kcyA9IE9iamVjdC5rZXlzKG1vZHMpXHJcbiAgICAuZmlsdGVyKGtleSA9PiAhIW1vZFN0YXRlW2tleV0/LmVuYWJsZWQgJiYgIWludmFsaWRNb2RUeXBlcy5pbmNsdWRlcyhtb2RzW2tleV0udHlwZSkpO1xyXG5cclxuICBjb25zdCBwYXJzZXIgPSBuZXcgSW5pUGFyc2VyLmRlZmF1bHQobmV3IEluaVBhcnNlci5XaW5hcGlGb3JtYXQoKSk7XHJcblxyXG4gIGNvbnN0IGZpbGVNYXAgPSBhd2FpdCBjYWNoZVRvRmlsZU1hcChzdGF0ZSwgYWN0aXZlUHJvZmlsZSk7XHJcbiAgaWYgKGZpbGVNYXAgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGZpbGVNYXApO1xyXG4gIGNvbnN0IG1hdGNoZXIgPSAoZW50cnkpID0+IGtleXMuaW5jbHVkZXModG9GaWxlTWFwS2V5KGVudHJ5LnJlbFBhdGgpKTtcclxuICBjb25zdCBuZXdDYWNoZSA9IGF3YWl0IEJsdWViaXJkLnJlZHVjZShrZXlzLCBhc3luYyAoYWNjdW0sIGtleSkgPT4ge1xyXG4gICAgaWYgKGRvY0ZpbGVzLmZpbmQobWF0Y2hlcikgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb25zdCBtZXJnZWREYXRhID0gYXdhaXQgcGFyc2VyLnJlYWQocGF0aC5qb2luKGRvY01vZFBhdGgsIGtleSkpO1xyXG4gICAgICBhd2FpdCBCbHVlYmlyZC5lYWNoKGZpbGVNYXBba2V5XSwgYXN5bmMgKGl0ZXI6IElDYWNoZUVudHJ5KSA9PiB7XHJcbiAgICAgICAgaWYgKGVuYWJsZWRNb2RzLmluY2x1ZGVzKGl0ZXIuaWQpKSB7XHJcbiAgICAgICAgICBjb25zdCB0ZW1wUGF0aCA9IHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwga2V5KSArIGdlbmVyYXRlKCk7XHJcbiAgICAgICAgICBjb25zdCBtb2REYXRhID0gYXdhaXQgdG9JbmlGaWxlT2JqZWN0KGl0ZXIuZGF0YSwgdGVtcFBhdGgpO1xyXG4gICAgICAgICAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1vZERhdGEuZGF0YSk7XHJcbiAgICAgICAgICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgcmV0dXJuIEJsdWViaXJkLmVhY2gobW9kS2V5cywgbW9kS2V5ID0+IHtcclxuICAgICAgICAgICAgaWYgKChtZXJnZWREYXRhLmRhdGFbbW9kS2V5XSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICYmIChtb2REYXRhLmRhdGFbbW9kS2V5XSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgICYmIChtZXJnZWREYXRhLmRhdGFbbW9kS2V5XSAhPT0gbW9kRGF0YS5kYXRhW21vZEtleV0pKSB7XHJcbiAgICAgICAgICAgICAgICBtb2REYXRhLmRhdGFbbW9kS2V5XSA9IG1lcmdlZERhdGEuZGF0YVttb2RLZXldO1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pLnRoZW4oYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgbmV3TW9kRGF0YTtcclxuICAgICAgICAgICAgaWYgKGNoYW5nZWQpIHtcclxuICAgICAgICAgICAgICBhd2FpdCBwYXJzZXIud3JpdGUoaXRlci5maWxlcGF0aCwgbW9kRGF0YSk7XHJcbiAgICAgICAgICAgICAgbmV3TW9kRGF0YSA9IGF3YWl0IHJlYWRNb2REYXRhKGl0ZXIuZmlsZXBhdGgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIG5ld01vZERhdGEgPSBpdGVyLmRhdGE7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChuZXdNb2REYXRhICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICBhY2N1bS5wdXNoKHsgaWQ6IGl0ZXIuaWQsIGZpbGVwYXRoOiBpdGVyLmZpbGVwYXRoLCBkYXRhOiBuZXdNb2REYXRhIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XHJcbiAgfSwgW10pO1xyXG5cclxuICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMocGF0aC5qb2luKGRlc3RpbmF0aW9uRm9sZGVyLCBDQUNIRV9GSUxFTkFNRSksIEpTT04uc3RyaW5naWZ5KG5ld0NhY2hlKSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHRvSW5pRmlsZU9iamVjdChkYXRhLCB0ZW1wRGVzdCkge1xyXG4gIC8vIEdpdmVuIHRoYXQgd2luYXBpIHJlcXVpcmVzIGEgZmlsZSB0byBjb3JyZWN0bHkgcmVhZC9wYXJzZVxyXG4gIC8vICBhbiBJbmlGaWxlIG9iamVjdCwgd2UncmUgZ29pbmcgdG8gdXNlIHRoaXMgaGFja3kgZGlzZ3VzdGluZ1xyXG4gIC8vICBmdW5jdGlvbiB0byBxdWlja2x5IGNyZWF0ZSBhIHRlbXAgZmlsZSwgcmVhZCBpdCwgZGVzdHJveSBpdFxyXG4gIC8vICBhbmQgcmV0dXJuIHRoZSBvYmplY3QgYmFjayB0byB0aGUgY2FsbGVyLlxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyh0ZW1wRGVzdCwgZGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xyXG4gICAgY29uc3QgaW5pRGF0YSA9IGF3YWl0IHBhcnNlci5yZWFkKHRlbXBEZXN0KTtcclxuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKHRlbXBEZXN0KTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaW5pRGF0YSk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvbkRpZERlcGxveShhcGksIGRlcGxveW1lbnQsIGFjdGl2ZVByb2ZpbGUpIHtcclxuICAvLyBpZiAoIWlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xyXG4gIC8vICAgcmV0dXJuO1xyXG4gIC8vIH1cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGxvYWRPcmRlciA9IGdldFBlcnNpc3RlbnRMb2FkT3JkZXIoYXBpKTtcclxuICBjb25zdCBkb2NGaWxlcyA9IGRlcGxveW1lbnRbJ3dpdGNoZXIzbWVudW1vZHJvb3QnXS5maWx0ZXIoZmlsZSA9PiAoZmlsZS5yZWxQYXRoLmVuZHNXaXRoKFBBUlRfU1VGRklYKSlcclxuICAgICYmIChmaWxlLnJlbFBhdGguaW5kZXhPZihJTlBVVF9YTUxfRklMRU5BTUUpID09PSAtMSkpO1xyXG5cclxuICBpZiAoZG9jRmlsZXMubGVuZ3RoIDw9IDApIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICBjb25zdCBtb2RTdGF0ZSA9IHV0aWwuZ2V0U2FmZShhY3RpdmVQcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KTtcclxuICBsZXQgbmV4dEF2YWlsYWJsZUlkID0gbG9hZE9yZGVyLmxlbmd0aDtcclxuICBjb25zdCBnZXROZXh0SWQgPSAoKSA9PiB7XHJcbiAgICByZXR1cm4gbmV4dEF2YWlsYWJsZUlkKys7XHJcbiAgfVxyXG4gIGNvbnN0IGludmFsaWRNb2RUeXBlcyA9IFsnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XHJcbiAgY29uc3QgZW5hYmxlZE1vZHMgPSBPYmplY3Qua2V5cyhtb2RzKVxyXG4gICAgLmZpbHRlcihrZXkgPT4gISFtb2RTdGF0ZVtrZXldPy5lbmFibGVkICYmICFpbnZhbGlkTW9kVHlwZXMuaW5jbHVkZXMobW9kc1trZXldLnR5cGUpKVxyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiAobG9hZE9yZGVyW3Joc10/LnBvcyB8fCBnZXROZXh0SWQoKSkgLSAobG9hZE9yZGVyW2xoc10/LnBvcyB8fCBnZXROZXh0SWQoKSkpXHJcblxyXG4gIGNvbnN0IGN1cnJlbnRDYWNoZSA9IGF3YWl0IGdldEV4aXN0aW5nQ2FjaGUoc3RhdGUsIGFjdGl2ZVByb2ZpbGUpO1xyXG4gIGNvbnN0IGluQ2FjaGUgPSBuZXcgU2V0KGN1cnJlbnRDYWNoZS5tYXAoZW50cnkgPT4gZW50cnkuaWQpKTtcclxuICBjb25zdCBub3RJbkNhY2hlOiBTZXQ8c3RyaW5nPiA9IG5ldyBTZXQoZG9jRmlsZXMubWFwKGZpbGUgPT4gZmlsZS5zb3VyY2UpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKG1vZElkID0+ICFpbkNhY2hlLmhhcyhtb2RJZCkpKTtcclxuICByZXR1cm4gZW5zdXJlTWVudU1vZChhcGksIGFjdGl2ZVByb2ZpbGUpXHJcbiAgICAudGhlbigoKSA9PiAoKGN1cnJlbnRDYWNoZS5sZW5ndGggPT09IDApICYmIChlbmFibGVkTW9kcy5sZW5ndGggPiAwKSlcclxuICAgICAgPyBwb3B1bGF0ZUNhY2hlKGFwaSwgYWN0aXZlUHJvZmlsZSlcclxuICAgICAgOiAobm90SW5DYWNoZS5zaXplICE9PSAwKVxyXG4gICAgICAgID8gcG9wdWxhdGVDYWNoZShhcGksIGFjdGl2ZVByb2ZpbGUsIEFycmF5LmZyb20obm90SW5DYWNoZSksIGN1cnJlbnRDYWNoZSlcclxuICAgICAgICA6IFByb21pc2UucmVzb2x2ZSgpKVxyXG4gICAgLnRoZW4oKCkgPT4gd3JpdGVDYWNoZVRvRmlsZXMoYXBpLCBhY3RpdmVQcm9maWxlKSlcclxuICAgIC50aGVuKCgpID0+IG1lbnVNb2QoYWN0aXZlUHJvZmlsZS5uYW1lKSlcclxuICAgIC5jYXRjaChlcnIgPT4gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpXHJcbiAgICAgIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhbml0aXplUHJvZmlsZU5hbWUoaW5wdXQpIHtcclxuICByZXR1cm4gaW5wdXQucmVwbGFjZShJTlZBTElEX0NIQVJTLCAnXycpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWVudU1vZChwcm9maWxlTmFtZSkge1xyXG4gIHJldHVybiBgV2l0Y2hlciAzIE1lbnUgTW9kIERhdGEgKCR7c2FuaXRpemVQcm9maWxlTmFtZShwcm9maWxlTmFtZSl9KWA7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZU1lbnVNb2QoYXBpLCBtb2ROYW1lLCBwcm9maWxlKSB7XHJcbiAgY29uc3QgbW9kID0ge1xyXG4gICAgaWQ6IG1vZE5hbWUsXHJcbiAgICBzdGF0ZTogJ2luc3RhbGxlZCcsXHJcbiAgICBhdHRyaWJ1dGVzOiB7XHJcbiAgICAgIG5hbWU6ICdXaXRjaGVyIDMgTWVudSBNb2QnLFxyXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoaXMgbW9kIGlzIGEgY29sbGVjdGl2ZSBtZXJnZSBvZiBzZXR0aW5nIGZpbGVzIHJlcXVpcmVkIGJ5IGFueS9hbGwgJ1xyXG4gICAgICAgICAgICAgICAgICsgJ21lbnUgbW9kcyB0aGUgdXNlciBoYXMgaW5zdGFsbGVkIC0gcGxlYXNlIGRvIG5vdCBkaXNhYmxlL3JlbW92ZSB1bmxlc3MgJ1xyXG4gICAgICAgICAgICAgICAgICsgJ2FsbCBtZW51IG1vZHMgaGF2ZSBiZWVuIHJlbW92ZWQgZnJvbSB5b3VyIGdhbWUgZmlyc3QuJyxcclxuICAgICAgbG9naWNhbEZpbGVOYW1lOiAnV2l0Y2hlciAzIE1lbnUgTW9kJyxcclxuICAgICAgbW9kSWQ6IDQyLCAvLyBNZWFuaW5nIG9mIGxpZmVcclxuICAgICAgdmVyc2lvbjogJzEuMC4wJyxcclxuICAgICAgdmFyaWFudDogc2FuaXRpemVQcm9maWxlTmFtZShwcm9maWxlLm5hbWUucmVwbGFjZShJTlZBTElEX0NIQVJTLCAnXycpKSxcclxuICAgICAgaW5zdGFsbFRpbWU6IG5ldyBEYXRlKCksXHJcbiAgICB9LFxyXG4gICAgaW5zdGFsbGF0aW9uUGF0aDogbW9kTmFtZSxcclxuICAgIHR5cGU6ICd3aXRjaGVyM21lbnVtb2Rkb2N1bWVudHMnLFxyXG4gIH07XHJcblxyXG4gIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBhcGkuZXZlbnRzLmVtaXQoJ2NyZWF0ZS1tb2QnLCBwcm9maWxlLmdhbWVJZCwgbW9kLCBhc3luYyAoZXJyb3IpID0+IHtcclxuICAgICAgaWYgKGVycm9yICE9PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICAgIH1cclxuICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVNZW51TW9kKGFwaSwgcHJvZmlsZSkge1xyXG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XHJcbiAgLy8gICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgLy8gfVxyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgbW9kTmFtZSA9IG1lbnVNb2QocHJvZmlsZS5uYW1lKTtcclxuICBjb25zdCBtb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgcHJvZmlsZS5nYW1lSWQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xyXG4gIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgYXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kJywgcHJvZmlsZS5nYW1lSWQsIG1vZC5pZCwgYXN5bmMgKGVycm9yKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xyXG4gICAgICAgIC8vIFRoZSBmYWN0IHRoYXQgd2UncmUgYXR0ZW1wdGluZyB0byByZW1vdmUgdGhlIGFnZ3JlZ2F0ZWQgbWVudSBtb2QgbWVhbnMgdGhhdFxyXG4gICAgICAgIC8vICB0aGUgdXNlciBubyBsb25nZXIgaGFzIGFueSBtZW51IG1vZHMgaW5zdGFsbGVkIGFuZCB0aGVyZWZvcmUgaXQncyBzYWZlIHRvXHJcbiAgICAgICAgLy8gIGlnbm9yZSBhbnkgZXJyb3JzIHRoYXQgbWF5IGhhdmUgYmVlbiByYWlzZWQgZHVyaW5nIHJlbW92YWwuXHJcbiAgICAgICAgLy8gVGhlIG1haW4gcHJvYmxlbSBoZXJlIGlzIHRoZSBmYWN0IHRoYXQgdXNlcnMgYXJlIGFjdGl2ZWx5IG1lc3Npbmcgd2l0aFxyXG4gICAgICAgIC8vICB0aGUgbWVudSBtb2Qgd2UgZ2VuZXJhdGUgY2F1c2luZyBvZGQgZXJyb3JzIHRvIHBvcCB1cC5cclxuICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byByZW1vdmUgbWVudSBtb2QnLCBlcnJvcik7XHJcbiAgICAgICAgLy8gcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBjYWNoZVRvRmlsZU1hcChzdGF0ZSwgcHJvZmlsZSkge1xyXG4gIC8vIE9yZ2FuaXplcyBjYWNoZSBlbnRyaWVzIGludG8gYSBmaWxlTWFwIHdoaWNoXHJcbiAgLy8gIGNhbiBiZSB1c2VkIHRvIGxvb3AgdGhyb3VnaCBlYWNoIG1vZCBlbnRyeSdzXHJcbiAgLy8gIGRhdGEgb24gYSBwZXIgZmlsZSBiYXNpcy5cclxuICBjb25zdCBjdXJyZW50Q2FjaGUgPSBhd2FpdCBnZXRFeGlzdGluZ0NhY2hlKHN0YXRlLCBwcm9maWxlKTtcclxuICBpZiAoY3VycmVudENhY2hlLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgLy8gTm90aGluZyB0byBkbyBoZXJlLlxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIGNvbnN0IHN0YWdpbmdGb2xkZXIgPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICBjb25zdCBmaWxlTWFwID0gY3VycmVudENhY2hlLnJlZHVjZSgoYWNjdW0sIGVudHJ5KSA9PiB7XHJcbiAgICBhY2N1bVt0b0ZpbGVNYXBLZXkoZW50cnkuZmlsZXBhdGgpXSA9XHJcbiAgICAgIFtdLmNvbmNhdChhY2N1bVt0b0ZpbGVNYXBLZXkoZW50cnkuZmlsZXBhdGgpXSB8fCBbXSxcclxuICAgICAgW3tcclxuICAgICAgICBpZDogZW50cnkuaWQsXHJcbiAgICAgICAgZGF0YTogZW50cnkuZGF0YSxcclxuICAgICAgICBmaWxlcGF0aDogY29udmVydEZpbGVQYXRoKGVudHJ5LmZpbGVwYXRoLCBzdGFnaW5nRm9sZGVyKSxcclxuICAgICAgfV0pO1xyXG5cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCB7fSk7XHJcblxyXG4gIHJldHVybiBmaWxlTWFwO1xyXG59XHJcblxyXG5jb25zdCBjb3B5SW5pRmlsZSA9IChzb3VyY2U6IHN0cmluZywgZGVzdDogc3RyaW5nKSA9PiBmcy5jb3B5QXN5bmMoc291cmNlLCBkZXN0KVxyXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGRlc3QpKS5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpO1xyXG5cclxuY29uc3QgZ2V0SW5pdGlhbERvYyA9IChmaWxlUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgcmV0dXJuIGZzLnN0YXRBc3luYyhmaWxlUGF0aCArIEJBQ0tVUF9UQUcpXHJcbiAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZmlsZVBhdGggKyBCQUNLVVBfVEFHKSlcclxuICAgIC5jYXRjaChlcnIgPT4gZnMuc3RhdEFzeW5jKGZpbGVQYXRoKVxyXG4gICAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUoZmlsZVBhdGgpKSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAvLyBXZSBjb3VsZG4ndCBmaW5kIHRoZSBvcmlnaW5hbCBkb2N1bWVudC4gVGhpc1xyXG4gICAgICAvLyAgY2FuIHBvdGVudGlhbGx5IGhhcHBlbiB3aGVuIHRoZSAucGFydC50eHQgc3VmZml4XHJcbiAgICAgIC8vICBnZXRzIGFkZGVkIHRvIGZpbGVzIHRoYXQgYXJlIG5vdCBzdXBwb3NlZCB0byBiZVxyXG4gICAgICAvLyAgZGVwbG95ZWQgdG8gdGhlIGRvY3VtZW50cyBmb2xkZXIsIGxvZyBhbmQgY29udGludWUuXHJcbiAgICAgIGxvZygnd2FybicsICdXMzogY2Fubm90IGZpbmQgb3JpZ2luYWwgZmlsZScsIGVyci5tZXNzYWdlKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfSk7XHJcbn07XHJcblxyXG5hc3luYyBmdW5jdGlvbiB3cml0ZUNhY2hlVG9GaWxlcyhhcGksIHByb2ZpbGUpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZE5hbWUgPSBtZW51TW9kKHByb2ZpbGUubmFtZSk7XHJcbiAgY29uc3QgaW5zdGFsbFBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBwcm9maWxlLmdhbWVJZCk7XHJcbiAgY29uc3QgZGVzdGluYXRpb25Gb2xkZXIgPSBwYXRoLmpvaW4oaW5zdGFsbFBhdGgsIG1vZE5hbWUpO1xyXG4gIGNvbnN0IGdhbWUgPSB1dGlsLmdldEdhbWUocHJvZmlsZS5nYW1lSWQpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIHByb2ZpbGUuZ2FtZUlkKTtcclxuICBjb25zdCBtb2RQYXRocyA9IGdhbWUuZ2V0TW9kUGF0aHMoZGlzY292ZXJ5LnBhdGgpO1xyXG4gIGNvbnN0IGRvY01vZFBhdGggPSBtb2RQYXRoc1snd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJ107XHJcbiAgY29uc3QgY3VycmVudENhY2hlID0gYXdhaXQgZ2V0RXhpc3RpbmdDYWNoZShzdGF0ZSwgcHJvZmlsZSk7XHJcbiAgaWYgKGN1cnJlbnRDYWNoZS5sZW5ndGggPT09IDApIHJldHVybjtcclxuXHJcbiAgY29uc3QgZmlsZU1hcCA9IGF3YWl0IGNhY2hlVG9GaWxlTWFwKHN0YXRlLCBwcm9maWxlKTtcclxuICBpZiAoIWZpbGVNYXApIHJldHVybjtcclxuXHJcbiAgY29uc3QgcGFyc2VyID0gbmV3IEluaVBhcnNlci5kZWZhdWx0KG5ldyBJbmlQYXJzZXIuV2luYXBpRm9ybWF0KCkpO1xyXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhmaWxlTWFwKTtcclxuXHJcbiAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgc291cmNlID0gYXdhaXQgZ2V0SW5pdGlhbERvYyhwYXRoLmpvaW4oZG9jTW9kUGF0aCwga2V5KSk7XHJcbiAgICAgIGlmICghc291cmNlKSBjb250aW51ZTtcclxuXHJcbiAgICAgIGF3YWl0IGNvcHlJbmlGaWxlKHNvdXJjZSwgcGF0aC5qb2luKGRlc3RpbmF0aW9uRm9sZGVyLCBrZXkpKTtcclxuICAgICAgY29uc3QgaW5pdGlhbERhdGEgPSBhd2FpdCBwYXJzZXIucmVhZChwYXRoLmpvaW4oZGVzdGluYXRpb25Gb2xkZXIsIGtleSkpO1xyXG5cclxuICAgICAgZm9yIChjb25zdCBtb2RFbnRyeSBvZiBmaWxlTWFwW2tleV0pIHtcclxuICAgICAgICBjb25zdCB0ZW1wRmlsZVBhdGggPSBwYXRoLmpvaW4oZGVzdGluYXRpb25Gb2xkZXIsIGtleSkgKyBnZW5lcmF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IG1vZERhdGEgPSBhd2FpdCB0b0luaUZpbGVPYmplY3QobW9kRW50cnkuZGF0YSwgdGVtcEZpbGVQYXRoKTtcclxuXHJcbiAgICAgICAgZm9yIChjb25zdCBtb2RLZXkgb2YgT2JqZWN0LmtleXMobW9kRGF0YS5kYXRhKSkge1xyXG4gICAgICAgICAgaW5pdGlhbERhdGEuZGF0YVttb2RLZXldID0ge1xyXG4gICAgICAgICAgICAuLi5pbml0aWFsRGF0YS5kYXRhW21vZEtleV0sXHJcbiAgICAgICAgICAgIC4uLm1vZERhdGEuZGF0YVttb2RLZXldLFxyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgcGFyc2VyLndyaXRlKHBhdGguam9pbihkZXN0aW5hdGlvbkZvbGRlciwga2V5KSwgaW5pdGlhbERhdGEpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcgJiYgW1xyXG4gICAgICAgIHBhdGguam9pbihkb2NNb2RQYXRoLCBJTlBVVF9TRVRUSU5HU19GSUxFTkFNRSksXHJcbiAgICAgICAgcGF0aC5qb2luKGRvY01vZFBhdGgsIERYXzExX1VTRVJfU0VUVElOR1NfRklMRU5BTUUpLFxyXG4gICAgICAgIHBhdGguam9pbihkb2NNb2RQYXRoLCBEWF8xMl9VU0VSX1NFVFRJTkdTX0ZJTEVOQU1FKSxcclxuICAgICAgXS5pbmNsdWRlcyhlcnIucGF0aCkpIHtcclxuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW5zdGFsbCBtZW51IG1vZCcsIG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdSZXF1aXJlZCBzZXR0aW5nIGZpbGVzIGFyZSBtaXNzaW5nIC0gcGxlYXNlIHJ1biB0aGUgZ2FtZSBhdCBsZWFzdCBvbmNlIGFuZCB0cnkgYWdhaW4uJyksIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW5zdXJlTWVudU1vZChhcGksIHByb2ZpbGUpIHtcclxuICAvLyBpZiAoIWlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xyXG4gIC8vICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIC8vIH1cclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IG1vZE5hbWUgPSBtZW51TW9kKHByb2ZpbGUubmFtZSk7XHJcbiAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcclxuICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGF3YWl0IGNyZWF0ZU1lbnVNb2QoYXBpLCBtb2ROYW1lLCBwcm9maWxlKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgLy8gZ2l2ZSB0aGUgdXNlciBhbiBpbmRpY2F0aW9uIHdoZW4gdGhpcyB3YXMgbGFzdCB1cGRhdGVkXHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsICdpbnN0YWxsVGltZScsIG5ldyBEYXRlKCkpKTtcclxuICAgIC8vIHRoZSByZXN0IGhlcmUgaXMgb25seSByZXF1aXJlZCB0byB1cGRhdGUgbW9kcyBmcm9tIHByZXZpb3VzIHZvcnRleCB2ZXJzaW9uc1xyXG4gICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICduYW1lJywgJ1dpdGNoZXIgMyBNZW51IE1vZCcpKTtcclxuXHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3R5cGUnLCAnd2l0Y2hlcjNtZW51bW9kZG9jdW1lbnRzJykpO1xyXG5cclxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbG9naWNhbEZpbGVOYW1lJywgJ1dpdGNoZXIgMyBNZW51IE1vZCcpKTtcclxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSwgJ21vZElkJywgNDIpKTtcclxuICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShwcm9maWxlLmdhbWVJZCwgbW9kTmFtZSwgJ3ZlcnNpb24nLCAnMS4wLjAnKSk7XHJcbiAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUocHJvZmlsZS5nYW1lSWQsIG1vZE5hbWUsICd2YXJpYW50JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW5pdGl6ZVByb2ZpbGVOYW1lKHByb2ZpbGUubmFtZSkpKTtcclxuICB9XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2ROYW1lKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4cG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBpbmNsdWRlZE1vZHMpIHtcclxuICAvLyBpZiAoIWlzU2V0dGluZ3NNZXJnZVN1cHByZXNzZWQoYXBpKSkge1xyXG4gIC8vICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAvLyB9XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRlcGxveW1lbnQgPSBhd2FpdCBnZXREZXBsb3ltZW50KGFwaSwgaW5jbHVkZWRNb2RzKTtcclxuICAgIGlmIChkZXBsb3ltZW50ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZ2V0IGRlcGxveW1lbnQnKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG1vZE5hbWUgPSBhd2FpdCBvbkRpZERlcGxveShhcGksIGRlcGxveW1lbnQsIHByb2ZpbGUpO1xyXG4gICAgaWYgKG1vZE5hbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBUaGUgaW5zdGFsbGVkIG1vZHMgZG8gbm90IHJlcXVpcmUgYSBtZW51IG1vZC5cclxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoYXBpLmdldFN0YXRlKCksIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcclxuICAgIGNvbnN0IG1vZElkID0gT2JqZWN0LmtleXMobW9kcykuZmluZChpZCA9PiBpZCA9PT0gbW9kTmFtZSk7XHJcbiAgICBpZiAobW9kSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01lbnUgbW9kIGlzIG1pc3NpbmcnKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBtb2RQYXRoID0gcGF0aC5qb2luKGluc3RhbGxQYXRoLCBtb2RzW21vZElkXS5pbnN0YWxsYXRpb25QYXRoKTtcclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBwcmVwYXJlRmlsZURhdGEobW9kUGF0aCk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGltcG9ydE1lbnVNb2QoYXBpLCBwcm9maWxlLCBmaWxlRGF0YSkge1xyXG4gIC8vIGlmICghaXNTZXR0aW5nc01lcmdlU3VwcHJlc3NlZChhcGkpKSB7XHJcbiAgLy8gICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgLy8gfVxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gYXdhaXQgZW5zdXJlTWVudU1vZChhcGksIHByb2ZpbGUpO1xyXG4gICAgY29uc3QgbW9kID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkLCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcclxuICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBkZXN0UGF0aCA9IHBhdGguam9pbihpbnN0YWxsUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgpO1xyXG4gICAgYXdhaXQgcmVzdG9yZUZpbGVEYXRhKGZpbGVEYXRhLCBkZXN0UGF0aCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuIl19