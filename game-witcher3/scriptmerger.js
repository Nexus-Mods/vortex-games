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
exports.getScriptMergerDir = getScriptMergerDir;
exports.downloadScriptMerger = downloadScriptMerger;
exports.getMergedModName = getMergedModName;
exports.setMergerConfig = setMergerConfig;
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
function getScriptMergerDir(api_1) {
    return __awaiter(this, arguments, void 0, function* (api, create = false) {
        var _a, _b;
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0bWVyZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NyaXB0bWVyZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBK0tBLGdEQW9CQztBQUVELG9EQXFMQztBQWlERCw0Q0FlQztBQUVELDBDQTJCQztBQXRkRCxrREFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLG9EQUF1QjtBQUN2Qiw4Q0FBc0I7QUFDdEIsbUNBQXFEO0FBQ3JELG9EQUE0QjtBQUM1Qiw4REFBcUM7QUFDckMsMkNBQTJEO0FBSTNELE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQztBQUMvQixNQUFNLFVBQVUsR0FBRyx1REFBdUQsQ0FBQztBQUMzRSxNQUFNLGNBQWMsR0FBRyxxQkFBcUIsQ0FBQztBQUU3QyxNQUFNLGtCQUFrQixHQUFHLGdDQUFnQyxDQUFDO0FBRTVELE1BQU0sRUFBRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFHOUUsU0FBUyxLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU87SUFDN0IsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxNQUFNLE1BQU0sR0FBRyxhQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsT0FBTyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDbEQsTUFBTSxPQUFPLG1DQUNSLGdCQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUMsS0FDL0MsT0FBTyxFQUFFO2dCQUNQLFlBQVksRUFBRSxRQUFRO2FBQ3ZCLEdBQ0YsQ0FBQztRQUVGLGVBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDekIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBcUMsQ0FBQztZQUMxRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFHLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDdkQsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQztnQkFDdEUsSUFBQSxnQkFBRyxFQUFDLE1BQU0sRUFBRSw0QkFBNEIsRUFDdEMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDbEQsT0FBTyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7WUFDeEUsQ0FBQztZQUVELElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNoQixHQUFHO2lCQUNBLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDO2lCQUNsQyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtnQkFDZCxJQUFJLENBQUM7b0JBQ0gsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUNyQyxDQUFDO2dCQUFDLE9BQU8sUUFBUSxFQUFFLENBQUM7b0JBQ2xCLE9BQU8sTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMxQixDQUFDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUM7YUFDQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ2pCLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JCLENBQUMsQ0FBQzthQUNELEdBQUcsRUFBRSxDQUFDO0lBQ1gsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxJQUFJO0lBQzdCLE1BQU0sTUFBTSxHQUFHLGFBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0IsT0FBTyxpQ0FDRixnQkFBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDLEtBQy9DLE9BQU8sRUFBRTtZQUNQLFlBQVksRUFBRSxRQUFRO1NBQ3ZCLElBQ0QsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFlLGVBQWUsQ0FBQyxHQUF3Qjs7UUFFckQsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUMzQyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSx5QkFBeUIsRUFBRTtnQkFDaEQsTUFBTSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsa0VBQWtFO3NCQUNwRixtRkFBbUY7c0JBQ25GLDBGQUEwRjtzQkFDMUYsdUdBQXVHO3NCQUN2RyxnSEFBZ0g7c0JBQ2hILDhJQUE4STtzQkFDOUksNElBQTRJLEVBQUUsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFLENBQUM7YUFDM0ssRUFBRTtnQkFDRCxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBRTtnQkFDbEUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRTthQUMvQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FBQTtBQUVELFNBQWUsZ0JBQWdCLENBQUMsR0FBd0I7OztRQUN0RCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25DLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3JHLElBQUksQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxNQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ2xDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsVUFBVSxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQztRQUMzRSxDQUFDO1FBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsS0FBSywwQ0FBRSxjQUFjLENBQUM7UUFDaEQsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDekIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxJQUFJLENBQUMsQ0FBQyxDQUFBLE1BQU0sYUFBTixNQUFNLHVCQUFOLE1BQU0sQ0FBRSxJQUFJLENBQUEsRUFBRSxDQUFDO1lBQ25CLE9BQU8sZUFBRSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO2lCQUM3QixJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNULElBQUksQ0FBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsYUFBYSxNQUFLLFNBQVMsRUFBRSxDQUFDO29CQUN4QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUMvQyxDQUFDO2dCQUNELE1BQU0sV0FBVyxHQUFHLElBQUEscUJBQVUsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzVDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO29CQUNsQixNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNwRSxNQUFNLGNBQWMsbUNBQVEsTUFBTSxLQUFFLGFBQWEsRUFBRSxjQUFjLEdBQUUsQ0FBQztvQkFDcEUsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxpQkFBaUIsQ0FBQyxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ2xHLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDekMsQ0FBQztZQUNILENBQUMsQ0FBQztpQkFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDOUMsQ0FBQzthQUFNLENBQUM7WUFDTixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDcEMsQ0FBQztJQUNILENBQUM7Q0FBQTtBQUVELElBQUksV0FBVyxDQUFDO0FBQ2hCLFNBQWUsUUFBUSxDQUFDLEdBQXdCOztRQUM5QyxJQUFJLFdBQVcsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUM5QixJQUFJLENBQUM7Z0JBQ0gsTUFBTSxJQUFJLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGVBQWUsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ2pHLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2pDLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUliLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQywwQkFBMEIsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDM0QsT0FBTyxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBQzFCLENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxXQUFXLENBQUM7SUFDckIsQ0FBQztDQUFBO0FBRUQsU0FBZSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLGlCQUFpQjs7UUFDbkUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFPLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUMzQyxJQUFJLFdBQVcsQ0FBQztZQUNoQixJQUFJLENBQUM7Z0JBQ0gsV0FBVyxHQUFHLE1BQU0sT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNDLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNiLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGtCQUFrQixDQUFDLDBCQUEwQixFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDekYsQ0FBQztZQUNELE1BQU0sU0FBUyxHQUFHLE1BQU0sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3RDLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxXQUFXLEVBQUUsS0FBSyxXQUFXLENBQUM7bUJBQ3JELENBQUMsS0FBSyxDQUFDLE9BQU8sS0FBSyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBRWpGLE9BQU8sTUFBTSxDQUFDLElBQUksa0JBQWtCLENBQUMsNEJBQTRCLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNuRixDQUFDO1lBRUQsT0FBTyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDOUIsQ0FBQyxDQUFBLENBQUM7YUFDRCxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQzthQUM1RCxJQUFJLENBQUMsQ0FBTyxVQUFVLEVBQUUsRUFBRTtZQUN6QixNQUFNLFVBQVUsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBQ3BFLElBQUksUUFBUSxDQUFDO1lBQ2IsSUFBSSxDQUFDO2dCQUNILFFBQVEsR0FBRyxNQUFNLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDYixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxrQkFBa0IsQ0FBQywwQkFBMEIsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3hGLENBQUM7WUFDRCxNQUFNLFNBQVMsR0FBRyxNQUFNLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLEtBQUssUUFBUSxDQUFDO21CQUMvQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEtBQUssaUJBQWlCLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUVqRixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxzQkFBc0IsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3BGLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFBLENBQUM7YUFDRCxJQUFJLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQTtJQUN4RSxDQUFDO0NBQUE7QUFFRCxTQUFzQixrQkFBa0I7eURBQUMsR0FBRyxFQUFFLE1BQU0sR0FBRyxLQUFLOztRQUMxRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDckcsSUFBSSxDQUFBLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRSxJQUFJLE1BQUssU0FBUyxFQUFFLENBQUM7WUFDbEMsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQztRQUNELE1BQU0sV0FBVyxHQUFHLE1BQUEsTUFBQSxTQUFTLENBQUMsS0FBSywwQ0FBRSxjQUFjLDBDQUFFLElBQUksQ0FBQztRQUMxRCxJQUFJLENBQUM7WUFDSCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2pCLE1BQU0sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUM5QyxDQUFDO1lBQ0QsTUFBTSxlQUFFLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sV0FBVyxDQUFDO1FBQ3JCLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsTUFBTSxXQUFXLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1lBQzlELElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxlQUFFLENBQUMsc0JBQXNCLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDL0MsQ0FBQztZQUNELE9BQU8sV0FBVyxDQUFDO1FBQ3JCLENBQUM7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFzQixvQkFBb0IsQ0FBQyxHQUF3Qjs7UUFDakUsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuQyxNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRyxJQUFJLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksTUFBSyxTQUFTLEVBQUUsQ0FBQztZQUNsQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFVBQVUsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7UUFDM0UsQ0FBQztRQUNELElBQUksaUJBQWlCLENBQUM7UUFDdEIsTUFBTSx5QkFBeUIsR0FBRyxNQUFNLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlELE1BQU0sZUFBZSxHQUFHLDhCQUE4QixDQUFDO1FBQ3ZELE9BQU8sS0FBSyxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUM7YUFDakMsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDakIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFDN0IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxXQUFXLENBQUMsbUNBQW1DLENBQUMsQ0FBQyxDQUFDO1lBQ25GLENBQUM7WUFDRCxNQUFNLE9BQU8sR0FBRyxRQUFRO2lCQUNyQixNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxnQkFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksZ0JBQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxjQUFjLENBQUMsQ0FBQztpQkFDN0UsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsZ0JBQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUUxRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsQ0FBQyxDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQU0sY0FBYyxFQUFDLEVBQUU7O1lBQzNCLGlCQUFpQixHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDM0MsTUFBTSxRQUFRLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbEQsTUFBTSxZQUFZLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQztZQUN0RSxJQUFJLENBQUMsQ0FBQyx5QkFBeUIsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDakcsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxlQUFlLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1lBQ3hFLENBQUM7WUFFRCxNQUFNLGFBQWEsR0FBd0I7Z0JBQ3pDLEVBQUUsRUFBRSxlQUFlO2dCQUNuQixJQUFJLEVBQUUsVUFBVTtnQkFDaEIsS0FBSyxFQUFFLHNCQUFzQjtnQkFDN0IsT0FBTyxFQUFFLDJCQUEyQjthQUNyQyxDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQUcsR0FBUyxFQUFFO2dCQUMxQixHQUFHLENBQUMsZ0JBQWdCLGlDQUNmLGFBQWEsS0FDaEIsUUFBUSxFQUFFLENBQUMsSUFDWCxDQUFDO2dCQUNILElBQUksY0FBYyxDQUFDO2dCQUNuQixjQUFjLEdBQUcsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtvQkFDckQsTUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ2hELGVBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFO3dCQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxTQUFTLENBQUM7NEJBQzVDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs0QkFDbEMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLHFDQUFxQyxDQUFDLENBQUMsQ0FBQztvQkFDOUUsQ0FBQyxDQUFDO3lCQUNDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7eUJBQy9CLEdBQUcsRUFBRSxDQUFDO2dCQUNYLENBQUMsQ0FBQyxDQUFDO2dCQUNILE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ3JDLE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO29CQUNsRCxlQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRTt3QkFDM0IsR0FBRyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQzt3QkFDMUIsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQXFDLENBQUM7d0JBQzFELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxPQUFPLGFBQVAsT0FBTyx1QkFBUCxPQUFPLENBQUcsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDaEUsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRyx1QkFBdUIsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUN4RSxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDOzRCQUN2RCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFHLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDOzRCQUN0RSxJQUFBLGdCQUFHLEVBQUMsTUFBTSxFQUFFLDRCQUE0QixFQUN0QyxFQUFFLFFBQVEsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDOzRCQUNsRCxPQUFPLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsZUFBZSxDQUFDLDRCQUE0QixDQUFDLENBQUMsQ0FBQzt3QkFDeEUsQ0FBQzt3QkFFRCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7d0JBQ2hCLEdBQUc7NkJBQ0EsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTs0QkFDakIsTUFBTSxJQUFJLElBQUksQ0FBQTs0QkFDZCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO2dDQUk5QixHQUFHLENBQUMsZ0JBQWdCLGlDQUNmLGFBQWEsS0FDaEIsUUFBUSxFQUFFLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUMsR0FBRyxHQUFHLElBQy9DLENBQUM7NEJBQ0wsQ0FBQzt3QkFDSCxDQUFDLENBQUM7NkJBQ0QsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7NEJBQ2QsR0FBRyxDQUFDLGdCQUFnQixpQ0FDZixhQUFhLEtBQ2hCLFFBQVEsRUFBRSxHQUFHLElBQ2IsQ0FBQzs0QkFDSCxHQUFHLENBQUMsbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUM7NEJBQ3pDLE9BQU8sZUFBRSxDQUFDLGNBQWMsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDO2lDQUMxRixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2lDQUN4RCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDL0IsQ0FBQyxDQUFDLENBQUM7b0JBQ1AsQ0FBQyxDQUFDO3lCQUNDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7eUJBQy9CLEdBQUcsRUFBRSxDQUFDO2dCQUNYLENBQUMsQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFBLENBQUE7WUFFRCxJQUFJLENBQUMsQ0FBQyx5QkFBeUIsSUFBSSxDQUFDLENBQUMseUJBQXlCLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsTUFBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsS0FBSywwQ0FBRSxjQUFjLENBQUEsQ0FBQyxFQUFFLENBQUM7Z0JBQ3JILEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztvQkFDbkIsRUFBRSxFQUFFLGVBQWU7b0JBQ25CLElBQUksRUFBRSxTQUFTO29CQUNmLFNBQVMsRUFBRSxJQUFJO29CQUNmLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLDBDQUEwQyxFQUMvRCxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsQ0FBQztvQkFDMUIsT0FBTyxFQUFFLENBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsRUFBRTtnQ0FDaEQsT0FBTyxFQUFFLENBQUM7Z0NBQ1YsT0FBTyxRQUFRLEVBQUU7cUNBQ2QsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7cUNBQzlFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtvQ0FDWCxHQUFHLENBQUMsbUJBQW1CLENBQUMsY0FBYyxDQUFDLENBQUM7b0NBQ3hDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQ0FDekMsSUFBSSxHQUFHLFlBQVksa0JBQWtCLElBQUksR0FBRyxZQUFZLGlCQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7d0NBQzdFLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsK0NBQStDLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO3dDQUNoRixHQUFHLENBQUMsZ0JBQWdCLENBQUM7NENBQ25CLElBQUksRUFBRSxPQUFPOzRDQUNiLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLHVDQUF1QyxFQUFFLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxDQUFDOzRDQUN4RixPQUFPLEVBQUU7Z0RBQ1A7b0RBQ0UsS0FBSyxFQUFFLGtCQUFrQjtvREFDekIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFJLENBQUMsR0FBRyxDQUFDLDZDQUE2QyxDQUFDO3lEQUM5RCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7aURBQzFCOzZDQUFDO3lDQUNMLENBQUMsQ0FBQTt3Q0FDRixPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQ0FDM0IsQ0FBQztvQ0FLRCxHQUFHLENBQUMsZ0JBQWdCLENBQUM7d0NBQ25CLElBQUksRUFBRSxNQUFNO3dDQUNaLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLDZEQUE2RCxFQUFFLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxDQUFDO3FDQUMvRyxDQUFDLENBQUE7b0NBQ0YsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Z0NBQzNCLENBQUMsQ0FBQyxDQUFBOzRCQUNOLENBQUMsRUFBRSxDQUFFO2lCQUNOLENBQUMsQ0FBQztnQkFFSCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzVELENBQUM7WUFFRCxPQUFPLGVBQWUsQ0FBQyxHQUFHLENBQUM7aUJBQ3hCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQzVCLENBQUMsQ0FBQSxDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixDQUFDLENBQUM7YUFDOUUsS0FBSyxDQUFDLENBQU0sR0FBRyxFQUFDLEVBQUU7WUFDakIsTUFBTSx1QkFBdUIsR0FBRyxHQUFHLEVBQUU7Z0JBQ25DLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsK0NBQStDLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNoRixHQUFHLENBQUMsZ0JBQWdCLENBQUM7b0JBQ25CLElBQUksRUFBRSxPQUFPO29CQUNiLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLHVDQUF1QyxFQUFFLEVBQUUsRUFBRSxFQUFFLGVBQWUsRUFBRSxDQUFDO29CQUN4RixPQUFPLEVBQUU7d0JBQ1A7NEJBQ0UsS0FBSyxFQUFFLGtCQUFrQjs0QkFDekIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFJLENBQUMsR0FBRyxDQUFDLDZDQUE2QyxDQUFDO2lDQUM5RCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUM7eUJBQzFCO3FCQUFDO2lCQUNMLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQTtZQUNELEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN4QyxHQUFHLENBQUMsbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDekMsSUFBSSxHQUFHLFlBQVksa0JBQWtCLEVBQUUsQ0FBQztnQkFDdEMsdUJBQXVCLEVBQUUsQ0FBQztnQkFDMUIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDM0IsQ0FBQztZQUNELElBQUksR0FBRyxZQUFZLGlCQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ3JDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzNCLENBQUM7aUJBQU0sSUFBSSxHQUFHLFlBQVksaUJBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDL0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQzlFLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMzQixDQUFDO3FCQUFNLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMscUNBQXFDLENBQUMsRUFBRSxDQUFDO29CQUl6RSxJQUFBLGdCQUFHLEVBQUMsTUFBTSxFQUFFLHNEQUFzRCxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUN6RSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFDM0IsQ0FBQztxQkFBTSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLHdCQUF3QixDQUFDLEVBQUUsQ0FBQztvQkFDNUQsdUJBQXVCLEVBQUUsQ0FBQztvQkFDMUIsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzNCLENBQUM7WUFDSCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLENBQUM7UUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFBO0lBQ04sQ0FBQztDQUFBO0FBRUQsTUFBTSxjQUFjLEdBQUcsMEJBQTBCLENBQUM7QUFDbEQsTUFBTSxZQUFZLEdBQUc7SUFDbkIsRUFBRSxFQUFFLGNBQWM7SUFDbEIsSUFBSSxFQUFFLFVBQVU7SUFDaEIsS0FBSyxFQUFFLDBCQUEwQjtDQUNsQyxDQUFBO0FBQ0QsU0FBZSxtQkFBbUIsQ0FBQyxHQUFHLEVBQUUsV0FBVzs7UUFDakQsTUFBTSxXQUFXLEdBQUcsTUFBTSxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEQsSUFBSSxXQUFXLEtBQUssU0FBUyxFQUFFLENBQUM7WUFFOUIsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksaUJBQUksQ0FBQyxlQUFlLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1FBQzVFLENBQUM7UUFDRCxNQUFNLElBQUksR0FBRyxJQUFJLGlCQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDakMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25DLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDakQsR0FBRyxDQUFDLGdCQUFnQixDQUFDO1lBQ25CLElBQUksRUFBRSxNQUFNO1lBQ1osT0FBTyxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMseUNBQXlDLEVBQUUsRUFBRSxFQUFFLEVBQUUsZUFBZSxFQUFFLENBQUM7U0FDM0YsQ0FBQyxDQUFDO1FBQ0gsR0FBRyxDQUFDLG1CQUFtQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN0QyxDQUFDO0NBQUE7QUFFRCxTQUFlLFdBQVcsQ0FBQyxHQUFHLEVBQUUsYUFBYSxFQUFFLE9BQU87OztRQUNwRCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25DLE1BQU0sU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3JHLE1BQU0sY0FBYyxHQUFHLE1BQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLEtBQUssMENBQUUsY0FBYyxDQUFDO1FBRXhELE1BQU0sY0FBYyxHQUFHLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQztZQUN2QyxDQUFDLGlDQUFNLGNBQWMsS0FBRSxhQUFhLElBQ3BDLENBQUMsQ0FBQztZQUNBLEVBQUUsRUFBRSxnQkFBZ0I7WUFDcEIsSUFBSSxFQUFFLGtCQUFrQjtZQUN4QixJQUFJLEVBQUUseUJBQXlCO1lBQy9CLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyx5QkFBeUI7WUFDM0MsYUFBYSxFQUFFO2dCQUNiLHlCQUF5QjthQUMxQjtZQUNELGFBQWE7U0FDZCxDQUFDO1FBQ0osY0FBYyxDQUFDLElBQUksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3BFLGNBQWMsQ0FBQyxnQkFBZ0IsR0FBRyxPQUFPLENBQUM7UUFDMUMsTUFBTSxlQUFlLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNsRyxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDO0NBQUE7QUFFRCxTQUFzQixnQkFBZ0IsQ0FBQyxnQkFBZ0I7OztRQUNyRCxNQUFNLGNBQWMsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDdkUsSUFBSSxDQUFDO1lBQ0gsTUFBTSxJQUFJLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSwyQkFBa0IsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUM5QyxNQUFNLFdBQVcsR0FBRyxNQUFBLE1BQUEsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsYUFBYSwwQ0FBRSxXQUFXLDBDQUFHLENBQUMsQ0FBQywwQ0FBRSxHQUFHLENBQUM7WUFDakUsTUFBTSxhQUFhLEdBQUcsTUFBQSxXQUFXLGFBQVgsV0FBVyx1QkFBWCxXQUFXLENBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFdBQUMsT0FBQSxDQUFBLE1BQUEsSUFBSSxDQUFDLENBQUMsMENBQUUsR0FBRyxNQUFLLGVBQWUsQ0FBQSxFQUFBLENBQUMsbUNBQUksU0FBUyxDQUFDO1lBQzlGLElBQUksQ0FBQyxDQUFDLENBQUEsTUFBQSxhQUFhLGFBQWIsYUFBYSx1QkFBYixhQUFhLENBQUUsQ0FBQywwQ0FBRSxLQUFLLENBQUEsRUFBRSxDQUFDO2dCQUM5QixPQUFPLGFBQWEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQy9CLENBQUM7UUFDSCxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUViLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsbUVBQW1FLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkYsT0FBTyxxQkFBcUIsQ0FBQztRQUMvQixDQUFDO0lBQ0gsQ0FBQztDQUFBO0FBRUQsU0FBc0IsZUFBZSxDQUFDLFlBQVksRUFBRSxnQkFBZ0I7O1FBQ2xFLE1BQU0sU0FBUyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFOztZQUM5QixPQUFPLE1BQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxXQUFDLE9BQUEsQ0FBQSxNQUFBLElBQUksQ0FBQyxDQUFDLDBDQUFFLEdBQUcsTUFBSyxFQUFFLENBQUEsRUFBQSxDQUFDLG1DQUFJLFNBQVMsQ0FBQztRQUNuRSxDQUFDLENBQUM7UUFFRixNQUFNLGNBQWMsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFDdkUsSUFBSSxDQUFDO1lBQ0gsTUFBTSxJQUFJLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLGNBQWMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSwyQkFBa0IsRUFBQyxJQUFJLENBQUMsQ0FBQztZQUM5QyxNQUFNLGNBQWMsR0FBRyxDQUFDLEVBQUUsRUFBRSxXQUFXLEVBQUUsRUFBRTs7Z0JBQ3pDLE1BQU0sR0FBRyxHQUFHLFNBQVMsQ0FBQyxNQUFBLE1BQUEsTUFBQSxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsYUFBYSwwQ0FBRSxXQUFXLDBDQUFHLENBQUMsQ0FBQywwQ0FBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3hFLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUN0QixNQUFNLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLENBQUM7Z0JBQ25GLENBQUM7WUFDSCxDQUFDLENBQUM7WUFFRixjQUFjLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzlDLGNBQWMsQ0FBQyx5QkFBeUIsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckcsY0FBYyxDQUFDLGVBQWUsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sT0FBTyxHQUFHLElBQUksZ0JBQU8sRUFBRSxDQUFDO1lBQzlCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDeEMsTUFBTSxlQUFFLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUdiLE9BQU87UUFDVCxDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IGh0dHBzIGZyb20gJ2h0dHBzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCB1cmwgZnJvbSAndXJsJztcclxuaW1wb3J0IHsgQnVpbGRlciwgcGFyc2VTdHJpbmdQcm9taXNlIH0gZnJvbSAneG1sMmpzJztcclxuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgZ2V0VmVyc2lvbiBmcm9tICdleGUtdmVyc2lvbic7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCB0eXBlcywgbG9nLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBJSW5jb21pbmdHaXRodWJIdHRwSGVhZGVycyB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuY29uc3QgUkVMRUFTRV9DVVRPRkYgPSAnMC42LjUnO1xyXG5jb25zdCBHSVRIVUJfVVJMID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvSURDcy9XaXRjaGVyU2NyaXB0TWVyZ2VyJztcclxuY29uc3QgTUVSR0VSX1JFTFBBVEggPSAnV2l0Y2hlclNjcmlwdE1lcmdlcic7XHJcblxyXG5jb25zdCBNRVJHRVJfQ09ORklHX0ZJTEUgPSAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUuY29uZmlnJztcclxuXHJcbmNvbnN0IHsgZ2V0SGFzaCwgTUQ1Q29tcGFyaXNvbkVycm9yLCBTQ1JJUFRfTUVSR0VSX0lEIH0gPSByZXF1aXJlKCcuL2NvbW1vbicpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIHF1ZXJ5KGJhc2VVcmwsIHJlcXVlc3QpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgY29uc3QgcmVsVXJsID0gdXJsLnBhcnNlKGAke2Jhc2VVcmx9LyR7cmVxdWVzdH1gKTtcclxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XHJcbiAgICAgIC4uLl8ucGljayhyZWxVcmwsIFsncG9ydCcsICdob3N0bmFtZScsICdwYXRoJ10pLFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnVm9ydGV4JyxcclxuICAgICAgfSxcclxuICAgIH07XHJcblxyXG4gICAgaHR0cHMuZ2V0KG9wdGlvbnMsIChyZXMpID0+IHtcclxuICAgICAgcmVzLnNldEVuY29kaW5nKCd1dGYtOCcpO1xyXG4gICAgICBjb25zdCBoZWFkZXJzID0gcmVzLmhlYWRlcnMgYXMgSUluY29taW5nR2l0aHViSHR0cEhlYWRlcnM7XHJcbiAgICAgIGNvbnN0IGNhbGxzUmVtYWluaW5nID0gcGFyc2VJbnQoaGVhZGVycz8uWyd4LXJhdGVsaW1pdC1yZW1haW5pbmcnXSwgMTApO1xyXG4gICAgICBpZiAoKHJlcy5zdGF0dXNDb2RlID09PSA0MDMpICYmIChjYWxsc1JlbWFpbmluZyA9PT0gMCkpIHtcclxuICAgICAgICBjb25zdCByZXNldERhdGUgPSBwYXJzZUludChoZWFkZXJzPy5bJ3gtcmF0ZWxpbWl0LXJlc2V0J10sIDEwKSAqIDEwMDA7XHJcbiAgICAgICAgbG9nKCdpbmZvJywgJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJyxcclxuICAgICAgICAgIHsgcmVzZXRfYXQ6IChuZXcgRGF0ZShyZXNldERhdGUpKS50b1N0cmluZygpIH0pO1xyXG4gICAgICAgIHJldHVybiByZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHaXRIdWIgcmF0ZSBsaW1pdCBleGNlZWRlZCcpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IG91dHB1dCA9ICcnO1xyXG4gICAgICByZXNcclxuICAgICAgICAub24oJ2RhdGEnLCBkYXRhID0+IG91dHB1dCArPSBkYXRhKVxyXG4gICAgICAgIC5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoSlNPTi5wYXJzZShvdXRwdXQpKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWplY3QocGFyc2VFcnIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xyXG4gICAgICB9KVxyXG4gICAgICAuZW5kKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJlcXVlc3RPcHRpb25zKGxpbmspIHtcclxuICBjb25zdCByZWxVcmwgPSB1cmwucGFyc2UobGluayk7XHJcbiAgcmV0dXJuICh7XHJcbiAgICAuLi5fLnBpY2socmVsVXJsLCBbJ3BvcnQnLCAnaG9zdG5hbWUnLCAncGF0aCddKSxcclxuICAgIGhlYWRlcnM6IHtcclxuICAgICAgJ1VzZXItQWdlbnQnOiAnVm9ydGV4JyxcclxuICAgIH0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkQ29uc2VudChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBcclxuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzIFNjcmlwdCBNZXJnZXInLCB7XHJcbiAgICAgIGJiY29kZTogYXBpLnRyYW5zbGF0ZSgnTWFueSBXaXRjaGVyIDMgbW9kcyBhZGQgb3IgZWRpdCBnYW1lIHNjcmlwdHMuIFdoZW4gc2V2ZXJhbCBtb2RzICcgXHJcbiAgICAgICAgKyAnZWRpdGluZyB0aGUgc2FtZSBzY3JpcHQgYXJlIGluc3RhbGxlZCwgdGhlc2UgbW9kcyBuZWVkIHRvIGJlIG1lcmdlZCB1c2luZyBhIHRvb2wgJyBcclxuICAgICAgICArICdjYWxsZWQgV2l0Y2hlciAzIFNjcmlwdCBNZXJnZXIuIFZvcnRleCBjYW4gYXR0ZW1wdCB0byBkb3dubG9hZCBhbmQgY29uZmlndXJlIHRoZSBtZXJnZXIgJ1xyXG4gICAgICAgICsgJ2ZvciB5b3UgYXV0b21hdGljYWxseSAtIGJlZm9yZSBkb2luZyBzbyAtIHBsZWFzZSBlbnN1cmUgeW91ciBhY2NvdW50IGhhcyBmdWxsIHJlYWQvd3JpdGUgcGVybWlzc2lvbnMgJ1xyXG4gICAgICAgICsgJ3RvIHlvdXIgZ2FtZVxcJ3MgZGlyZWN0b3J5LiBUaGUgc2NyaXB0IG1lcmdlciBjYW4gYmUgaW5zdGFsbGVkIGF0IGEgbGF0ZXIgcG9pbnQgaWYgeW91IHdpc2guIFticl1bL2JyXVticl1bL2JyXSdcclxuICAgICAgICArICdbdXJsPWh0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Ub29sX1NldHVwOl9XaXRjaGVyXzNfU2NyaXB0X01lcmdlcl1maW5kIG91dCBtb3JlIGFib3V0IHRoZSBzY3JpcHQgbWVyZ2VyLlsvdXJsXVticl1bL2JyXVticl1bL2JyXScgXHJcbiAgICAgICAgKyAnTm90ZTogV2hpbGUgc2NyaXB0IG1lcmdpbmcgd29ya3Mgd2VsbCB3aXRoIHRoZSB2YXN0IG1ham9yaXR5IG9mIG1vZHMsIHRoZXJlIGlzIG5vIGd1YXJhbnRlZSBmb3IgYSBzYXRpc2Z5aW5nIG91dGNvbWUgaW4gZXZlcnkgc2luZ2xlIGNhc2UuJywgeyBuczogJ2dhbWUtd2l0Y2hlcjMnIH0pLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiByZWplY3QobmV3IHV0aWwuVXNlckNhbmNlbGVkKCkpIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdEb3dubG9hZCcsIGFjdGlvbjogKCkgPT4gcmVzb2x2ZSgpIH0sXHJcbiAgICBdKTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0TWVyZ2VyVmVyc2lvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgJ3dpdGNoZXIzJ10sIHVuZGVmaW5lZCk7XHJcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuU2V0dXBFcnJvcignV2l0Y2hlcjMgaXMgbm90IGRpc2NvdmVyZWQnKSk7XHJcbiAgfVxyXG4gIGNvbnN0IG1lcmdlciA9IGRpc2NvdmVyeT8udG9vbHM/LlczU2NyaXB0TWVyZ2VyO1xyXG4gIGlmIChtZXJnZXIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgaWYgKCEhbWVyZ2VyPy5wYXRoKSB7XHJcbiAgICByZXR1cm4gZnMuc3RhdEFzeW5jKG1lcmdlci5wYXRoKVxyXG4gICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgaWYgKG1lcmdlcj8ubWVyZ2VyVmVyc2lvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1lcmdlci5tZXJnZXJWZXJzaW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZXhlY1ZlcnNpb24gPSBnZXRWZXJzaW9uKG1lcmdlci5wYXRoKTtcclxuICAgICAgICBpZiAoISFleGVjVmVyc2lvbikge1xyXG4gICAgICAgICAgY29uc3QgdHJpbW1lZFZlcnNpb24gPSBleGVjVmVyc2lvbi5zcGxpdCgnLicpLnNsaWNlKDAsIDMpLmpvaW4oJy4nKTtcclxuICAgICAgICAgIGNvbnN0IG5ld1Rvb2xEZXRhaWxzID0geyAuLi5tZXJnZXIsIG1lcmdlclZlcnNpb246IHRyaW1tZWRWZXJzaW9uIH07XHJcbiAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbCgnd2l0Y2hlcjMnLCBTQ1JJUFRfTUVSR0VSX0lELCBuZXdUb29sRGV0YWlscywgdHJ1ZSkpO1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0cmltbWVkVmVyc2lvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpKTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxufVxyXG5cclxubGV0IF9IQVNIX0NBQ0hFO1xyXG5hc3luYyBmdW5jdGlvbiBnZXRDYWNoZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICBpZiAoX0hBU0hfQ0FDSEUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ01ENUNhY2hlLmpzb24nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgICBfSEFTSF9DQUNIRSA9IEpTT04ucGFyc2UoZGF0YSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgLy8gSWYgdGhpcyBldmVyIGhhcHBlbnMgLSB0aGUgdXNlcidzIG1hY2hpbmUgbXVzdCBiZSBzY3Jld2VkLlxyXG4gICAgICAvLyAgTWF5YmUgdmlydXMgPyBkZWZlY3RpdmUgaGFyZHdhcmUgPyBkaWQgaGUgbWFudWFsbHkgbWFuaXB1bGF0ZVxyXG4gICAgICAvLyAgdGhlIGZpbGUgP1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcGFyc2UgTUQ1Q2FjaGUnLCBlcnIpO1xyXG4gICAgICByZXR1cm4gX0hBU0hfQ0FDSEUgPSBbXTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBfSEFTSF9DQUNIRTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gb25Eb3dubG9hZENvbXBsZXRlKGFwaSwgYXJjaGl2ZVBhdGgsIG1vc3RSZWNlbnRWZXJzaW9uKSB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGxldCBhcmNoaXZlSGFzaDtcclxuICAgIHRyeSB7XHJcbiAgICAgIGFyY2hpdmVIYXNoID0gYXdhaXQgZ2V0SGFzaChhcmNoaXZlUGF0aCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBNRDVDb21wYXJpc29uRXJyb3IoJ0ZhaWxlZCB0byBjYWxjdWxhdGUgaGFzaCcsIGFyY2hpdmVQYXRoKSk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBoYXNoQ2FjaGUgPSBhd2FpdCBnZXRDYWNoZShhcGkpO1xyXG4gICAgaWYgKGhhc2hDYWNoZS5maW5kKGVudHJ5ID0+IChlbnRyeS5hcmNoaXZlQ2hlY2tzdW0udG9Mb3dlckNhc2UoKSA9PT0gYXJjaGl2ZUhhc2gpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKGVudHJ5LnZlcnNpb24gPT09IG1vc3RSZWNlbnRWZXJzaW9uKSkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAvLyBOb3QgYSB2YWxpZCBoYXNoIC0gc29tZXRoaW5nIG1heSBoYXZlIGhhcHBlbmVkIGR1cmluZyB0aGUgZG93bmxvYWQgP1xyXG4gICAgICByZXR1cm4gcmVqZWN0KG5ldyBNRDVDb21wYXJpc29uRXJyb3IoJ0NvcnJ1cHRlZCBhcmNoaXZlIGRvd25sb2FkJywgYXJjaGl2ZVBhdGgpKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzb2x2ZShhcmNoaXZlUGF0aCk7XHJcbiAgfSlcclxuICAudGhlbigoYXJjaGl2ZVBhdGgpID0+IGV4dHJhY3RTY3JpcHRNZXJnZXIoYXBpLCBhcmNoaXZlUGF0aCkpXHJcbiAgLnRoZW4oYXN5bmMgKG1lcmdlclBhdGgpID0+IHtcclxuICAgIGNvbnN0IG1lcmdlckV4ZWMgPSBwYXRoLmpvaW4obWVyZ2VyUGF0aCwgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyk7XHJcbiAgICBsZXQgZXhlY0hhc2g7XHJcbiAgICB0cnkge1xyXG4gICAgICBleGVjSGFzaCA9IGF3YWl0IGdldEhhc2gobWVyZ2VyRXhlYyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBNRDVDb21wYXJpc29uRXJyb3IoJ0ZhaWxlZCB0byBjYWxjdWxhdGUgaGFzaCcsIG1lcmdlckV4ZWMpKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGhhc2hDYWNoZSA9IGF3YWl0IGdldENhY2hlKGFwaSk7XHJcbiAgICBpZiAoaGFzaENhY2hlLmZpbmQoZW50cnkgPT4gKGVudHJ5LmV4ZWNDaGVja3N1bS50b0xvd2VyQ2FzZSgpID09PSBleGVjSGFzaClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoZW50cnkudmVyc2lvbiA9PT0gbW9zdFJlY2VudFZlcnNpb24pKSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIC8vIE5vdCBhIHZhbGlkIGhhc2ggLSBzb21ldGhpbmcgbWF5IGhhdmUgaGFwcGVuZWQgZHVyaW5nIGV4dHJhY3Rpb24gP1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IE1ENUNvbXBhcmlzb25FcnJvcignQ29ycnVwdGVkIGV4ZWN1dGFibGUnLCBtZXJnZXJFeGVjKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtZXJnZXJQYXRoKTtcclxuICB9KVxyXG4gIC50aGVuKChtZXJnZXJQYXRoKSA9PiBzZXRVcE1lcmdlcihhcGksIG1vc3RSZWNlbnRWZXJzaW9uLCBtZXJnZXJQYXRoKSlcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNjcmlwdE1lcmdlckRpcihhcGksIGNyZWF0ZSA9IGZhbHNlKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsICd3aXRjaGVyMyddLCB1bmRlZmluZWQpO1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcbiAgY29uc3QgY3VycmVudFBhdGggPSBkaXNjb3ZlcnkudG9vbHM/LlczU2NyaXB0TWVyZ2VyPy5wYXRoO1xyXG4gIHRyeSB7XHJcbiAgICBpZiAoIWN1cnJlbnRQYXRoKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2NyaXB0IE1lcmdlciBub3Qgc2V0IHVwJyk7XHJcbiAgICB9XHJcbiAgICBhd2FpdCBmcy5zdGF0QXN5bmMoY3VycmVudFBhdGgpO1xyXG4gICAgcmV0dXJuIGN1cnJlbnRQYXRoO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc3QgZGVmYXVsdFBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1FUkdFUl9SRUxQQVRIKTtcclxuICAgIGlmIChjcmVhdGUpIHtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhkZWZhdWx0UGF0aCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGVmYXVsdFBhdGg7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRTY3JpcHRNZXJnZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsICd3aXRjaGVyMyddLCB1bmRlZmluZWQpO1xyXG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlNldHVwRXJyb3IoJ1dpdGNoZXIzIGlzIG5vdCBkaXNjb3ZlcmVkJykpO1xyXG4gIH1cclxuICBsZXQgbW9zdFJlY2VudFZlcnNpb247XHJcbiAgY29uc3QgY3VycmVudGx5SW5zdGFsbGVkVmVyc2lvbiA9IGF3YWl0IGdldE1lcmdlclZlcnNpb24oYXBpKTtcclxuICBjb25zdCBkb3dubG9hZE5vdGlmSWQgPSAnZG93bmxvYWQtc2NyaXB0LW1lcmdlci1ub3RpZic7XHJcbiAgcmV0dXJuIHF1ZXJ5KEdJVEhVQl9VUkwsICdyZWxlYXNlcycpXHJcbiAgICAudGhlbigocmVsZWFzZXMpID0+IHtcclxuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlbGVhc2VzKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnZXhwZWN0ZWQgYXJyYXkgb2YgZ2l0aHViIHJlbGVhc2VzJykpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSByZWxlYXNlc1xyXG4gICAgICAgIC5maWx0ZXIocmVsID0+IHNlbXZlci52YWxpZChyZWwubmFtZSkgJiYgc2VtdmVyLmd0ZShyZWwubmFtZSwgUkVMRUFTRV9DVVRPRkYpKVxyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyLmNvbXBhcmUocmhzLm5hbWUsIGxocy5uYW1lKSk7XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnQpO1xyXG4gICAgfSlcclxuICAgIC50aGVuKGFzeW5jIGN1cnJlbnRSZWxlYXNlID0+IHtcclxuICAgICAgbW9zdFJlY2VudFZlcnNpb24gPSBjdXJyZW50UmVsZWFzZVswXS5uYW1lO1xyXG4gICAgICBjb25zdCBmaWxlTmFtZSA9IGN1cnJlbnRSZWxlYXNlWzBdLmFzc2V0c1swXS5uYW1lO1xyXG4gICAgICBjb25zdCBkb3dubG9hZExpbmsgPSBjdXJyZW50UmVsZWFzZVswXS5hc3NldHNbMF0uYnJvd3Nlcl9kb3dubG9hZF91cmw7XHJcbiAgICAgIGlmICghIWN1cnJlbnRseUluc3RhbGxlZFZlcnNpb24gJiYgc2VtdmVyLmd0ZShjdXJyZW50bHlJbnN0YWxsZWRWZXJzaW9uLCBjdXJyZW50UmVsZWFzZVswXS5uYW1lKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0FscmVhZHkgdXAgdG8gZGF0ZScpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uc3QgZG93bmxvYWROb3RpZjogdHlwZXMuSU5vdGlmaWNhdGlvbiA9IHtcclxuICAgICAgICBpZDogZG93bmxvYWROb3RpZklkLFxyXG4gICAgICAgIHR5cGU6ICdhY3Rpdml0eScsXHJcbiAgICAgICAgdGl0bGU6ICdBZGRpbmcgU2NyaXB0IE1lcmdlcicsXHJcbiAgICAgICAgbWVzc2FnZTogJ1RoaXMgbWF5IHRha2UgYSBtaW51dGUuLi4nLFxyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGRvd25sb2FkID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICAgIC4uLmRvd25sb2FkTm90aWYsXHJcbiAgICAgICAgICBwcm9ncmVzczogMCxcclxuICAgICAgICB9KTtcclxuICAgICAgICBsZXQgcmVkaXJlY3Rpb25VUkw7XHJcbiAgICAgICAgcmVkaXJlY3Rpb25VUkwgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZ2V0UmVxdWVzdE9wdGlvbnMoZG93bmxvYWRMaW5rKTtcclxuICAgICAgICAgIGh0dHBzLnJlcXVlc3Qob3B0aW9ucywgcmVzID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIChyZXMuaGVhZGVyc1snbG9jYXRpb24nXSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICAgID8gcmVzb2x2ZShyZXMuaGVhZGVyc1snbG9jYXRpb24nXSlcclxuICAgICAgICAgICAgICA6IHJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0ZhaWxlZCB0byByZXNvbHZlIGRvd25sb2FkIGxvY2F0aW9uJykpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcclxuICAgICAgICAgICAgLmVuZCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZ2V0UmVxdWVzdE9wdGlvbnMocmVkaXJlY3Rpb25VUkwpO1xyXG4gICAgICAgICAgaHR0cHMucmVxdWVzdChvcHRpb25zLCByZXMgPT4ge1xyXG4gICAgICAgICAgICByZXMuc2V0RW5jb2RpbmcoJ2JpbmFyeScpO1xyXG4gICAgICAgICAgICBjb25zdCBoZWFkZXJzID0gcmVzLmhlYWRlcnMgYXMgSUluY29taW5nR2l0aHViSHR0cEhlYWRlcnM7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBwYXJzZUludChoZWFkZXJzPy5bJ2NvbnRlbnQtbGVuZ3RoJ10sIDEwKTtcclxuICAgICAgICAgICAgY29uc3QgY2FsbHNSZW1haW5pbmcgPSBwYXJzZUludChoZWFkZXJzPy5bJ3gtcmF0ZWxpbWl0LXJlbWFpbmluZyddLCAxMCk7XHJcbiAgICAgICAgICAgIGlmICgocmVzLnN0YXR1c0NvZGUgPT09IDQwMykgJiYgKGNhbGxzUmVtYWluaW5nID09PSAwKSkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHJlc2V0RGF0ZSA9IHBhcnNlSW50KGhlYWRlcnM/LlsneC1yYXRlbGltaXQtcmVzZXQnXSwgMTApICogMTAwMDtcclxuICAgICAgICAgICAgICBsb2coJ2luZm8nLCAnR2l0SHViIHJhdGUgbGltaXQgZXhjZWVkZWQnLFxyXG4gICAgICAgICAgICAgICAgeyByZXNldF9hdDogKG5ldyBEYXRlKHJlc2V0RGF0ZSkpLnRvU3RyaW5nKCkgfSk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJykpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgb3V0cHV0ID0gJyc7XHJcbiAgICAgICAgICAgIHJlc1xyXG4gICAgICAgICAgICAgIC5vbignZGF0YScsIGRhdGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgb3V0cHV0ICs9IGRhdGFcclxuICAgICAgICAgICAgICAgIGlmIChvdXRwdXQubGVuZ3RoICUgNTAwID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFVwZGF0aW5nIHRoZSBub3RpZmljYXRpb24gaXMgRVhUUkVNRUxZIGV4cGVuc2l2ZS5cclxuICAgICAgICAgICAgICAgICAgLy8gIHRoZSBsZW5ndGggJSA1MDAgPT09IDAgbGluZSBlbnN1cmVzIHRoaXMgaXMgbm90IGRvbmUgdG9vXHJcbiAgICAgICAgICAgICAgICAgIC8vICBvZnRlbi5cclxuICAgICAgICAgICAgICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgICAgICAgICAgICAgIC4uLmRvd25sb2FkTm90aWYsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IChvdXRwdXQubGVuZ3RoIC8gY29udGVudExlbmd0aCkgKiAxMDAsXHJcbiAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgICAgICAgICAgIC4uLmRvd25sb2FkTm90aWYsXHJcbiAgICAgICAgICAgICAgICAgIHByb2dyZXNzOiAxMDAsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKGRvd25sb2FkTm90aWZJZCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZnMud3JpdGVGaWxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBmaWxlTmFtZSksIG91dHB1dCwgeyBlbmNvZGluZzogJ2JpbmFyeScgfSlcclxuICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVzb2x2ZShwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIGZpbGVOYW1lKSkpXHJcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gcmVqZWN0KGVycikpO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcclxuICAgICAgICAgICAgLmVuZCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoISFjdXJyZW50bHlJbnN0YWxsZWRWZXJzaW9uIHx8ICgoY3VycmVudGx5SW5zdGFsbGVkVmVyc2lvbiA9PT0gdW5kZWZpbmVkKSAmJiAhIWRpc2NvdmVyeT8udG9vbHM/LlczU2NyaXB0TWVyZ2VyKSkge1xyXG4gICAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICAgIGlkOiAnbWVyZ2VyLXVwZGF0ZScsXHJcbiAgICAgICAgICB0eXBlOiAnd2FybmluZycsXHJcbiAgICAgICAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICAgICAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdJbXBvcnRhbnQgU2NyaXB0IE1lcmdlciB1cGRhdGUgYXZhaWxhYmxlJyxcclxuICAgICAgICAgICAgeyBuczogJ2dhbWUtd2l0Y2hlcjMnIH0pLFxyXG4gICAgICAgICAgYWN0aW9uczogWyB7IHRpdGxlOiAnRG93bmxvYWQnLCBhY3Rpb246IGRpc21pc3MgPT4ge1xyXG4gICAgICAgICAgICBkaXNtaXNzKCk7XHJcbiAgICAgICAgICAgIHJldHVybiBkb3dubG9hZCgpXHJcbiAgICAgICAgICAgICAgLnRoZW4oKGFyY2hpdmVQYXRoKSA9PiBvbkRvd25sb2FkQ29tcGxldGUoYXBpLCBhcmNoaXZlUGF0aCwgbW9zdFJlY2VudFZlcnNpb24pKVxyXG4gICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oZXh0cmFjdE5vdGlmSWQpO1xyXG4gICAgICAgICAgICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oZG93bmxvYWROb3RpZklkKTtcclxuICAgICAgICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNRDVDb21wYXJpc29uRXJyb3IgfHwgZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpIHtcclxuICAgICAgICAgICAgICAgICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gYXV0b21hdGljYWxseSBpbnN0YWxsIFNjcmlwdCBNZXJnZXInLCBlcnIuZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdlcnJvcicsXHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGluc3RhbGwgU2NyaXB0IE1lcmdlciBtYW51YWxseScsIHsgbnM6ICdnYW1lLXdpdGNoZXIzJyB9KSxcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICB7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ0luc3RhbGwgTWFudWFsbHknLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL3dpdGNoZXIzL21vZHMvNDg0JylcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiBudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIEN1cnJlbnRseSBBRkFJSyB0aGlzIHdvdWxkIG9ubHkgb2NjdXIgaWYgZ2l0aHViIGlzIGRvd24gZm9yIGFueSByZWFzb25cclxuICAgICAgICAgICAgICAgIC8vICBhbmQgd2Ugd2VyZSB1bmFibGUgdG8gcmVzb2x2ZSB0aGUgcmUtZGlyZWN0aW9uIGxpbmsuIEdpdmVuIHRoYXQgdGhlIHVzZXJcclxuICAgICAgICAgICAgICAgIC8vICBleHBlY3RzIGEgcmVzdWx0IGZyb20gaGltIGNsaWNraW5nIHRoZSBkb3dubG9hZCBidXR0b24sIHdlIGxldCBoaW0ga25vd1xyXG4gICAgICAgICAgICAgICAgLy8gIHRvIHRyeSBhZ2FpblxyXG4gICAgICAgICAgICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnaW5mbycsXHJcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ1VwZGF0ZSBmYWlsZWQgZHVlIHRlbXBvcmFyeSBuZXR3b3JrIGlzc3VlIC0gdHJ5IGFnYWluIGxhdGVyJywgeyBuczogJ2dhbWUtd2l0Y2hlcjMnIH0pLFxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfSB9IF0sXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ1VwZGF0ZScpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGRvd25sb2FkQ29uc2VudChhcGkpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gZG93bmxvYWQoKSk7XHJcbiAgICB9KVxyXG4gICAgLnRoZW4oKGFyY2hpdmVQYXRoKSA9PiBvbkRvd25sb2FkQ29tcGxldGUoYXBpLCBhcmNoaXZlUGF0aCwgbW9zdFJlY2VudFZlcnNpb24pKVxyXG4gICAgLmNhdGNoKGFzeW5jIGVyciA9PiB7XHJcbiAgICAgIGNvbnN0IHJhaXNlTWFudWFsSW5zdGFsbE5vdGlmID0gKCkgPT4ge1xyXG4gICAgICAgIGxvZygnZXJyb3InLCAnRmFpbGVkIHRvIGF1dG9tYXRpY2FsbHkgaW5zdGFsbCBTY3JpcHQgTWVyZ2VyJywgZXJyLmVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgICAgdHlwZTogJ2Vycm9yJyxcclxuICAgICAgICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ1BsZWFzZSBpbnN0YWxsIFNjcmlwdCBNZXJnZXIgbWFudWFsbHknLCB7IG5zOiAnZ2FtZS13aXRjaGVyMycgfSksXHJcbiAgICAgICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICB0aXRsZTogJ0luc3RhbGwgTWFudWFsbHknLFxyXG4gICAgICAgICAgICAgIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vd2l0Y2hlcjMvbW9kcy80ODQnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbnVsbClcclxuICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oZXh0cmFjdE5vdGlmSWQpO1xyXG4gICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihkb3dubG9hZE5vdGlmSWQpO1xyXG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTUQ1Q29tcGFyaXNvbkVycm9yKSB7XHJcbiAgICAgICAgcmFpc2VNYW51YWxJbnN0YWxsTm90aWYoKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9IGVsc2UgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKSB7XHJcbiAgICAgICAgaWYgKChlcnIubWVzc2FnZS5zdGFydHNXaXRoKCdBbHJlYWR5JykpIHx8IChlcnIubWVzc2FnZS5zdGFydHNXaXRoKCdVcGRhdGUnKSkpIHtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKGVyci5tZXNzYWdlLnN0YXJ0c1dpdGgoJ0ZhaWxlZCB0byByZXNvbHZlIGRvd25sb2FkIGxvY2F0aW9uJykpIHtcclxuICAgICAgICAgIC8vIEN1cnJlbnRseSBBRkFJSyB0aGlzIHdvdWxkIG9ubHkgb2NjdXIgaWYgZ2l0aHViIGlzIGRvd24gZm9yIGFueSByZWFzb25cclxuICAgICAgICAgIC8vICBhbmQgd2Ugd2VyZSB1bmFibGUgdG8gcmVzb2x2ZSB0aGUgcmUtZGlyZWN0aW9uIGxpbmsuIEdpdmVuIHRoYXQgdGhpc1xyXG4gICAgICAgICAgLy8gIHdpbGwgbW9zdCBjZXJ0YWlubHkgcmVzb2x2ZSBpdHNlbGYgZXZlbnR1YWxseSAtIHdlIGxvZyB0aGlzIGFuZCBrZWVwIGdvaW5nLlxyXG4gICAgICAgICAgbG9nKCdpbmZvJywgJ2ZhaWxlZCB0byByZXNvbHZlIFczIHNjcmlwdCBtZXJnZXIgcmUtZGlyZWN0aW9uIGxpbmsnLCBlcnIpO1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZXJyLm1lc3NhZ2Uuc3RhcnRzV2l0aCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcpKSB7XHJcbiAgICAgICAgICByYWlzZU1hbnVhbEluc3RhbGxOb3RpZigpO1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuY29uc3QgZXh0cmFjdE5vdGlmSWQgPSAnZXh0cmFjdGluZy1zY3JpcHQtbWVyZ2VyJztcclxuY29uc3QgZXh0cmFjdE5vdGlmID0ge1xyXG4gIGlkOiBleHRyYWN0Tm90aWZJZCxcclxuICB0eXBlOiAnYWN0aXZpdHknLFxyXG4gIHRpdGxlOiAnRXh0cmFjdGluZyBTY3JpcHQgTWVyZ2VyJyxcclxufVxyXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0U2NyaXB0TWVyZ2VyKGFwaSwgYXJjaGl2ZVBhdGgpIHtcclxuICBjb25zdCBkZXN0aW5hdGlvbiA9IGF3YWl0IGdldFNjcmlwdE1lcmdlckRpcihhcGksIHRydWUpO1xyXG4gIGlmIChkZXN0aW5hdGlvbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAvLyBIb3cgP1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcpKTtcclxuICB9XHJcbiAgY29uc3Qgc1ppcCA9IG5ldyB1dGlsLlNldmVuWmlwKCk7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oZXh0cmFjdE5vdGlmKTtcclxuICBhd2FpdCBzWmlwLmV4dHJhY3RGdWxsKGFyY2hpdmVQYXRoLCBkZXN0aW5hdGlvbik7XHJcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgdHlwZTogJ2luZm8nLFxyXG4gICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnVzMgU2NyaXB0IE1lcmdlciBleHRyYWN0ZWQgc3VjY2Vzc2Z1bGx5JywgeyBuczogJ2dhbWUtd2l0Y2hlcjMnIH0pLFxyXG4gIH0pO1xyXG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKGV4dHJhY3ROb3RpZklkKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRlc3RpbmF0aW9uKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2V0VXBNZXJnZXIoYXBpLCBtZXJnZXJWZXJzaW9uLCBuZXdQYXRoKSB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsICd3aXRjaGVyMyddLCB1bmRlZmluZWQpO1xyXG4gIGNvbnN0IGN1cnJlbnREZXRhaWxzID0gZGlzY292ZXJ5Py50b29scz8uVzNTY3JpcHRNZXJnZXI7XHJcblxyXG4gIGNvbnN0IG5ld1Rvb2xEZXRhaWxzID0gKCEhY3VycmVudERldGFpbHMpXHJcbiAgICA/IHsgLi4uY3VycmVudERldGFpbHMsIG1lcmdlclZlcnNpb24gfVxyXG4gICAgOiB7XHJcbiAgICAgIGlkOiBTQ1JJUFRfTUVSR0VSX0lELFxyXG4gICAgICBuYW1lOiAnVzMgU2NyaXB0IE1lcmdlcicsXHJcbiAgICAgIGxvZ286ICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmpwZycsXHJcbiAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtcclxuICAgICAgICAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnLFxyXG4gICAgICBdLFxyXG4gICAgICBtZXJnZXJWZXJzaW9uLFxyXG4gICAgfTtcclxuICBuZXdUb29sRGV0YWlscy5wYXRoID0gcGF0aC5qb2luKG5ld1BhdGgsICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScpO1xyXG4gIG5ld1Rvb2xEZXRhaWxzLndvcmtpbmdEaXJlY3RvcnkgPSBuZXdQYXRoO1xyXG4gIGF3YWl0IHNldE1lcmdlckNvbmZpZyhkaXNjb3ZlcnkucGF0aCwgbmV3UGF0aCk7XHJcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuYWRkRGlzY292ZXJlZFRvb2woJ3dpdGNoZXIzJywgU0NSSVBUX01FUkdFUl9JRCwgbmV3VG9vbERldGFpbHMsIHRydWUpKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNZXJnZWRNb2ROYW1lKHNjcmlwdE1lcmdlclBhdGgpIHtcclxuICBjb25zdCBjb25maWdGaWxlUGF0aCA9IHBhdGguam9pbihzY3JpcHRNZXJnZXJQYXRoLCBNRVJHRVJfQ09ORklHX0ZJTEUpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhjb25maWdGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29uc3QgY29uZmlnID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGRhdGEpO1xyXG4gICAgY29uc3QgY29uZmlnSXRlbXMgPSBjb25maWc/LmNvbmZpZ3VyYXRpb24/LmFwcFNldHRpbmdzPy5bMF0/LmFkZDtcclxuICAgIGNvbnN0IE1lcmdlZE1vZE5hbWUgPSBjb25maWdJdGVtcz8uZmluZChpdGVtID0+IGl0ZW0uJD8ua2V5ID09PSAnTWVyZ2VkTW9kTmFtZScpID8/IHVuZGVmaW5lZDtcclxuICAgIGlmICghIU1lcmdlZE1vZE5hbWU/LiQ/LnZhbHVlKSB7XHJcbiAgICAgIHJldHVybiBNZXJnZWRNb2ROYW1lLiQudmFsdWU7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBUaGlzIGlzIHByb2JhYmx5IGEgc2lnbiBvZiBhIGNvcnJ1cHQgc2NyaXB0IG1lcmdlciBpbnN0YWxsYXRpb24uLi4uXHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBhc2NlcnRhaW4gbWVyZ2VkIG1vZCBuYW1lIC0gdXNpbmcgXCJtb2QwMDAwX01lcmdlZEZpbGVzXCInLCBlcnIpO1xyXG4gICAgcmV0dXJuICdtb2QwMDAwX01lcmdlZEZpbGVzJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRNZXJnZXJDb25maWcoZ2FtZVJvb3RQYXRoLCBzY3JpcHRNZXJnZXJQYXRoKSB7XHJcbiAgY29uc3QgZmluZEluZGV4ID0gKG5vZGVzLCBpZCkgPT4ge1xyXG4gICAgcmV0dXJuIG5vZGVzPy5maW5kSW5kZXgoaXRlciA9PiBpdGVyLiQ/LmtleSA9PT0gaWQpID8/IHVuZGVmaW5lZDtcclxuICB9O1xyXG5cclxuICBjb25zdCBjb25maWdGaWxlUGF0aCA9IHBhdGguam9pbihzY3JpcHRNZXJnZXJQYXRoLCBNRVJHRVJfQ09ORklHX0ZJTEUpO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhjb25maWdGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xyXG4gICAgY29uc3QgY29uZmlnID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGRhdGEpO1xyXG4gICAgY29uc3QgcmVwbGFjZUVsZW1lbnQgPSAoaWQsIHJlcGxhY2VtZW50KSA9PiB7XHJcbiAgICAgIGNvbnN0IGlkeCA9IGZpbmRJbmRleChjb25maWc/LmNvbmZpZ3VyYXRpb24/LmFwcFNldHRpbmdzPy5bMF0/LmFkZCwgaWQpO1xyXG4gICAgICBpZiAoaWR4ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBjb25maWcuY29uZmlndXJhdGlvbi5hcHBTZXR0aW5nc1swXS5hZGRbaWR4XS4kID0geyBrZXk6IGlkLCB2YWx1ZTogcmVwbGFjZW1lbnQgfTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICByZXBsYWNlRWxlbWVudCgnR2FtZURpcmVjdG9yeScsIGdhbWVSb290UGF0aCk7XHJcbiAgICByZXBsYWNlRWxlbWVudCgnVmFuaWxsYVNjcmlwdHNEaXJlY3RvcnknLCBwYXRoLmpvaW4oZ2FtZVJvb3RQYXRoLCAnY29udGVudCcsICdjb250ZW50MCcsICdzY3JpcHRzJykpO1xyXG4gICAgcmVwbGFjZUVsZW1lbnQoJ01vZHNEaXJlY3RvcnknLCBwYXRoLmpvaW4oZ2FtZVJvb3RQYXRoLCAnbW9kcycpKTtcclxuICAgIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xyXG4gICAgY29uc3QgeG1sID0gYnVpbGRlci5idWlsZE9iamVjdChjb25maWcpO1xyXG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoY29uZmlnRmlsZVBhdGgsIHhtbCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAvLyBHdWVzcyB0aGUgdXNlciB3aWxsIGhhdmUgdG8gc2V0IHVwIHRoZSBtZXJnZXIgY29uZmlndXJhdGlvblxyXG4gICAgLy8gIHRocm91Z2ggdGhlIG1lcmdlciBkaXJlY3RseS5cclxuICAgIHJldHVybjtcclxuICB9XHJcbn1cclxuIl19