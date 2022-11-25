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
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadDivine = exports.checkForUpdates = exports.getLatestReleases = void 0;
const https = __importStar(require("https"));
const _ = __importStar(require("lodash"));
const semver = __importStar(require("semver"));
const url = __importStar(require("url"));
const common_1 = require("./common");
const vortex_api_1 = require("vortex-api");
const GITHUB_URL = 'https://api.github.com/repos/Norbyte/lslib';
function query(baseUrl, request) {
    return new Promise((resolve, reject) => {
        const getRequest = getRequestOptions(`${baseUrl}/${request}`);
        https.get(getRequest, (res) => {
            res.setEncoding('utf-8');
            const msgHeaders = res.headers;
            const callsRemaining = parseInt(vortex_api_1.util.getSafe(msgHeaders, ['x-ratelimit-remaining'], '0'), 10);
            if ((res.statusCode === 403) && (callsRemaining === 0)) {
                const resetDate = parseInt(vortex_api_1.util.getSafe(msgHeaders, ['x-ratelimit-reset'], '0'), 10);
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
    const relUrl = url.parse(link);
    return (Object.assign(Object.assign({}, _.pick(relUrl, ['port', 'hostname', 'path'])), { headers: {
            'User-Agent': 'Vortex',
        } }));
}
function downloadConsent(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return api.showDialog('error', 'Divine tool is missing', {
            bbcode: api.translate('Baldur\'s Gate 3\'s modding pattern in most (if not all) cases will require a 3rd '
                + 'party tool named "{{name}}" to manipulate game files.[br][/br][br][/br]'
                + 'Vortex can download and install this tool for you as a mod entry. Please ensure that the '
                + 'tool is always enabled and deployed on the mods page.[br][/br][br][/br]'
                + 'Please note that some Anti-Virus software may flag this tool as malicious due '
                + 'to the nature of the tool (unpacks .pak files). We suggest you ensure that '
                + 'your security software is configured to allow this tool to install.', { replace: { name: 'LSLib' } }),
        }, [
            { label: 'Cancel' },
            { label: 'Download' },
        ])
            .then(result => (result.action === 'Cancel')
            ? Promise.reject(new vortex_api_1.util.UserCanceled())
            : Promise.resolve());
    });
}
function notifyUpdate(api, latest, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const gameId = vortex_api_1.selectors.activeGameId(api.store.getState());
        const t = api.translate;
        return new Promise((resolve, reject) => {
            api.sendNotification({
                type: 'info',
                id: `divine-update`,
                noDismiss: true,
                allowSuppress: true,
                title: 'Update for {{name}}',
                message: 'Latest: {{latest}}, Installed: {{current}}',
                replace: {
                    latest,
                    current,
                },
                actions: [
                    { title: 'More', action: (dismiss) => {
                            api.showDialog('info', '{{name}} Update', {
                                text: 'Vortex has detected a newer version of {{name}} ({{latest}}) available to download from {{website}}. You currently have version {{current}} installed.'
                                    + '\nVortex can download and attempt to install the new update for you.',
                                parameters: {
                                    name: 'LSLib/Divine Tool',
                                    website: common_1.LSLIB_URL,
                                    latest,
                                    current,
                                },
                            }, [
                                {
                                    label: 'Download',
                                    action: () => {
                                        resolve();
                                        dismiss();
                                    },
                                },
                            ]);
                        },
                    },
                    {
                        title: 'Dismiss',
                        action: (dismiss) => {
                            resolve();
                            dismiss();
                        },
                    },
                ],
            });
        });
    });
}
function getLatestReleases(currentVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (GITHUB_URL) {
            return query(GITHUB_URL, 'releases')
                .then((releases) => {
                if (!Array.isArray(releases)) {
                    return Promise.reject(new vortex_api_1.util.DataInvalid('expected array of github releases'));
                }
                const current = releases
                    .filter(rel => {
                    const tagName = vortex_api_1.util.getSafe(rel, ['tag_name'], undefined);
                    const isPreRelease = vortex_api_1.util.getSafe(rel, ['prerelease'], false);
                    const version = semver.valid(tagName);
                    return (!isPreRelease
                        && (version !== null)
                        && ((currentVersion === undefined) || (semver.gte(version, currentVersion))));
                })
                    .sort((lhs, rhs) => semver.compare(rhs.tag_name, lhs.tag_name));
                return Promise.resolve(current);
            });
        }
    });
}
exports.getLatestReleases = getLatestReleases;
function startDownload(api, downloadLink) {
    return __awaiter(this, void 0, void 0, function* () {
        const redirectionURL = yield new Promise((resolve, reject) => {
            https.request(getRequestOptions(downloadLink), res => {
                return resolve(res.headers['location']);
            })
                .on('error', err => reject(err))
                .end();
        });
        const dlInfo = {
            game: common_1.GAME_ID,
            name: 'LSLib/Divine Tool',
        };
        api.events.emit('start-download', [redirectionURL], dlInfo, undefined, (error, id) => {
            if (error !== null) {
                if ((error.name === 'AlreadyDownloaded')
                    && (error.downloadId !== undefined)) {
                    id = error.downloadId;
                }
                else {
                    api.showErrorNotification('Download failed', error, { allowReport: false });
                    return Promise.resolve();
                }
            }
            api.events.emit('start-install-download', id, true, (err, modId) => {
                if (err !== null) {
                    api.showErrorNotification('Failed to install LSLib', err, { allowReport: false });
                }
                const state = api.getState();
                const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
                api.store.dispatch(vortex_api_1.actions.setModEnabled(profileId, modId, true));
                return Promise.resolve();
            });
        }, 'ask');
    });
}
function resolveDownloadLink(currentReleases) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const archives = currentReleases[0].assets.filter(asset => asset.name.match(/(ExportTool-v[0-9]+.[0-9]+.[0-9]+.zip)/i));
        const downloadLink = (_a = archives[0]) === null || _a === void 0 ? void 0 : _a.browser_download_url;
        return (downloadLink === undefined)
            ? Promise.reject(new vortex_api_1.util.DataInvalid('Failed to resolve browser download url'))
            : Promise.resolve(downloadLink);
    });
}
function checkForUpdates(api, currentVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        return getLatestReleases(currentVersion)
            .then((currentReleases) => __awaiter(this, void 0, void 0, function* () {
            if (currentReleases[0] === undefined) {
                (0, vortex_api_1.log)('error', 'Unable to update LSLib', 'Failed to find any releases');
                return Promise.resolve(currentVersion);
            }
            const mostRecentVersion = currentReleases[0].tag_name.slice(1);
            const downloadLink = yield resolveDownloadLink(currentReleases);
            if (semver.valid(mostRecentVersion) === null) {
                return Promise.resolve(currentVersion);
            }
            else {
                if (semver.gt(mostRecentVersion, currentVersion)) {
                    return notifyUpdate(api, mostRecentVersion, currentVersion)
                        .then(() => startDownload(api, downloadLink))
                        .then(() => Promise.resolve(mostRecentVersion));
                }
                else {
                    return Promise.resolve(currentVersion);
                }
            }
        })).catch(err => {
            if (err instanceof vortex_api_1.util.UserCanceled || err instanceof vortex_api_1.util.ProcessCanceled) {
                return Promise.resolve(currentVersion);
            }
            api.showErrorNotification('Unable to update LSLib', err);
            return Promise.resolve(currentVersion);
        });
    });
}
exports.checkForUpdates = checkForUpdates;
function downloadDivine(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const gameId = vortex_api_1.selectors.activeGameId(state);
        return getLatestReleases(undefined)
            .then((currentReleases) => __awaiter(this, void 0, void 0, function* () {
            const downloadLink = yield resolveDownloadLink(currentReleases);
            return downloadConsent(api)
                .then(() => startDownload(api, downloadLink));
        }))
            .catch(err => {
            if (err instanceof vortex_api_1.util.UserCanceled || err instanceof vortex_api_1.util.ProcessCanceled) {
                return Promise.resolve();
            }
            else {
                api.showErrorNotification('Unable to download/install LSLib', err);
                return Promise.resolve();
            }
        });
    });
}
exports.downloadDivine = downloadDivine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aHViRG93bmxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdpdGh1YkRvd25sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IsMENBQTRCO0FBQzVCLCtDQUFpQztBQUNqQyx5Q0FBMkI7QUFFM0IscUNBQThDO0FBRzlDLDJDQUFrRTtBQUVsRSxNQUFNLFVBQVUsR0FBRyw0Q0FBNEMsQ0FBQztBQUVoRSxTQUFTLEtBQUssQ0FBQyxPQUFlLEVBQUUsT0FBZTtJQUM3QyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDLEdBQUcsT0FBTyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDOUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFvQixFQUFFLEVBQUU7WUFDN0MsR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QixNQUFNLFVBQVUsR0FBd0IsR0FBRyxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM5RixJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDdEQsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3JGLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVB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LE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FBQTtBQS9CRCwwQ0ErQkM7QUFFRCxTQUFzQixjQUFjLENBQUMsR0FBd0I7O1FBQzNELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkMsTUFBTSxNQUFNLEdBQUcsc0JBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0MsT0FBTyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7YUFDaEMsSUFBSSxDQUFDLENBQU0sZUFBZSxFQUFDLEVBQUU7WUFDNUIsTUFBTSxZQUFZLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNoRSxPQUFPLGVBQWUsQ0FBQyxHQUFHLENBQUM7aUJBQ3hCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFBLENBQUM7YUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDWCxJQUFJLEdBQUcsWUFBWSxpQkFBSSxDQUFDLFlBQVksSUFBSSxHQUFHLFlBQVksaUJBQUksQ0FBQyxlQUFlLEVBQUU7Z0JBQzNFLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQzFCO2lCQUFNO2dCQUNMLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbkUsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDMUI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FBQTtBQWpCRCx3Q0FpQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XHJcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCAqIGFzIHVybCBmcm9tICd1cmwnO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgTFNMSUJfVVJMIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuaW1wb3J0IHsgSW5jb21pbmdIdHRwSGVhZGVycywgSW5jb21pbmdNZXNzYWdlIH0gZnJvbSAnaHR0cCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGxvZywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuY29uc3QgR0lUSFVCX1VSTCA9ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL05vcmJ5dGUvbHNsaWInO1xyXG5cclxuZnVuY3Rpb24gcXVlcnkoYmFzZVVybDogc3RyaW5nLCByZXF1ZXN0OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBjb25zdCBnZXRSZXF1ZXN0ID0gZ2V0UmVxdWVzdE9wdGlvbnMoYCR7YmFzZVVybH0vJHtyZXF1ZXN0fWApO1xyXG4gICAgaHR0cHMuZ2V0KGdldFJlcXVlc3QsIChyZXM6IEluY29taW5nTWVzc2FnZSkgPT4ge1xyXG4gICAgICByZXMuc2V0RW5jb2RpbmcoJ3V0Zi04Jyk7XHJcbiAgICAgIGNvbnN0IG1zZ0hlYWRlcnM6IEluY29taW5nSHR0cEhlYWRlcnMgPSByZXMuaGVhZGVycztcclxuICAgICAgY29uc3QgY2FsbHNSZW1haW5pbmcgPSBwYXJzZUludCh1dGlsLmdldFNhZmUobXNnSGVhZGVycywgWyd4LXJhdGVsaW1pdC1yZW1haW5pbmcnXSwgJzAnKSwgMTApO1xyXG4gICAgICBpZiAoKHJlcy5zdGF0dXNDb2RlID09PSA0MDMpICYmIChjYWxsc1JlbWFpbmluZyA9PT0gMCkpIHtcclxuICAgICAgICBjb25zdCByZXNldERhdGUgPSBwYXJzZUludCh1dGlsLmdldFNhZmUobXNnSGVhZGVycywgWyd4LXJhdGVsaW1pdC1yZXNldCddLCAnMCcpLCAxMCk7XHJcbiAgICAgICAgbG9nKCdpbmZvJywgJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJyxcclxuICAgICAgICAgIHsgcmVzZXRfYXQ6IChuZXcgRGF0ZShyZXNldERhdGUpKS50b1N0cmluZygpIH0pO1xyXG4gICAgICAgIHJldHVybiByZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHaXRIdWIgcmF0ZSBsaW1pdCBleGNlZWRlZCcpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgbGV0IG91dHB1dDogc3RyaW5nID0gJyc7XHJcbiAgICAgIHJlc1xyXG4gICAgICAgIC5vbignZGF0YScsIGRhdGEgPT4gb3V0cHV0ICs9IGRhdGEpXHJcbiAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShKU09OLnBhcnNlKG91dHB1dCkpO1xyXG4gICAgICAgICAgfSBjYXRjaCAocGFyc2VFcnIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChwYXJzZUVycik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG4gICAgICAub24oJ2Vycm9yJywgZXJyID0+IHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5lbmQoKTtcclxuICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0UmVxdWVzdE9wdGlvbnMobGluaykge1xyXG4gIGNvbnN0IHJlbFVybCA9IHVybC5wYXJzZShsaW5rKTtcclxuICByZXR1cm4gKHtcclxuICAgIC4uLl8ucGljayhyZWxVcmwsIFsncG9ydCcsICdob3N0bmFtZScsICdwYXRoJ10pLFxyXG4gICAgaGVhZGVyczoge1xyXG4gICAgICAnVXNlci1BZ2VudCc6ICdWb3J0ZXgnLFxyXG4gICAgfSxcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRDb25zZW50KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xyXG4gIHJldHVybiBhcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnRGl2aW5lIHRvb2wgaXMgbWlzc2luZycsIHtcclxuICAgIGJiY29kZTogYXBpLnRyYW5zbGF0ZSgnQmFsZHVyXFwncyBHYXRlIDNcXCdzIG1vZGRpbmcgcGF0dGVybiBpbiBtb3N0IChpZiBub3QgYWxsKSBjYXNlcyB3aWxsIHJlcXVpcmUgYSAzcmQgJ1xyXG4gICAgICArICdwYXJ0eSB0b29sIG5hbWVkIFwie3tuYW1lfX1cIiB0byBtYW5pcHVsYXRlIGdhbWUgZmlsZXMuW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICArICdWb3J0ZXggY2FuIGRvd25sb2FkIGFuZCBpbnN0YWxsIHRoaXMgdG9vbCBmb3IgeW91IGFzIGEgbW9kIGVudHJ5LiBQbGVhc2UgZW5zdXJlIHRoYXQgdGhlICdcclxuICAgICAgKyAndG9vbCBpcyBhbHdheXMgZW5hYmxlZCBhbmQgZGVwbG95ZWQgb24gdGhlIG1vZHMgcGFnZS5bYnJdWy9icl1bYnJdWy9icl0nXHJcbiAgICAgICsgJ1BsZWFzZSBub3RlIHRoYXQgc29tZSBBbnRpLVZpcnVzIHNvZnR3YXJlIG1heSBmbGFnIHRoaXMgdG9vbCBhcyBtYWxpY2lvdXMgZHVlICdcclxuICAgICAgKyAndG8gdGhlIG5hdHVyZSBvZiB0aGUgdG9vbCAodW5wYWNrcyAucGFrIGZpbGVzKS4gV2Ugc3VnZ2VzdCB5b3UgZW5zdXJlIHRoYXQgJ1xyXG4gICAgICArICd5b3VyIHNlY3VyaXR5IHNvZnR3YXJlIGlzIGNvbmZpZ3VyZWQgdG8gYWxsb3cgdGhpcyB0b29sIHRvIGluc3RhbGwuJywgeyByZXBsYWNlOiB7IG5hbWU6ICdMU0xpYicgfSB9KSxcclxuICB9LCBbXHJcbiAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxyXG4gICAgeyBsYWJlbDogJ0Rvd25sb2FkJyB9LFxyXG4gIF0pXHJcbiAgLnRoZW4ocmVzdWx0ID0+IChyZXN1bHQuYWN0aW9uID09PSAnQ2FuY2VsJylcclxuICAgID8gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuVXNlckNhbmNlbGVkKCkpXHJcbiAgICA6IFByb21pc2UucmVzb2x2ZSgpKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gbm90aWZ5VXBkYXRlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbGF0ZXN0OiBzdHJpbmcsIGN1cnJlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IGdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoYXBpLnN0b3JlLmdldFN0YXRlKCkpO1xyXG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xyXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgIHR5cGU6ICdpbmZvJyxcclxuICAgICAgaWQ6IGBkaXZpbmUtdXBkYXRlYCxcclxuICAgICAgbm9EaXNtaXNzOiB0cnVlLFxyXG4gICAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgICB0aXRsZTogJ1VwZGF0ZSBmb3Ige3tuYW1lfX0nLFxyXG4gICAgICBtZXNzYWdlOiAnTGF0ZXN0OiB7e2xhdGVzdH19LCBJbnN0YWxsZWQ6IHt7Y3VycmVudH19JyxcclxuICAgICAgcmVwbGFjZToge1xyXG4gICAgICAgIGxhdGVzdCxcclxuICAgICAgICBjdXJyZW50LFxyXG4gICAgICB9LFxyXG4gICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAgeyB0aXRsZSA6ICdNb3JlJywgYWN0aW9uOiAoZGlzbWlzczogKCkgPT4gdm9pZCkgPT4ge1xyXG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnaW5mbycsICd7e25hbWV9fSBVcGRhdGUnLCB7XHJcbiAgICAgICAgICAgICAgdGV4dDogJ1ZvcnRleCBoYXMgZGV0ZWN0ZWQgYSBuZXdlciB2ZXJzaW9uIG9mIHt7bmFtZX19ICh7e2xhdGVzdH19KSBhdmFpbGFibGUgdG8gZG93bmxvYWQgZnJvbSB7e3dlYnNpdGV9fS4gWW91IGN1cnJlbnRseSBoYXZlIHZlcnNpb24ge3tjdXJyZW50fX0gaW5zdGFsbGVkLidcclxuICAgICAgICAgICAgICArICdcXG5Wb3J0ZXggY2FuIGRvd25sb2FkIGFuZCBhdHRlbXB0IHRvIGluc3RhbGwgdGhlIG5ldyB1cGRhdGUgZm9yIHlvdS4nLFxyXG4gICAgICAgICAgICAgIHBhcmFtZXRlcnM6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdMU0xpYi9EaXZpbmUgVG9vbCcsXHJcbiAgICAgICAgICAgICAgICB3ZWJzaXRlOiBMU0xJQl9VUkwsXHJcbiAgICAgICAgICAgICAgICBsYXRlc3QsXHJcbiAgICAgICAgICAgICAgICBjdXJyZW50LFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sIFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgbGFiZWw6ICdEb3dubG9hZCcsXHJcbiAgICAgICAgICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBkaXNtaXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIF0pO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHRpdGxlOiAnRGlzbWlzcycsXHJcbiAgICAgICAgICBhY3Rpb246IChkaXNtaXNzKSA9PiB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdLFxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRMYXRlc3RSZWxlYXNlcyhjdXJyZW50VmVyc2lvbjogc3RyaW5nKSB7XHJcbiAgaWYgKEdJVEhVQl9VUkwpIHtcclxuICAgIHJldHVybiBxdWVyeShHSVRIVUJfVVJMLCAncmVsZWFzZXMnKVxyXG4gICAgLnRoZW4oKHJlbGVhc2VzKSA9PiB7XHJcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShyZWxlYXNlcykpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ2V4cGVjdGVkIGFycmF5IG9mIGdpdGh1YiByZWxlYXNlcycpKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCBjdXJyZW50ID0gcmVsZWFzZXNcclxuICAgICAgICAuZmlsdGVyKHJlbCA9PiB7XHJcbiAgICAgICAgICBjb25zdCB0YWdOYW1lID0gdXRpbC5nZXRTYWZlKHJlbCwgWyd0YWdfbmFtZSddLCB1bmRlZmluZWQpO1xyXG4gICAgICAgICAgY29uc3QgaXNQcmVSZWxlYXNlID0gdXRpbC5nZXRTYWZlKHJlbCwgWydwcmVyZWxlYXNlJ10sIGZhbHNlKTtcclxuICAgICAgICAgIGNvbnN0IHZlcnNpb24gPSBzZW12ZXIudmFsaWQodGFnTmFtZSk7XHJcblxyXG4gICAgICAgICAgcmV0dXJuICghaXNQcmVSZWxlYXNlXHJcbiAgICAgICAgICAgICYmICh2ZXJzaW9uICE9PSBudWxsKVxyXG4gICAgICAgICAgICAmJiAoKGN1cnJlbnRWZXJzaW9uID09PSB1bmRlZmluZWQpIHx8IChzZW12ZXIuZ3RlKHZlcnNpb24sIGN1cnJlbnRWZXJzaW9uKSkpKTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyLmNvbXBhcmUocmhzLnRhZ19uYW1lLCBsaHMudGFnX25hbWUpKTtcclxuXHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudCk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0RG93bmxvYWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkb3dubG9hZExpbms6IHN0cmluZykge1xyXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tc2hhZG93ZWQtdmFyaWFibGUgLSB3aHkgaXMgdGhpcyBldmVuIHJlcXVpcmVkID9cclxuICBjb25zdCByZWRpcmVjdGlvblVSTCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGh0dHBzLnJlcXVlc3QoZ2V0UmVxdWVzdE9wdGlvbnMoZG93bmxvYWRMaW5rKSwgcmVzID0+IHtcclxuICAgICAgcmV0dXJuIHJlc29sdmUocmVzLmhlYWRlcnNbJ2xvY2F0aW9uJ10pO1xyXG4gICAgfSlcclxuICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcclxuICAgICAgLmVuZCgpO1xyXG4gIH0pO1xyXG4gIGNvbnN0IGRsSW5mbyA9IHtcclxuICAgIGdhbWU6IEdBTUVfSUQsXHJcbiAgICBuYW1lOiAnTFNMaWIvRGl2aW5lIFRvb2wnLFxyXG4gIH07XHJcbiAgYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1kb3dubG9hZCcsIFtyZWRpcmVjdGlvblVSTF0sIGRsSW5mbywgdW5kZWZpbmVkLFxyXG4gICAgKGVycm9yLCBpZCkgPT4ge1xyXG4gICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcclxuICAgICAgICBpZiAoKGVycm9yLm5hbWUgPT09ICdBbHJlYWR5RG93bmxvYWRlZCcpXHJcbiAgICAgICAgICAgICYmIChlcnJvci5kb3dubG9hZElkICE9PSB1bmRlZmluZWQpKSB7XHJcbiAgICAgICAgICBpZCA9IGVycm9yLmRvd25sb2FkSWQ7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0Rvd25sb2FkIGZhaWxlZCcsXHJcbiAgICAgICAgICAgIGVycm9yLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgYXBpLmV2ZW50cy5lbWl0KCdzdGFydC1pbnN0YWxsLWRvd25sb2FkJywgaWQsIHRydWUsIChlcnIsIG1vZElkKSA9PiB7XHJcbiAgICAgICAgaWYgKGVyciAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGluc3RhbGwgTFNMaWInLFxyXG4gICAgICAgICAgICBlcnIsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcclxuICAgICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKHByb2ZpbGVJZCwgbW9kSWQsIHRydWUpKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSwgJ2FzaycpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlRG93bmxvYWRMaW5rKGN1cnJlbnRSZWxlYXNlczogYW55W10pIHtcclxuICBjb25zdCBhcmNoaXZlcyA9IGN1cnJlbnRSZWxlYXNlc1swXS5hc3NldHMuZmlsdGVyKGFzc2V0ID0+XHJcbiAgICBhc3NldC5uYW1lLm1hdGNoKC8oRXhwb3J0VG9vbC12WzAtOV0rLlswLTldKy5bMC05XSsuemlwKS9pKSk7XHJcblxyXG4gIGNvbnN0IGRvd25sb2FkTGluayA9IGFyY2hpdmVzWzBdPy5icm93c2VyX2Rvd25sb2FkX3VybDtcclxuICByZXR1cm4gKGRvd25sb2FkTGluayA9PT0gdW5kZWZpbmVkKVxyXG4gICAgPyBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIHJlc29sdmUgYnJvd3NlciBkb3dubG9hZCB1cmwnKSlcclxuICAgIDogUHJvbWlzZS5yZXNvbHZlKGRvd25sb2FkTGluayk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja0ZvclVwZGF0ZXMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gIHJldHVybiBnZXRMYXRlc3RSZWxlYXNlcyhjdXJyZW50VmVyc2lvbilcclxuICAgIC50aGVuKGFzeW5jIGN1cnJlbnRSZWxlYXNlcyA9PiB7XHJcbiAgICAgIGlmIChjdXJyZW50UmVsZWFzZXNbMF0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIC8vIFdlIGZhaWxlZCB0byBjaGVjayBmb3IgdXBkYXRlcyAtIHRoYXQncyB1bmZvcnR1bmF0ZSBidXQgc2hvdWxkbid0XHJcbiAgICAgICAgLy8gIGJlIHJlcG9ydGVkIHRvIHRoZSB1c2VyIGFzIGl0IHdpbGwganVzdCBjb25mdXNlIHRoZW0uXHJcbiAgICAgICAgbG9nKCdlcnJvcicsICdVbmFibGUgdG8gdXBkYXRlIExTTGliJywgJ0ZhaWxlZCB0byBmaW5kIGFueSByZWxlYXNlcycpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudFZlcnNpb24pO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IG1vc3RSZWNlbnRWZXJzaW9uID0gY3VycmVudFJlbGVhc2VzWzBdLnRhZ19uYW1lLnNsaWNlKDEpO1xyXG4gICAgICBjb25zdCBkb3dubG9hZExpbmsgPSBhd2FpdCByZXNvbHZlRG93bmxvYWRMaW5rKGN1cnJlbnRSZWxlYXNlcyk7XHJcbiAgICAgIGlmIChzZW12ZXIudmFsaWQobW9zdFJlY2VudFZlcnNpb24pID09PSBudWxsKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50VmVyc2lvbik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaWYgKHNlbXZlci5ndChtb3N0UmVjZW50VmVyc2lvbiwgY3VycmVudFZlcnNpb24pKSB7XHJcbiAgICAgICAgICByZXR1cm4gbm90aWZ5VXBkYXRlKGFwaSwgbW9zdFJlY2VudFZlcnNpb24sIGN1cnJlbnRWZXJzaW9uKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBzdGFydERvd25sb2FkKGFwaSwgZG93bmxvYWRMaW5rKSlcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKG1vc3RSZWNlbnRWZXJzaW9uKSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudFZlcnNpb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkIHx8IGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50VmVyc2lvbik7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ1VuYWJsZSB0byB1cGRhdGUgTFNMaWInLCBlcnIpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnRWZXJzaW9uKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZG93bmxvYWREaXZpbmUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcclxuICBjb25zdCBnYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcclxuICByZXR1cm4gZ2V0TGF0ZXN0UmVsZWFzZXModW5kZWZpbmVkKVxyXG4gICAgLnRoZW4oYXN5bmMgY3VycmVudFJlbGVhc2VzID0+IHtcclxuICAgICAgY29uc3QgZG93bmxvYWRMaW5rID0gYXdhaXQgcmVzb2x2ZURvd25sb2FkTGluayhjdXJyZW50UmVsZWFzZXMpO1xyXG4gICAgICByZXR1cm4gZG93bmxvYWRDb25zZW50KGFwaSlcclxuICAgICAgICAudGhlbigoKSA9PiBzdGFydERvd25sb2FkKGFwaSwgZG93bmxvYWRMaW5rKSk7XHJcbiAgICB9KVxyXG4gICAgLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCB8fCBlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdVbmFibGUgdG8gZG93bmxvYWQvaW5zdGFsbCBMU0xpYicsIGVycik7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxufVxyXG4iXX0=