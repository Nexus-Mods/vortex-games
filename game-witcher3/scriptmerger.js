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
exports.setMergerConfig = exports.getMergedModName = exports.downloadScriptMerger = exports.getScriptMergerDir = void 0;
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const url_1 = __importDefault(require("url"));
const xml2js_1 = require("xml2js");
const semver_1 = __importDefault(require("semver"));
const exe_version_1 = __importDefault(require("exe-version"));
const vortex_api_1 = require("vortex-api");
const RELEASE_CUTOFF = '0.6.5';
const GITHUB_URL = 'https://api.github.com/repos/IDCs/WitcherScriptMerger';
const MERGER_RELPATH = 'WitcherScriptMerger';
const MERGER_CONFIG_FILE = 'WitcherScriptMerger.exe.config';
const { getHash, MD5ComparisonError, SCRIPT_MERGER_ID } = require('./common');
function query(baseUrl, request) {
    return new Promise((resolve, reject) => {
        const relUrl = url_1.default.parse(`${baseUrl}/${request}`);
        const options = Object.assign(Object.assign({}, lodash_1.default.pick(relUrl, ['port', 'hostname', 'path'])), { headers: {
                'User-Agent': 'Vortex',
            } });
        https_1.default.get(options, (res) => {
            res.setEncoding('utf-8');
            const headers = res.headers;
            const callsRemaining = parseInt(headers === null || headers === void 0 ? void 0 : headers['x-ratelimit-remaining'], 10);
            if ((res.statusCode === 403) && (callsRemaining === 0)) {
                const resetDate = parseInt(headers === null || headers === void 0 ? void 0 : headers['x-ratelimit-reset'], 10) * 1000;
                (0, vortex_api_1.log)('info', 'GitHub rate limit exceeded', { reset_at: (new Date(resetDate)).toString() });
                return reject(new vortex_api_1.util.ProcessCanceled('GitHub rate limit exceeded'));
            }
            let output = '';
            res
                .on('data', data => output += data)
                .on('end', () => {
                try {
                    return resolve(JSON.parse(output));
                }
                catch (parseErr) {
                    return reject(parseErr);
                }
            });
        })
            .on('error', err => {
            return reject(err);
        })
            .end();
    });
}
function getRequestOptions(link) {
    const relUrl = url_1.default.parse(link);
    return (Object.assign(Object.assign({}, lodash_1.default.pick(relUrl, ['port', 'hostname', 'path'])), { headers: {
            'User-Agent': 'Vortex',
        } }));
}
function downloadConsent(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            api.showDialog('info', 'Witcher 3 Script Merger', {
                bbcode: api.translate('Many Witcher 3 mods add or edit game scripts. When several mods '
                    + 'editing the same script are installed, these mods need to be merged using a tool '
                    + 'called Witcher 3 Script Merger. Vortex can attempt to download and configure the merger '
                    + 'for you automatically - before doing so - please ensure your account has full read/write permissions '
                    + 'to your game\'s directory. The script merger can be installed at a later point if you wish. [br][/br][br][/br]'
                    + '[url=https://wiki.nexusmods.com/index.php/Tool_Setup:_Witcher_3_Script_Merger]find out more about the script merger.[/url][br][/br][br][/br]'
                    + 'Note: While script merging works well with the vast majority of mods, there is no guarantee for a satisfying outcome in every single case.', { ns: 'game-witcher3' }),
            }, [
                { label: 'Cancel', action: () => reject(new vortex_api_1.util.UserCanceled()) },
                { label: 'Download', action: () => resolve() },
            ]);
        });
    });
}
function getMergerVersion(api) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', 'witcher3'], undefined);
        if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
            return Promise.reject(new vortex_api_1.util.SetupError('Witcher3 is not discovered'));
        }
        const merger = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger;
        if (merger === undefined) {
            return Promise.resolve(undefined);
        }
        if (!!(merger === null || merger === void 0 ? void 0 : merger.path)) {
            return vortex_api_1.fs.statAsync(merger.path)
                .then(() => {
                if ((merger === null || merger === void 0 ? void 0 : merger.mergerVersion) !== undefined) {
                    return Promise.resolve(merger.mergerVersion);
                }
                const execVersion = (0, exe_version_1.default)(merger.path);
                if (!!execVersion) {
                    const trimmedVersion = execVersion.split('.').slice(0, 3).join('.');
                    const newToolDetails = Object.assign(Object.assign({}, merger), { mergerVersion: trimmedVersion });
                    api.store.dispatch(vortex_api_1.actions.addDiscoveredTool('witcher3', SCRIPT_MERGER_ID, newToolDetails, true));
                    return Promise.resolve(trimmedVersion);
                }
            })
                .catch(err => Promise.resolve(undefined));
        }
        else {
            return Promise.resolve(undefined);
        }
    });
}
let _HASH_CACHE;
function getCache(api) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_HASH_CACHE === undefined) {
            try {
                const data = yield vortex_api_1.fs.readFileAsync(path_1.default.join(__dirname, 'MD5Cache.json'), { encoding: 'utf8' });
                _HASH_CACHE = JSON.parse(data);
            }
            catch (err) {
                api.showErrorNotification('Failed to parse MD5Cache', err);
                return _HASH_CACHE = [];
            }
        }
        return _HASH_CACHE;
    });
}
function onDownloadComplete(api, archivePath, mostRecentVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let archiveHash;
            try {
                archiveHash = yield getHash(archivePath);
            }
            catch (err) {
                return Promise.reject(new MD5ComparisonError('Failed to calculate hash', archivePath));
            }
            const hashCache = yield getCache(api);
            if (hashCache.find(entry => (entry.archiveChecksum.toLowerCase() === archiveHash)
                && (entry.version === mostRecentVersion)) === undefined) {
                return reject(new MD5ComparisonError('Corrupted archive download', archivePath));
            }
            return resolve(archivePath);
        }))
            .then((archivePath) => extractScriptMerger(api, archivePath))
            .then((mergerPath) => __awaiter(this, void 0, void 0, function* () {
            const mergerExec = path_1.default.join(mergerPath, 'WitcherScriptMerger.exe');
            let execHash;
            try {
                execHash = yield getHash(mergerExec);
            }
            catch (err) {
                return Promise.reject(new MD5ComparisonError('Failed to calculate hash', mergerExec));
            }
            const hashCache = yield getCache(api);
            if (hashCache.find(entry => (entry.execChecksum.toLowerCase() === execHash)
                && (entry.version === mostRecentVersion)) === undefined) {
                return Promise.reject(new MD5ComparisonError('Corrupted executable', mergerExec));
            }
            return Promise.resolve(mergerPath);
        }))
            .then((mergerPath) => setUpMerger(api, mostRecentVersion, mergerPath));
    });
}
function getScriptMergerDir(api, create = false) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', 'witcher3'], undefined);
        if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
            return undefined;
        }
        const currentPath = (_b = (_a = discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger) === null || _b === void 0 ? void 0 : _b.path;
        try {
            if (!currentPath) {
                throw new Error('Script Merger not set up');
            }
            yield vortex_api_1.fs.statAsync(currentPath);
            return currentPath;
        }
        catch (err) {
            const defaultPath = path_1.default.join(discovery.path, MERGER_RELPATH);
            if (create) {
                yield vortex_api_1.fs.ensureDirWritableAsync(defaultPath);
            }
            return defaultPath;
        }
    });
}
exports.getScriptMergerDir = getScriptMergerDir;
function downloadScriptMerger(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', 'witcher3'], undefined);
        if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
            return Promise.reject(new vortex_api_1.util.SetupError('Witcher3 is not discovered'));
        }
        let mostRecentVersion;
        const currentlyInstalledVersion = yield getMergerVersion(api);
        const downloadNotifId = 'download-script-merger-notif';
        return query(GITHUB_URL, 'releases')
            .then((releases) => {
            if (!Array.isArray(releases)) {
                return Promise.reject(new vortex_api_1.util.DataInvalid('expected array of github releases'));
            }
            const current = releases
                .filter(rel => semver_1.default.valid(rel.name) && semver_1.default.gte(rel.name, RELEASE_CUTOFF))
                .sort((lhs, rhs) => semver_1.default.compare(rhs.name, lhs.name));
            return Promise.resolve(current);
        })
            .then((currentRelease) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            mostRecentVersion = currentRelease[0].name;
            const fileName = currentRelease[0].assets[0].name;
            const downloadLink = currentRelease[0].assets[0].browser_download_url;
            if (!!currentlyInstalledVersion && semver_1.default.gte(currentlyInstalledVersion, currentRelease[0].name)) {
                return Promise.reject(new vortex_api_1.util.ProcessCanceled('Already up to date'));
            }
            const downloadNotif = {
                id: downloadNotifId,
                type: 'activity',
                title: 'Adding Script Merger',
                message: 'This may take a minute...',
            };
            const download = () => __awaiter(this, void 0, void 0, function* () {
                api.sendNotification(Object.assign(Object.assign({}, downloadNotif), { progress: 0 }));
                let redirectionURL;
                redirectionURL = yield new Promise((resolve, reject) => {
                    const options = getRequestOptions(downloadLink);
                    https_1.default.request(options, res => {
                        return (res.headers['location'] !== undefined)
                            ? resolve(res.headers['location'])
                            : reject(new vortex_api_1.util.ProcessCanceled('Failed to resolve download location'));
                    })
                        .on('error', err => reject(err))
                        .end();
                });
                return new Promise((resolve, reject) => {
                    const options = getRequestOptions(redirectionURL);
                    https_1.default.request(options, res => {
                        res.setEncoding('binary');
                        const headers = res.headers;
                        const contentLength = parseInt(headers === null || headers === void 0 ? void 0 : headers['content-length'], 10);
                        const callsRemaining = parseInt(headers === null || headers === void 0 ? void 0 : headers['x-ratelimit-remaining'], 10);
                        if ((res.statusCode === 403) && (callsRemaining === 0)) {
                            const resetDate = parseInt(headers === null || headers === void 0 ? void 0 : headers['x-ratelimit-reset'], 10) * 1000;
                            (0, vortex_api_1.log)('info', 'GitHub rate limit exceeded', { reset_at: (new Date(resetDate)).toString() });
                            return reject(new vortex_api_1.util.ProcessCanceled('GitHub rate limit exceeded'));
                        }
                        let output = '';
                        res
                            .on('data', data => {
                            output += data;
                            if (output.length % 500 === 0) {
                                api.sendNotification(Object.assign(Object.assign({}, downloadNotif), { progress: (output.length / contentLength) * 100 }));
                            }
                        })
                            .on('end', () => {
                            api.sendNotification(Object.assign(Object.assign({}, downloadNotif), { progress: 100 }));
                            api.dismissNotification(downloadNotifId);
                            return vortex_api_1.fs.writeFileAsync(path_1.default.join(discovery.path, fileName), output, { encoding: 'binary' })
                                .then(() => resolve(path_1.default.join(discovery.path, fileName)))
                                .catch(err => reject(err));
                        });
                    })
                        .on('error', err => reject(err))
                        .end();
                });
            });
            if (!!currentlyInstalledVersion || ((currentlyInstalledVersion === undefined) && !!((_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger))) {
                api.sendNotification({
                    id: 'merger-update',
                    type: 'warning',
                    noDismiss: true,
                    message: api.translate('Important Script Merger update available', { ns: 'game-witcher3' }),
                    actions: [{ title: 'Download', action: dismiss => {
                                dismiss();
                                return download()
                                    .then((archivePath) => onDownloadComplete(api, archivePath, mostRecentVersion))
                                    .catch(err => {
                                    api.dismissNotification(extractNotifId);
                                    api.dismissNotification(downloadNotifId);
                                    if (err instanceof MD5ComparisonError || err instanceof vortex_api_1.util.ProcessCanceled) {
                                        (0, vortex_api_1.log)('error', 'Failed to automatically install Script Merger', err.errorMessage);
                                        api.sendNotification({
                                            type: 'error',
                                            message: api.translate('Please install Script Merger manually', { ns: 'game-witcher3' }),
                                            actions: [
                                                {
                                                    title: 'Install Manually',
                                                    action: () => vortex_api_1.util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                                        .catch(err => null)
                                                }
                                            ],
                                        });
                                        return Promise.resolve();
                                    }
                                    api.sendNotification({
                                        type: 'info',
                                        message: api.translate('Update failed due temporary network issue - try again later', { ns: 'game-witcher3' }),
                                    });
                                    return Promise.resolve();
                                });
                            } }],
                });
                return Promise.reject(new vortex_api_1.util.ProcessCanceled('Update'));
            }
            return downloadConsent(api)
                .then(() => download());
        }))
            .then((archivePath) => onDownloadComplete(api, archivePath, mostRecentVersion))
            .catch((err) => __awaiter(this, void 0, void 0, function* () {
            const raiseManualInstallNotif = () => {
                (0, vortex_api_1.log)('error', 'Failed to automatically install Script Merger', err.errorMessage);
                api.sendNotification({
                    type: 'error',
                    message: api.translate('Please install Script Merger manually', { ns: 'game-witcher3' }),
                    actions: [
                        {
                            title: 'Install Manually',
                            action: () => vortex_api_1.util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                .catch(err => null)
                        }
                    ],
                });
            };
            api.dismissNotification(extractNotifId);
            api.dismissNotification(downloadNotifId);
            if (err instanceof MD5ComparisonError) {
                raiseManualInstallNotif();
                return Promise.resolve();
            }
            if (err instanceof vortex_api_1.util.UserCanceled) {
                return Promise.resolve();
            }
            else if (err instanceof vortex_api_1.util.ProcessCanceled) {
                if ((err.message.startsWith('Already')) || (err.message.startsWith('Update'))) {
                    return Promise.resolve();
                }
                else if (err.message.startsWith('Failed to resolve download location')) {
                    (0, vortex_api_1.log)('info', 'failed to resolve W3 script merger re-direction link', err);
                    return Promise.resolve();
                }
                else if (err.message.startsWith('Game is not discovered')) {
                    raiseManualInstallNotif();
                    return Promise.resolve();
                }
            }
            else {
                return Promise.reject(err);
            }
        }));
    });
}
exports.downloadScriptMerger = downloadScriptMerger;
const extractNotifId = 'extracting-script-merger';
const extractNotif = {
    id: extractNotifId,
    type: 'activity',
    title: 'Extracting Script Merger',
};
function extractScriptMerger(api, archivePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const destination = yield getScriptMergerDir(api, true);
        if (destination === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('Game is not discovered'));
        }
        const sZip = new vortex_api_1.util.SevenZip();
        api.sendNotification(extractNotif);
        yield sZip.extractFull(archivePath, destination);
        api.sendNotification({
            type: 'info',
            message: api.translate('W3 Script Merger extracted successfully', { ns: 'game-witcher3' }),
        });
        api.dismissNotification(extractNotifId);
        return Promise.resolve(destination);
    });
}
function setUpMerger(api, mergerVersion, newPath) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', 'witcher3'], undefined);
        const currentDetails = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger;
        const newToolDetails = (!!currentDetails)
            ? Object.assign(Object.assign({}, currentDetails), { mergerVersion }) : {
            id: SCRIPT_MERGER_ID,
            name: 'W3 Script Merger',
            logo: 'WitcherScriptMerger.jpg',
            executable: () => 'WitcherScriptMerger.exe',
            requiredFiles: [
                'WitcherScriptMerger.exe',
            ],
            mergerVersion,
        };
        newToolDetails.path = path_1.default.join(newPath, 'WitcherScriptMerger.exe');
        newToolDetails.workingDirectory = newPath;
        yield setMergerConfig(discovery.path, newPath);
        api.store.dispatch(vortex_api_1.actions.addDiscoveredTool('witcher3', SCRIPT_MERGER_ID, newToolDetails, true));
        return Promise.resolve();
    });
}
function getMergedModName(scriptMergerPath) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        const configFilePath = path_1.default.join(scriptMergerPath, MERGER_CONFIG_FILE);
        try {
            const data = yield vortex_api_1.fs.readFileAsync(configFilePath, { encoding: 'utf8' });
            const config = yield (0, xml2js_1.parseStringPromise)(data);
            const configItems = (_c = (_b = (_a = config === null || config === void 0 ? void 0 : config.configuration) === null || _a === void 0 ? void 0 : _a.appSettings) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.add;
            const MergedModName = (_d = configItems === null || configItems === void 0 ? void 0 : configItems.find(item => { var _a; return ((_a = item.$) === null || _a === void 0 ? void 0 : _a.key) === 'MergedModName'; })) !== null && _d !== void 0 ? _d : undefined;
            if (!!((_e = MergedModName === null || MergedModName === void 0 ? void 0 : MergedModName.$) === null || _e === void 0 ? void 0 : _e.value)) {
                return MergedModName.$.value;
            }
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'failed to ascertain merged mod name - using "mod0000_MergedFiles"', err);
            return 'mod0000_MergedFiles';
        }
    });
}
exports.getMergedModName = getMergedModName;
function setMergerConfig(gameRootPath, scriptMergerPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const findIndex = (nodes, id) => {
            var _a;
            return (_a = nodes === null || nodes === void 0 ? void 0 : nodes.findIndex(iter => { var _a; return ((_a = iter.$) === null || _a === void 0 ? void 0 : _a.key) === id; })) !== null && _a !== void 0 ? _a : undefined;
        };
        const configFilePath = path_1.default.join(scriptMergerPath, MERGER_CONFIG_FILE);
        try {
            const data = yield vortex_api_1.fs.readFileAsync(configFilePath, { encoding: 'utf8' });
            const config = yield (0, xml2js_1.parseStringPromise)(data);
            const replaceElement = (id, replacement) => {
                var _a, _b, _c;
                const idx = findIndex((_c = (_b = (_a = config === null || config === void 0 ? void 0 : config.configuration) === null || _a === void 0 ? void 0 : _a.appSettings) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.add, id);
                if (idx !== undefined) {
                    config.configuration.appSettings[0].add[idx].$ = { key: id, value: replacement };
                }
            };
            replaceElement('GameDirectory', gameRootPath);
            replaceElement('VanillaScriptsDirectory', path_1.default.join(gameRootPath, 'content', 'content0', 'scripts'));
            replaceElement('ModsDirectory', path_1.default.join(gameRootPath, 'mods'));
            const builder = new xml2js_1.Builder();
            const xml = builder.buildObject(config);
            yield vortex_api_1.fs.writeFileAsync(configFilePath, xml);
        }
        catch (err) {
            return;
        }
    });
}
exports.setMergerConfig = setMergerConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0bWVyZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NyaXB0bWVyZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGtEQUEwQjtBQUMxQixnREFBd0I7QUFDeEIsb0RBQXVCO0FBQ3ZCLDhDQUFzQjtBQUN0QixtQ0FBcUQ7QUFDckQsb0RBQTRCO0FBQzVCLDhEQUFxQztBQUNyQywyQ0FBMkQ7QUFJM0QsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDO0FBQy9CLE1BQU0sVUFBVSxHQUFHLHVEQUF1RCxDQUFDO0FBQzNFLE1BQU0sY0FBYyxHQUFHLHFCQUFxQixDQUFDO0FBRTdDLE1BQU0sa0JBQWtCLEdBQUcsZ0NBQWdDLENBQUM7QUFFNUQsTUFBTSxFQUFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUc5RSxTQUFTLEtBQUssQ0FBQyxPQUFPLEVBQUUsT0FBTztJQUM3QixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLE1BQU0sTUFBTSxHQUFHLGFBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNsRCxNQUFNLE9BQU8sbUNBQ1IsZ0JBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQyxLQUMvQyxPQUFPLEVBQUU7Z0JBQ1AsWUFBWSxFQUFFLFFBQVE7YUFDdkIsR0FDRixDQUFDO1FBRUYsZUFBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUN6QixHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFxQyxDQUFDO1lBQzFELE1BQU0s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TUFBTSxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLE9BQU8sR0FBRyxJQUFJLGdCQUFPLEVBQUUsQ0FBQztZQUM5QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDOUM7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUdaLE9BQU87U0FDUjtJQUNILENBQUM7Q0FBQTtBQTNCRCwwQ0EyQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgaHR0cHMgZnJvbSAnaHR0cHMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHVybCBmcm9tICd1cmwnO1xyXG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xyXG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCBnZXRWZXJzaW9uIGZyb20gJ2V4ZS12ZXJzaW9uJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHR5cGVzLCBsb2csIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IElJbmNvbWluZ0dpdGh1Ykh0dHBIZWFkZXJzIH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5jb25zdCBSRUxFQVNFX0NVVE9GRiA9ICcwLjYuNSc7XHJcbmNvbnN0IEdJVEhVQl9VUkwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9JRENzL1dpdGNoZXJTY3JpcHRNZXJnZXInO1xyXG5jb25zdCBNRVJHRVJfUkVMUEFUSCA9ICdXaXRjaGVyU2NyaXB0TWVyZ2VyJztcclxuXHJcbmNvbnN0IE1FUkdFUl9DT05GSUdfRklMRSA9ICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZS5jb25maWcnO1xyXG5cclxuY29uc3QgeyBnZXRIYXNoLCBNRDVDb21wYXJpc29uRXJyb3IsIFNDUklQVF9NRVJHRVJfSUQgfSA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gcXVlcnkoYmFzZVVybCwgcmVxdWVzdCkge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBjb25zdCByZWxVcmwgPSB1cmwucGFyc2UoYCR7YmFzZVVybH0vJHtyZXF1ZXN0fWApO1xyXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcclxuICAgICAgLi4uXy5waWNrKHJlbFVybCwgWydwb3J0JywgJ2hvc3RuYW1lJywgJ3BhdGgnXSksXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnVXNlci1BZ2VudCc6ICdWb3J0ZXgnLFxyXG4gICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICBodHRwcy5nZXQob3B0aW9ucywgKHJlcykgPT4ge1xyXG4gICAgICByZXMuc2V0RW5jb2RpbmcoJ3V0Zi04Jyk7XHJcbiAgICAgIGNvbnN0IGhlYWRlcnMgPSByZXMuaGVhZGVycyBhcyBJSW5jb21pbmdHaXRodWJIdHRwSGVhZGVycztcclxuICAgICAgY29uc3QgY2FsbHNSZW1haW5pbmcgPSBwYXJzZUludChoZWFkZXJzPy5bJ3gtcmF0ZWxpbWl0LXJlbWFpbmluZyddLCAxMCk7XHJcbiAgICAgIGlmICgocmVzLnN0YXR1c0NvZGUgPT09IDQwMykgJiYgKGNhbGxzUmVtYWluaW5nID09PSAwKSkge1xyXG4gICAgICAgIGNvbnN0IHJlc2V0RGF0ZSA9IHBhcnNlSW50KGhlYWRlcnM/LlsneC1yYXRlbGltaXQtcmVzZXQnXSwgMTApICogMTAwMDtcclxuICAgICAgICBsb2coJ2luZm8nLCAnR2l0SHViIHJhdGUgbGltaXQgZXhjZWVkZWQnLFxyXG4gICAgICAgICAgeyByZXNldF9hdDogKG5ldyBEYXRlKHJlc2V0RGF0ZSkpLnRvU3RyaW5nKCkgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBsZXQgb3V0cHV0ID0gJyc7XHJcbiAgICAgIHJlc1xyXG4gICAgICAgIC5vbignZGF0YScsIGRhdGEgPT4gb3V0cHV0ICs9IGRhdGEpXHJcbiAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShKU09OLnBhcnNlKG91dHB1dCkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAocGFyc2VFcnIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChwYXJzZUVycik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgICAub24oJ2Vycm9yJywgZXJyID0+IHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5lbmQoKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0UmVxdWVzdE9wdGlvbnMobGluaykge1xyXG4gIGNvbnN0IHJlbFVybCA9IHVybC5wYXJzZShsaW5rKTtcclxuICByZXR1cm4gKHtcclxuICAgIC4uLl8ucGljayhyZWxVcmwsIFsncG9ydCcsICdob3N0bmFtZScsICdwYXRoJ10pLFxyXG4gICAgaGVhZGVyczoge1xyXG4gICAgICAnVXNlci1BZ2VudCc6ICdWb3J0ZXgnLFxyXG4gICAgfSxcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRDb25zZW50KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIFxyXG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdXaXRjaGVyIDMgU2NyaXB0IE1lcmdlcicsIHtcclxuICAgICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdNYW55IFdpdGNoZXIgMyBtb2RzIGFkZCBvciBlZGl0IGdhbWUgc2NyaXB0cy4gV2hlbiBzZXZlcmFsIG1vZHMgJyBcclxuICAgICAgICArICdlZGl0aW5nIHRoZSBzYW1lIHNjcmlwdCBhcmUgaW5zdGFsbGVkLCB0aGVzZSBtb2RzIG5lZWQgdG8gYmUgbWVyZ2VkIHVzaW5nIGEgdG9vbCAnIFxyXG4gICAgICAgICsgJ2NhbGxlZCBXaXRjaGVyIDMgU2NyaXB0IE1lcmdlci4gVm9ydGV4IGNhbiBhdHRlbXB0IHRvIGRvd25sb2FkIGFuZCBjb25maWd1cmUgdGhlIG1lcmdlciAnXHJcbiAgICAgICAgKyAnZm9yIHlvdSBhdXRvbWF0aWNhbGx5IC0gYmVmb3JlIGRvaW5nIHNvIC0gcGxlYXNlIGVuc3VyZSB5b3VyIGFjY291bnQgaGFzIGZ1bGwgcmVhZC93cml0ZSBwZXJtaXNzaW9ucyAnXHJcbiAgICAgICAgKyAndG8geW91ciBnYW1lXFwncyBkaXJlY3RvcnkuIFRoZSBzY3JpcHQgbWVyZ2VyIGNhbiBiZSBpbnN0YWxsZWQgYXQgYSBsYXRlciBwb2ludCBpZiB5b3Ugd2lzaC4gW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICAgICsgJ1t1cmw9aHR0cHM6Ly93aWtpLm5leHVzbW9kcy5jb20vaW5kZXgucGhwL1Rvb2xfU2V0dXA6X1dpdGNoZXJfM19TY3JpcHRfTWVyZ2VyXWZpbmQgb3V0IG1vcmUgYWJvdXQgdGhlIHNjcmlwdCBtZXJnZXIuWy91cmxdW2JyXVsvYnJdW2JyXVsvYnJdJyBcclxuICAgICAgICArICdOb3RlOiBXaGlsZSBzY3JpcHQgbWVyZ2luZyB3b3JrcyB3ZWxsIHdpdGggdGhlIHZhc3QgbWFqb3JpdHkgb2YgbW9kcywgdGhlcmUgaXMgbm8gZ3VhcmFudGVlIGZvciBhIHNhdGlzZnlpbmcgb3V0Y29tZSBpbiBldmVyeSBzaW5nbGUgY2FzZS4nLCB7IG5zOiAnZ2FtZS13aXRjaGVyMycgfSksXHJcbiAgICB9LCBbXHJcbiAgICAgIHsgbGFiZWw6ICdDYW5jZWwnLCBhY3Rpb246ICgpID0+IHJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSkgfSxcclxuICAgICAgeyBsYWJlbDogJ0Rvd25sb2FkJywgYWN0aW9uOiAoKSA9PiByZXNvbHZlKCkgfSxcclxuICAgIF0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRNZXJnZXJWZXJzaW9uKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCAnd2l0Y2hlcjMnXSwgdW5kZWZpbmVkKTtcclxuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5TZXR1cEVycm9yKCdXaXRjaGVyMyBpcyBub3QgZGlzY292ZXJlZCcpKTtcclxuICB9XHJcbiAgY29uc3QgbWVyZ2VyID0gZGlzY292ZXJ5Py50b29scz8uVzNTY3JpcHRNZXJnZXI7XHJcbiAgaWYgKG1lcmdlciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG5cclxuICBpZiAoISFtZXJnZXI/LnBhdGgpIHtcclxuICAgIHJldHVybiBmcy5zdGF0QXN5bmMobWVyZ2VyLnBhdGgpXHJcbiAgICAgIC50aGVuKCgpID0+IHtcclxuICAgICAgICBpZiAobWVyZ2VyPy5tZXJnZXJWZXJzaW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobWVyZ2VyLm1lcmdlclZlcnNpb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBleGVjVmVyc2lvbiA9IGdldFZlcnNpb24obWVyZ2VyLnBhdGgpO1xyXG4gICAgICAgIGlmICghIWV4ZWNWZXJzaW9uKSB7XHJcbiAgICAgICAgICBjb25zdCB0cmltbWVkVmVyc2lvbiA9IGV4ZWNWZXJzaW9uLnNwbGl0KCcuJykuc2xpY2UoMCwgMykuam9pbignLicpO1xyXG4gICAgICAgICAgY29uc3QgbmV3VG9vbERldGFpbHMgPSB7IC4uLm1lcmdlciwgbWVyZ2VyVmVyc2lvbjogdHJpbW1lZFZlcnNpb24gfTtcclxuICAgICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLmFkZERpc2NvdmVyZWRUb29sKCd3aXRjaGVyMycsIFNDUklQVF9NRVJHRVJfSUQsIG5ld1Rvb2xEZXRhaWxzLCB0cnVlKSk7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRyaW1tZWRWZXJzaW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcbiAgICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgfVxyXG59XHJcblxyXG5sZXQgX0hBU0hfQ0FDSEU7XHJcbmFzeW5jIGZ1bmN0aW9uIGdldENhY2hlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gIGlmIChfSEFTSF9DQUNIRSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnTUQ1Q2FjaGUuanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICAgIF9IQVNIX0NBQ0hFID0gSlNPTi5wYXJzZShkYXRhKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAvLyBJZiB0aGlzIGV2ZXIgaGFwcGVucyAtIHRoZSB1c2VyJ3MgbWFjaGluZSBtdXN0IGJlIHNjcmV3ZWQuXHJcbiAgICAgIC8vICBNYXliZSB2aXJ1cyA/IGRlZmVjdGl2ZSBoYXJkd2FyZSA/IGRpZCBoZSBtYW51YWxseSBtYW5pcHVsYXRlXHJcbiAgICAgIC8vICB0aGUgZmlsZSA/XHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBwYXJzZSBNRDVDYWNoZScsIGVycik7XHJcbiAgICAgIHJldHVybiBfSEFTSF9DQUNIRSA9IFtdO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIF9IQVNIX0NBQ0hFO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBvbkRvd25sb2FkQ29tcGxldGUoYXBpLCBhcmNoaXZlUGF0aCwgbW9zdFJlY2VudFZlcnNpb24pIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgbGV0IGFyY2hpdmVIYXNoO1xyXG4gICAgdHJ5IHtcclxuICAgICAgYXJjaGl2ZUhhc2ggPSBhd2FpdCBnZXRIYXNoKGFyY2hpdmVQYXRoKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IE1ENUNvbXBhcmlzb25FcnJvcignRmFpbGVkIHRvIGNhbGN1bGF0ZSBoYXNoJywgYXJjaGl2ZVBhdGgpKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGhhc2hDYWNoZSA9IGF3YWl0IGdldENhY2hlKGFwaSk7XHJcbiAgICBpZiAoaGFzaENhY2hlLmZpbmQoZW50cnkgPT4gKGVudHJ5LmFyY2hpdmVDaGVja3N1bS50b0xvd2VyQ2FzZSgpID09PSBhcmNoaXZlSGFzaClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoZW50cnkudmVyc2lvbiA9PT0gbW9zdFJlY2VudFZlcnNpb24pKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIE5vdCBhIHZhbGlkIGhhc2ggLSBzb21ldGhpbmcgbWF5IGhhdmUgaGFwcGVuZWQgZHVyaW5nIHRoZSBkb3dubG9hZCA/XHJcbiAgICAgIHJldHVybiByZWplY3QobmV3IE1ENUNvbXBhcmlzb25FcnJvcignQ29ycnVwdGVkIGFyY2hpdmUgZG93bmxvYWQnLCBhcmNoaXZlUGF0aCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXNvbHZlKGFyY2hpdmVQYXRoKTtcclxuICB9KVxyXG4gIC50aGVuKChhcmNoaXZlUGF0aCkgPT4gZXh0cmFjdFNjcmlwdE1lcmdlcihhcGksIGFyY2hpdmVQYXRoKSlcclxuICAudGhlbihhc3luYyAobWVyZ2VyUGF0aCkgPT4ge1xyXG4gICAgY29uc3QgbWVyZ2VyRXhlYyA9IHBhdGguam9pbihtZXJnZXJQYXRoLCAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnKTtcclxuICAgIGxldCBleGVjSGFzaDtcclxuICAgIHRyeSB7XHJcbiAgICAgIGV4ZWNIYXNoID0gYXdhaXQgZ2V0SGFzaChtZXJnZXJFeGVjKTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IE1ENUNvbXBhcmlzb25FcnJvcignRmFpbGVkIHRvIGNhbGN1bGF0ZSBoYXNoJywgbWVyZ2VyRXhlYykpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgaGFzaENhY2hlID0gYXdhaXQgZ2V0Q2FjaGUoYXBpKTtcclxuICAgIGlmIChoYXNoQ2FjaGUuZmluZChlbnRyeSA9PiAoZW50cnkuZXhlY0NoZWNrc3VtLnRvTG93ZXJDYXNlKCkgPT09IGV4ZWNIYXNoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIChlbnRyeS52ZXJzaW9uID09PSBtb3N0UmVjZW50VmVyc2lvbikpID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgLy8gTm90IGEgdmFsaWQgaGFzaCAtIHNvbWV0aGluZyBtYXkgaGF2ZSBoYXBwZW5lZCBkdXJpbmcgZXh0cmFjdGlvbiA/XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgTUQ1Q29tcGFyaXNvbkVycm9yKCdDb3JydXB0ZWQgZXhlY3V0YWJsZScsIG1lcmdlckV4ZWMpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1lcmdlclBhdGgpO1xyXG4gIH0pXHJcbiAgLnRoZW4oKG1lcmdlclBhdGgpID0+IHNldFVwTWVyZ2VyKGFwaSwgbW9zdFJlY2VudFZlcnNpb24sIG1lcmdlclBhdGgpKVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U2NyaXB0TWVyZ2VyRGlyKGFwaSwgY3JlYXRlID0gZmFsc2UpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgJ3dpdGNoZXIzJ10sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuICBjb25zdCBjdXJyZW50UGF0aCA9IGRpc2NvdmVyeS50b29scz8uVzNTY3JpcHRNZXJnZXI/LnBhdGg7XHJcbiAgdHJ5IHtcclxuICAgIGlmICghY3VycmVudFBhdGgpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTY3JpcHQgTWVyZ2VyIG5vdCBzZXQgdXAnKTtcclxuICAgIH1cclxuICAgIGF3YWl0IGZzLnN0YXRBc3luYyhjdXJyZW50UGF0aCk7XHJcbiAgICByZXR1cm4gY3VycmVudFBhdGg7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjb25zdCBkZWZhdWx0UGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTUVSR0VSX1JFTFBBVEgpO1xyXG4gICAgaWYgKGNyZWF0ZSkge1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKGRlZmF1bHRQYXRoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBkZWZhdWx0UGF0aDtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZFNjcmlwdE1lcmdlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgJ3dpdGNoZXIzJ10sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuU2V0dXBFcnJvcignV2l0Y2hlcjMgaXMgbm90IGRpc2NvdmVyZWQnKSk7XHJcbiAgfVxyXG4gIGxldCBtb3N0UmVjZW50VmVyc2lvbjtcclxuICBjb25zdCBjdXJyZW50bHlJbnN0YWxsZWRWZXJzaW9uID0gYXdhaXQgZ2V0TWVyZ2VyVmVyc2lvbihhcGkpO1xyXG4gIGNvbnN0IGRvd25sb2FkTm90aWZJZCA9ICdkb3dubG9hZC1zY3JpcHQtbWVyZ2VyLW5vdGlmJztcclxuICByZXR1cm4gcXVlcnkoR0lUSFVCX1VSTCwgJ3JlbGVhc2VzJylcclxuICAgIC50aGVuKChyZWxlYXNlcykgPT4ge1xyXG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkocmVsZWFzZXMpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdleHBlY3RlZCBhcnJheSBvZiBnaXRodWIgcmVsZWFzZXMnKSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgY3VycmVudCA9IHJlbGVhc2VzXHJcbiAgICAgICAgLmZpbHRlcihyZWwgPT4gc2VtdmVyLnZhbGlkKHJlbC5uYW1lKSAmJiBzZW12ZXIuZ3RlKHJlbC5uYW1lLCBSRUxFQVNFX0NVVE9GRikpXHJcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXIuY29tcGFyZShyaHMubmFtZSwgbGhzLm5hbWUpKTtcclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudCk7XHJcbiAgICB9KVxyXG4gICAgLnRoZW4oYXN5bmMgY3VycmVudFJlbGVhc2UgPT4ge1xyXG4gICAgICBtb3N0UmVjZW50VmVyc2lvbiA9IGN1cnJlbnRSZWxlYXNlWzBdLm5hbWU7XHJcbiAgICAgIGNvbnN0IGZpbGVOYW1lID0gY3VycmVudFJlbGVhc2VbMF0uYXNzZXRzWzBdLm5hbWU7XHJcbiAgICAgIGNvbnN0IGRvd25sb2FkTGluayA9IGN1cnJlbnRSZWxlYXNlWzBdLmFzc2V0c1swXS5icm93c2VyX2Rvd25sb2FkX3VybDtcclxuICAgICAgaWYgKCEhY3VycmVudGx5SW5zdGFsbGVkVmVyc2lvbiAmJiBzZW12ZXIuZ3RlKGN1cnJlbnRseUluc3RhbGxlZFZlcnNpb24sIGN1cnJlbnRSZWxlYXNlWzBdLm5hbWUpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQWxyZWFkeSB1cCB0byBkYXRlJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBkb3dubG9hZE5vdGlmOiB0eXBlcy5JTm90aWZpY2F0aW9uID0ge1xyXG4gICAgICAgIGlkOiBkb3dubG9hZE5vdGlmSWQsXHJcbiAgICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcclxuICAgICAgICB0aXRsZTogJ0FkZGluZyBTY3JpcHQgTWVyZ2VyJyxcclxuICAgICAgICBtZXNzYWdlOiAnVGhpcyBtYXkgdGFrZSBhIG1pbnV0ZS4uLicsXHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgZG93bmxvYWQgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgICAgLi4uZG93bmxvYWROb3RpZixcclxuICAgICAgICAgIHByb2dyZXNzOiAwLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGxldCByZWRpcmVjdGlvblVSTDtcclxuICAgICAgICByZWRpcmVjdGlvblVSTCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBnZXRSZXF1ZXN0T3B0aW9ucyhkb3dubG9hZExpbmspO1xyXG4gICAgICAgICAgaHR0cHMucmVxdWVzdChvcHRpb25zLCByZXMgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gKHJlcy5oZWFkZXJzWydsb2NhdGlvbiddICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgICAgPyByZXNvbHZlKHJlcy5oZWFkZXJzWydsb2NhdGlvbiddKVxyXG4gICAgICAgICAgICAgIDogcmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnRmFpbGVkIHRvIHJlc29sdmUgZG93bmxvYWQgbG9jYXRpb24nKSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oJ2Vycm9yJywgZXJyID0+IHJlamVjdChlcnIpKVxyXG4gICAgICAgICAgICAuZW5kKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBnZXRSZXF1ZXN0T3B0aW9ucyhyZWRpcmVjdGlvblVSTCk7XHJcbiAgICAgICAgICBodHRwcy5yZXF1ZXN0KG9wdGlvbnMsIHJlcyA9PiB7XHJcbiAgICAgICAgICAgIHJlcy5zZXRFbmNvZGluZygnYmluYXJ5Jyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGhlYWRlcnMgPSByZXMuaGVhZGVycyBhcyBJSW5jb21pbmdHaXRodWJIdHRwSGVhZGVycztcclxuICAgICAgICAgICAgY29uc3QgY29udGVudExlbmd0aCA9IHBhcnNlSW50KGhlYWRlcnM/LlsnY29udGVudC1sZW5ndGgnXSwgMTApO1xyXG4gICAgICAgICAgICBjb25zdCBjYWxsc1JlbWFpbmluZyA9IHBhcnNlSW50KGhlYWRlcnM/LlsneC1yYXRlbGltaXQtcmVtYWluaW5nJ10sIDEwKTtcclxuICAgICAgICAgICAgaWYgKChyZXMuc3RhdHVzQ29kZSA9PT0gNDAzKSAmJiAoY2FsbHNSZW1haW5pbmcgPT09IDApKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgcmVzZXREYXRlID0gcGFyc2VJbnQoaGVhZGVycz8uWyd4LXJhdGVsaW1pdC1yZXNldCddLCAxMCkgKiAxMDAwO1xyXG4gICAgICAgICAgICAgIGxvZygnaW5mbycsICdHaXRIdWIgcmF0ZSBsaW1pdCBleGNlZWRlZCcsXHJcbiAgICAgICAgICAgICAgICB7IHJlc2V0X2F0OiAobmV3IERhdGUocmVzZXREYXRlKSkudG9TdHJpbmcoKSB9KTtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2l0SHViIHJhdGUgbGltaXQgZXhjZWVkZWQnKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBvdXRwdXQgPSAnJztcclxuICAgICAgICAgICAgcmVzXHJcbiAgICAgICAgICAgICAgLm9uKCdkYXRhJywgZGF0YSA9PiB7XHJcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gZGF0YVxyXG4gICAgICAgICAgICAgICAgaWYgKG91dHB1dC5sZW5ndGggJSA1MDAgPT09IDApIHtcclxuICAgICAgICAgICAgICAgICAgLy8gVXBkYXRpbmcgdGhlIG5vdGlmaWNhdGlvbiBpcyBFWFRSRU1FTFkgZXhwZW5zaXZlLlxyXG4gICAgICAgICAgICAgICAgICAvLyAgdGhlIGxlbmd0aCAlIDUwMCA9PT0gMCBsaW5lIGVuc3VyZXMgdGhpcyBpcyBub3QgZG9uZSB0b29cclxuICAgICAgICAgICAgICAgICAgLy8gIG9mdGVuLlxyXG4gICAgICAgICAgICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgICAgICAgICAgICAgLi4uZG93bmxvYWROb3RpZixcclxuICAgICAgICAgICAgICAgICAgICBwcm9ncmVzczogKG91dHB1dC5sZW5ndGggLyBjb250ZW50TGVuZ3RoKSAqIDEwMCxcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAub24oJ2VuZCcsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICAgICAgICAgICAgLi4uZG93bmxvYWROb3RpZixcclxuICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IDEwMCxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oZG93bmxvYWROb3RpZklkKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIGZpbGVOYW1lKSwgb3V0cHV0LCB7IGVuY29kaW5nOiAnYmluYXJ5JyB9KVxyXG4gICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiByZXNvbHZlKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZmlsZU5hbWUpKSlcclxuICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiByZWplY3QoZXJyKSk7XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAub24oJ2Vycm9yJywgZXJyID0+IHJlamVjdChlcnIpKVxyXG4gICAgICAgICAgICAuZW5kKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICghIWN1cnJlbnRseUluc3RhbGxlZFZlcnNpb24gfHwgKChjdXJyZW50bHlJbnN0YWxsZWRWZXJzaW9uID09PSB1bmRlZmluZWQpICYmICEhZGlzY292ZXJ5Py50b29scz8uVzNTY3JpcHRNZXJnZXIpKSB7XHJcbiAgICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgICAgaWQ6ICdtZXJnZXItdXBkYXRlJyxcclxuICAgICAgICAgIHR5cGU6ICd3YXJuaW5nJyxcclxuICAgICAgICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgICAgICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ0ltcG9ydGFudCBTY3JpcHQgTWVyZ2VyIHVwZGF0ZSBhdmFpbGFibGUnLFxyXG4gICAgICAgICAgICB7IG5zOiAnZ2FtZS13aXRjaGVyMycgfSksXHJcbiAgICAgICAgICBhY3Rpb25zOiBbIHsgdGl0bGU6ICdEb3dubG9hZCcsIGFjdGlvbjogZGlzbWlzcyA9PiB7XHJcbiAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRvd25sb2FkKClcclxuICAgICAgICAgICAgICAudGhlbigoYXJjaGl2ZVBhdGgpID0+IG9uRG93bmxvYWRDb21wbGV0ZShhcGksIGFyY2hpdmVQYXRoLCBtb3N0UmVjZW50VmVyc2lvbikpXHJcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihleHRyYWN0Tm90aWZJZCk7XHJcbiAgICAgICAgICAgICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihkb3dubG9hZE5vdGlmSWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1ENUNvbXBhcmlzb25FcnJvciB8fCBlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xyXG4gICAgICAgICAgICAgICAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBhdXRvbWF0aWNhbGx5IGluc3RhbGwgU2NyaXB0IE1lcmdlcicsIGVyci5lcnJvck1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Vycm9yJyxcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdQbGVhc2UgaW5zdGFsbCBTY3JpcHQgTWVyZ2VyIG1hbnVhbGx5JywgeyBuczogJ2dhbWUtd2l0Y2hlcjMnIH0pLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgIHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnSW5zdGFsbCBNYW51YWxseScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vd2l0Y2hlcjMvbW9kcy80ODQnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gQ3VycmVudGx5IEFGQUlLIHRoaXMgd291bGQgb25seSBvY2N1ciBpZiBnaXRodWIgaXMgZG93biBmb3IgYW55IHJlYXNvblxyXG4gICAgICAgICAgICAgICAgLy8gIGFuZCB3ZSB3ZXJlIHVuYWJsZSB0byByZXNvbHZlIHRoZSByZS1kaXJlY3Rpb24gbGluay4gR2l2ZW4gdGhhdCB0aGUgdXNlclxyXG4gICAgICAgICAgICAgICAgLy8gIGV4cGVjdHMgYSByZXN1bHQgZnJvbSBoaW0gY2xpY2tpbmcgdGhlIGRvd25sb2FkIGJ1dHRvbiwgd2UgbGV0IGhpbSBrbm93XHJcbiAgICAgICAgICAgICAgICAvLyAgdG8gdHJ5IGFnYWluXHJcbiAgICAgICAgICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbmZvJyxcclxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnVXBkYXRlIGZhaWxlZCBkdWUgdGVtcG9yYXJ5IG5ldHdvcmsgaXNzdWUgLSB0cnkgYWdhaW4gbGF0ZXInLCB7IG5zOiAnZ2FtZS13aXRjaGVyMycgfSksXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICB9IH0gXSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnVXBkYXRlJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZG93bmxvYWRDb25zZW50KGFwaSlcclxuICAgICAgICAudGhlbigoKSA9PiBkb3dubG9hZCgpKTtcclxuICAgIH0pXHJcbiAgICAudGhlbigoYXJjaGl2ZVBhdGgpID0+IG9uRG93bmxvYWRDb21wbGV0ZShhcGksIGFyY2hpdmVQYXRoLCBtb3N0UmVjZW50VmVyc2lvbikpXHJcbiAgICAuY2F0Y2goYXN5bmMgZXJyID0+IHtcclxuICAgICAgY29uc3QgcmFpc2VNYW51YWxJbnN0YWxsTm90aWYgPSAoKSA9PiB7XHJcbiAgICAgICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gYXV0b21hdGljYWxseSBpbnN0YWxsIFNjcmlwdCBNZXJnZXInLCBlcnIuZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgICB0eXBlOiAnZXJyb3InLFxyXG4gICAgICAgICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGluc3RhbGwgU2NyaXB0IE1lcmdlciBtYW51YWxseScsIHsgbnM6ICdnYW1lLXdpdGNoZXIzJyB9KSxcclxuICAgICAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHRpdGxlOiAnSW5zdGFsbCBNYW51YWxseScsXHJcbiAgICAgICAgICAgICAgYWN0aW9uOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93d3cubmV4dXNtb2RzLmNvbS93aXRjaGVyMy9tb2RzLzQ4NCcpXHJcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBudWxsKVxyXG4gICAgICAgICAgICB9XSxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihleHRyYWN0Tm90aWZJZCk7XHJcbiAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKGRvd25sb2FkTm90aWZJZCk7XHJcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNRDVDb21wYXJpc29uRXJyb3IpIHtcclxuICAgICAgICByYWlzZU1hbnVhbEluc3RhbGxOb3RpZigpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0gZWxzZSBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpIHtcclxuICAgICAgICBpZiAoKGVyci5tZXNzYWdlLnN0YXJ0c1dpdGgoJ0FscmVhZHknKSkgfHwgKGVyci5tZXNzYWdlLnN0YXJ0c1dpdGgoJ1VwZGF0ZScpKSkge1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZXJyLm1lc3NhZ2Uuc3RhcnRzV2l0aCgnRmFpbGVkIHRvIHJlc29sdmUgZG93bmxvYWQgbG9jYXRpb24nKSkge1xyXG4gICAgICAgICAgLy8gQ3VycmVudGx5IEFGQUlLIHRoaXMgd291bGQgb25seSBvY2N1ciBpZiBnaXRodWIgaXMgZG93biBmb3IgYW55IHJlYXNvblxyXG4gICAgICAgICAgLy8gIGFuZCB3ZSB3ZXJlIHVuYWJsZSB0byByZXNvbHZlIHRoZSByZS1kaXJlY3Rpb24gbGluay4gR2l2ZW4gdGhhdCB0aGlzXHJcbiAgICAgICAgICAvLyAgd2lsbCBtb3N0IGNlcnRhaW5seSByZXNvbHZlIGl0c2VsZiBldmVudHVhbGx5IC0gd2UgbG9nIHRoaXMgYW5kIGtlZXAgZ29pbmcuXHJcbiAgICAgICAgICBsb2coJ2luZm8nLCAnZmFpbGVkIHRvIHJlc29sdmUgVzMgc2NyaXB0IG1lcmdlciByZS1kaXJlY3Rpb24gbGluaycsIGVycik7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlcnIubWVzc2FnZS5zdGFydHNXaXRoKCdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJykpIHtcclxuICAgICAgICAgIHJhaXNlTWFudWFsSW5zdGFsbE5vdGlmKCk7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5jb25zdCBleHRyYWN0Tm90aWZJZCA9ICdleHRyYWN0aW5nLXNjcmlwdC1tZXJnZXInO1xyXG5jb25zdCBleHRyYWN0Tm90aWYgPSB7XHJcbiAgaWQ6IGV4dHJhY3ROb3RpZklkLFxyXG4gIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgdGl0bGU6ICdFeHRyYWN0aW5nIFNjcmlwdCBNZXJnZXInLFxyXG59XHJcbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RTY3JpcHRNZXJnZXIoYXBpLCBhcmNoaXZlUGF0aCkge1xyXG4gIGNvbnN0IGRlc3RpbmF0aW9uID0gYXdhaXQgZ2V0U2NyaXB0TWVyZ2VyRGlyKGFwaSwgdHJ1ZSk7XHJcbiAgaWYgKGRlc3RpbmF0aW9uID09PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIEhvdyA/XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJykpO1xyXG4gIH1cclxuICBjb25zdCBzWmlwID0gbmV3IHV0aWwuU2V2ZW5aaXAoKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbihleHRyYWN0Tm90aWYpO1xyXG4gIGF3YWl0IHNaaXAuZXh0cmFjdEZ1bGwoYXJjaGl2ZVBhdGgsIGRlc3RpbmF0aW9uKTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdXMyBTY3JpcHQgTWVyZ2VyIGV4dHJhY3RlZCBzdWNjZXNzZnVsbHknLCB7IG5zOiAnZ2FtZS13aXRjaGVyMycgfSksXHJcbiAgfSk7XHJcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oZXh0cmFjdE5vdGlmSWQpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGVzdGluYXRpb24pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZXRVcE1lcmdlcihhcGksIG1lcmdlclZlcnNpb24sIG5ld1BhdGgpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgJ3dpdGNoZXIzJ10sIHVuZGVmaW5lZCk7XHJcbiAgY29uc3QgY3VycmVudERldGFpbHMgPSBkaXNjb3Zlcnk/LnRvb2xzPy5XM1NjcmlwdE1lcmdlcjtcclxuXHJcbiAgY29uc3QgbmV3VG9vbERldGFpbHMgPSAoISFjdXJyZW50RGV0YWlscylcclxuICAgID8geyAuLi5jdXJyZW50RGV0YWlscywgbWVyZ2VyVmVyc2lvbiB9XHJcbiAgICA6IHtcclxuICAgICAgaWQ6IFNDUklQVF9NRVJHRVJfSUQsXHJcbiAgICAgIG5hbWU6ICdXMyBTY3JpcHQgTWVyZ2VyJyxcclxuICAgICAgbG9nbzogJ1dpdGNoZXJTY3JpcHRNZXJnZXIuanBnJyxcclxuICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW1xyXG4gICAgICAgICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXHJcbiAgICAgIF0sXHJcbiAgICAgIG1lcmdlclZlcnNpb24sXHJcbiAgICB9O1xyXG4gIG5ld1Rvb2xEZXRhaWxzLnBhdGggPSBwYXRoLmpvaW4obmV3UGF0aCwgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyk7XHJcbiAgbmV3VG9vbERldGFpbHMud29ya2luZ0RpcmVjdG9yeSA9IG5ld1BhdGg7XHJcbiAgYXdhaXQgc2V0TWVyZ2VyQ29uZmlnKGRpc2NvdmVyeS5wYXRoLCBuZXdQYXRoKTtcclxuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbCgnd2l0Y2hlcjMnLCBTQ1JJUFRfTUVSR0VSX0lELCBuZXdUb29sRGV0YWlscywgdHJ1ZSkpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1lcmdlZE1vZE5hbWUoc2NyaXB0TWVyZ2VyUGF0aCkge1xyXG4gIGNvbnN0IGNvbmZpZ0ZpbGVQYXRoID0gcGF0aC5qb2luKHNjcmlwdE1lcmdlclBhdGgsIE1FUkdFUl9DT05GSUdfRklMRSk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGNvbmZpZ0ZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb25zdCBjb25maWcgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoZGF0YSk7XHJcbiAgICBjb25zdCBjb25maWdJdGVtcyA9IGNvbmZpZz8uY29uZmlndXJhdGlvbj8uYXBwU2V0dGluZ3M/LlswXT8uYWRkO1xyXG4gICAgY29uc3QgTWVyZ2VkTW9kTmFtZSA9IGNvbmZpZ0l0ZW1zPy5maW5kKGl0ZW0gPT4gaXRlbS4kPy5rZXkgPT09ICdNZXJnZWRNb2ROYW1lJykgPz8gdW5kZWZpbmVkO1xyXG4gICAgaWYgKCEhTWVyZ2VkTW9kTmFtZT8uJD8udmFsdWUpIHtcclxuICAgICAgcmV0dXJuIE1lcmdlZE1vZE5hbWUuJC52YWx1ZTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIC8vIFRoaXMgaXMgcHJvYmFibHkgYSBzaWduIG9mIGEgY29ycnVwdCBzY3JpcHQgbWVyZ2VyIGluc3RhbGxhdGlvbi4uLi5cclxuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGFzY2VydGFpbiBtZXJnZWQgbW9kIG5hbWUgLSB1c2luZyBcIm1vZDAwMDBfTWVyZ2VkRmlsZXNcIicsIGVycik7XHJcbiAgICByZXR1cm4gJ21vZDAwMDBfTWVyZ2VkRmlsZXMnO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldE1lcmdlckNvbmZpZyhnYW1lUm9vdFBhdGgsIHNjcmlwdE1lcmdlclBhdGgpIHtcclxuICBjb25zdCBmaW5kSW5kZXggPSAobm9kZXMsIGlkKSA9PiB7XHJcbiAgICByZXR1cm4gbm9kZXM/LmZpbmRJbmRleChpdGVyID0+IGl0ZXIuJD8ua2V5ID09PSBpZCkgPz8gdW5kZWZpbmVkO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGNvbmZpZ0ZpbGVQYXRoID0gcGF0aC5qb2luKHNjcmlwdE1lcmdlclBhdGgsIE1FUkdFUl9DT05GSUdfRklMRSk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGNvbmZpZ0ZpbGVQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb25zdCBjb25maWcgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoZGF0YSk7XHJcbiAgICBjb25zdCByZXBsYWNlRWxlbWVudCA9IChpZCwgcmVwbGFjZW1lbnQpID0+IHtcclxuICAgICAgY29uc3QgaWR4ID0gZmluZEluZGV4KGNvbmZpZz8uY29uZmlndXJhdGlvbj8uYXBwU2V0dGluZ3M/LlswXT8uYWRkLCBpZCk7XHJcbiAgICAgIGlmIChpZHggIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGNvbmZpZy5jb25maWd1cmF0aW9uLmFwcFNldHRpbmdzWzBdLmFkZFtpZHhdLiQgPSB7IGtleTogaWQsIHZhbHVlOiByZXBsYWNlbWVudCB9O1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHJlcGxhY2VFbGVtZW50KCdHYW1lRGlyZWN0b3J5JywgZ2FtZVJvb3RQYXRoKTtcclxuICAgIHJlcGxhY2VFbGVtZW50KCdWYW5pbGxhU2NyaXB0c0RpcmVjdG9yeScsIHBhdGguam9pbihnYW1lUm9vdFBhdGgsICdjb250ZW50JywgJ2NvbnRlbnQwJywgJ3NjcmlwdHMnKSk7XHJcbiAgICByZXBsYWNlRWxlbWVudCgnTW9kc0RpcmVjdG9yeScsIHBhdGguam9pbihnYW1lUm9vdFBhdGgsICdtb2RzJykpO1xyXG4gICAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XHJcbiAgICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KGNvbmZpZyk7XHJcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhjb25maWdGaWxlUGF0aCwgeG1sKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIC8vIEd1ZXNzIHRoZSB1c2VyIHdpbGwgaGF2ZSB0byBzZXQgdXAgdGhlIG1lcmdlciBjb25maWd1cmF0aW9uXHJcbiAgICAvLyAgdGhyb3VnaCB0aGUgbWVyZ2VyIGRpcmVjdGx5LlxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxufVxyXG4iXX0=