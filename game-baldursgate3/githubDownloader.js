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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aHViRG93bmxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdpdGh1YkRvd25sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUErQjtBQUMvQiwwQ0FBNEI7QUFDNUIsK0NBQWlDO0FBQ2pDLHlDQUEyQjtBQUUzQixxQ0FBOEM7QUFHOUMsMkNBQWtFO0FBRWxFLE1BQU0sVUFBVSxHQUFHLDRDQUE0QyxDQUFDO0FBRWhFLFNBQVMsS0FBSyxDQUFDLE9BQWUsRUFBRSxPQUFlO0lBQzdDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckMsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxPQUFPLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQztRQUM5RCxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQW9CLEVBQUUsRUFBRTtZQUM3QyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sVUFBVSxHQUF3QixHQUFHLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzlGLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUN0RCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDckYsSUFBQSxnQkFBRyxFQUFDLE1BQU0sRUFBRSw0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RUFBRSxDQUFDO1FBQ25DLE1BQU0sTUFBTSxHQUFHLHNCQUFTLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzdDLE9BQU8saUJBQWlCLENBQUMsU0FBUyxDQUFDO2FBQ2hDLElBQUksQ0FBQyxDQUFNLGVBQWUsRUFBQyxFQUFFO1lBQzVCLE1BQU0sWUFBWSxHQUFHLE1BQU0sbUJBQW1CLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDaEUsT0FBTyxlQUFlLENBQUMsR0FBRyxDQUFDO2lCQUN4QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQSxDQUFDO2FBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ1gsSUFBSSxHQUFHLFlBQVksaUJBQUksQ0FBQyxZQUFZLElBQUksR0FBRyxZQUFZLGlCQUFJLENBQUMsZUFBZSxFQUFFO2dCQUMzRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUMxQjtpQkFBTTtnQkFDTCxHQUFHLENBQUMscUJBQXFCLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ25FLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQzFCO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQUE7QUFqQkQsd0NBaUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgaHR0cHMgZnJvbSAnaHR0cHMnO1xyXG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xyXG5pbXBvcnQgKiBhcyB1cmwgZnJvbSAndXJsJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIExTTElCX1VSTCB9IGZyb20gJy4vY29tbW9uJztcclxuXHJcbmltcG9ydCB7IEluY29taW5nSHR0cEhlYWRlcnMsIEluY29taW5nTWVzc2FnZSB9IGZyb20gJ2h0dHAnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmNvbnN0IEdJVEhVQl9VUkwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9Ob3JieXRlL2xzbGliJztcclxuXHJcbmZ1bmN0aW9uIHF1ZXJ5KGJhc2VVcmw6IHN0cmluZywgcmVxdWVzdDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgY29uc3QgZ2V0UmVxdWVzdCA9IGdldFJlcXVlc3RPcHRpb25zKGAke2Jhc2VVcmx9LyR7cmVxdWVzdH1gKTtcclxuICAgIGh0dHBzLmdldChnZXRSZXF1ZXN0LCAocmVzOiBJbmNvbWluZ01lc3NhZ2UpID0+IHtcclxuICAgICAgcmVzLnNldEVuY29kaW5nKCd1dGYtOCcpO1xyXG4gICAgICBjb25zdCBtc2dIZWFkZXJzOiBJbmNvbWluZ0h0dHBIZWFkZXJzID0gcmVzLmhlYWRlcnM7XHJcbiAgICAgIGNvbnN0IGNhbGxzUmVtYWluaW5nID0gcGFyc2VJbnQodXRpbC5nZXRTYWZlKG1zZ0hlYWRlcnMsIFsneC1yYXRlbGltaXQtcmVtYWluaW5nJ10sICcwJyksIDEwKTtcclxuICAgICAgaWYgKChyZXMuc3RhdHVzQ29kZSA9PT0gNDAzKSAmJiAoY2FsbHNSZW1haW5pbmcgPT09IDApKSB7XHJcbiAgICAgICAgY29uc3QgcmVzZXREYXRlID0gcGFyc2VJbnQodXRpbC5nZXRTYWZlKG1zZ0hlYWRlcnMsIFsneC1yYXRlbGltaXQtcmVzZXQnXSwgJzAnKSwgMTApO1xyXG4gICAgICAgIGxvZygnaW5mbycsICdHaXRIdWIgcmF0ZSBsaW1pdCBleGNlZWRlZCcsXHJcbiAgICAgICAgICB7IHJlc2V0X2F0OiAobmV3IERhdGUocmVzZXREYXRlKSkudG9TdHJpbmcoKSB9KTtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2l0SHViIHJhdGUgbGltaXQgZXhjZWVkZWQnKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGxldCBvdXRwdXQ6IHN0cmluZyA9ICcnO1xyXG4gICAgICByZXNcclxuICAgICAgICAub24oJ2RhdGEnLCBkYXRhID0+IG91dHB1dCArPSBkYXRhKVxyXG4gICAgICAgIC5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoSlNPTi5wYXJzZShvdXRwdXQpKTtcclxuICAgICAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZWplY3QocGFyc2VFcnIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxuICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xyXG4gICAgICB9KVxyXG4gICAgICAuZW5kKCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFJlcXVlc3RPcHRpb25zKGxpbmspIHtcclxuICBjb25zdCByZWxVcmwgPSB1cmwucGFyc2UobGluayk7XHJcbiAgcmV0dXJuICh7XHJcbiAgICAuLi5fLnBpY2socmVsVXJsLCBbJ3BvcnQnLCAnaG9zdG5hbWUnLCAncGF0aCddKSxcclxuICAgIGhlYWRlcnM6IHtcclxuICAgICAgJ1VzZXItQWdlbnQnOiAnVm9ydGV4JyxcclxuICAgIH0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkQ29uc2VudChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICByZXR1cm4gYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0RpdmluZSB0b29sIGlzIG1pc3NpbmcnLCB7XHJcbiAgICBiYmNvZGU6IGFwaS50cmFuc2xhdGUoJ0JhbGR1clxcJ3MgR2F0ZSAzXFwncyBtb2RkaW5nIHBhdHRlcm4gaW4gbW9zdCAoaWYgbm90IGFsbCkgY2FzZXMgd2lsbCByZXF1aXJlIGEgM3JkICdcclxuICAgICAgKyAncGFydHkgdG9vbCBuYW1lZCBcInt7bmFtZX19XCIgdG8gbWFuaXB1bGF0ZSBnYW1lIGZpbGVzLlticl1bL2JyXVticl1bL2JyXSdcclxuICAgICAgKyAnVm9ydGV4IGNhbiBkb3dubG9hZCBhbmQgaW5zdGFsbCB0aGlzIHRvb2wgZm9yIHlvdSBhcyBhIG1vZCBlbnRyeS4gUGxlYXNlIGVuc3VyZSB0aGF0IHRoZSAnXHJcbiAgICAgICsgJ3Rvb2wgaXMgYWx3YXlzIGVuYWJsZWQgYW5kIGRlcGxveWVkIG9uIHRoZSBtb2RzIHBhZ2UuW2JyXVsvYnJdW2JyXVsvYnJdJ1xyXG4gICAgICArICdQbGVhc2Ugbm90ZSB0aGF0IHNvbWUgQW50aS1WaXJ1cyBzb2Z0d2FyZSBtYXkgZmxhZyB0aGlzIHRvb2wgYXMgbWFsaWNpb3VzIGR1ZSAnXHJcbiAgICAgICsgJ3RvIHRoZSBuYXR1cmUgb2YgdGhlIHRvb2wgKHVucGFja3MgLnBhayBmaWxlcykuIFdlIHN1Z2dlc3QgeW91IGVuc3VyZSB0aGF0ICdcclxuICAgICAgKyAneW91ciBzZWN1cml0eSBzb2Z0d2FyZSBpcyBjb25maWd1cmVkIHRvIGFsbG93IHRoaXMgdG9vbCB0byBpbnN0YWxsLicsIHsgcmVwbGFjZTogeyBuYW1lOiAnTFNMaWInIH0gfSksXHJcbiAgfSwgW1xyXG4gICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcclxuICAgIHsgbGFiZWw6ICdEb3dubG9hZCcgfSxcclxuICBdKVxyXG4gIC50aGVuKHJlc3VsdCA9PiAocmVzdWx0LmFjdGlvbiA9PT0gJ0NhbmNlbCcpXHJcbiAgICA/IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpKVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUoKSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIG5vdGlmeVVwZGF0ZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGxhdGVzdDogc3RyaW5nLCBjdXJyZW50OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBnYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGFwaS5zdG9yZS5nZXRTdGF0ZSgpKTtcclxuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICB0eXBlOiAnaW5mbycsXHJcbiAgICAgIGlkOiBgZGl2aW5lLXVwZGF0ZWAsXHJcbiAgICAgIG5vRGlzbWlzczogdHJ1ZSxcclxuICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcclxuICAgICAgdGl0bGU6ICdVcGRhdGUgZm9yIHt7bmFtZX19JyxcclxuICAgICAgbWVzc2FnZTogJ0xhdGVzdDoge3tsYXRlc3R9fSwgSW5zdGFsbGVkOiB7e2N1cnJlbnR9fScsXHJcbiAgICAgIHJlcGxhY2U6IHtcclxuICAgICAgICBsYXRlc3QsXHJcbiAgICAgICAgY3VycmVudCxcclxuICAgICAgfSxcclxuICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgIHsgdGl0bGUgOiAnTW9yZScsIGFjdGlvbjogKGRpc21pc3M6ICgpID0+IHZvaWQpID0+IHtcclxuICAgICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAne3tuYW1lfX0gVXBkYXRlJywge1xyXG4gICAgICAgICAgICAgIHRleHQ6ICdWb3J0ZXggaGFzIGRldGVjdGVkIGEgbmV3ZXIgdmVyc2lvbiBvZiB7e25hbWV9fSAoe3tsYXRlc3R9fSkgYXZhaWxhYmxlIHRvIGRvd25sb2FkIGZyb20ge3t3ZWJzaXRlfX0uIFlvdSBjdXJyZW50bHkgaGF2ZSB2ZXJzaW9uIHt7Y3VycmVudH19IGluc3RhbGxlZC4nXHJcbiAgICAgICAgICAgICAgKyAnXFxuVm9ydGV4IGNhbiBkb3dubG9hZCBhbmQgYXR0ZW1wdCB0byBpbnN0YWxsIHRoZSBuZXcgdXBkYXRlIGZvciB5b3UuJyxcclxuICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnTFNMaWIvRGl2aW5lIFRvb2wnLFxyXG4gICAgICAgICAgICAgICAgd2Vic2l0ZTogTFNMSUJfVVJMLFxyXG4gICAgICAgICAgICAgICAgbGF0ZXN0LFxyXG4gICAgICAgICAgICAgICAgY3VycmVudCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LCBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnRG93bmxvYWQnLFxyXG4gICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlzbWlzcygpO1xyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBdKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICB0aXRsZTogJ0Rpc21pc3MnLFxyXG4gICAgICAgICAgYWN0aW9uOiAoZGlzbWlzcykgPT4ge1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TGF0ZXN0UmVsZWFzZXMoY3VycmVudFZlcnNpb246IHN0cmluZykge1xyXG4gIGlmIChHSVRIVUJfVVJMKSB7XHJcbiAgICByZXR1cm4gcXVlcnkoR0lUSFVCX1VSTCwgJ3JlbGVhc2VzJylcclxuICAgIC50aGVuKChyZWxlYXNlcykgPT4ge1xyXG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkocmVsZWFzZXMpKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdleHBlY3RlZCBhcnJheSBvZiBnaXRodWIgcmVsZWFzZXMnKSk7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgY3VycmVudCA9IHJlbGVhc2VzXHJcbiAgICAgICAgLmZpbHRlcihyZWwgPT4ge1xyXG4gICAgICAgICAgY29uc3QgdGFnTmFtZSA9IHV0aWwuZ2V0U2FmZShyZWwsIFsndGFnX25hbWUnXSwgdW5kZWZpbmVkKTtcclxuICAgICAgICAgIGNvbnN0IGlzUHJlUmVsZWFzZSA9IHV0aWwuZ2V0U2FmZShyZWwsIFsncHJlcmVsZWFzZSddLCBmYWxzZSk7XHJcbiAgICAgICAgICBjb25zdCB2ZXJzaW9uID0gc2VtdmVyLnZhbGlkKHRhZ05hbWUpO1xyXG5cclxuICAgICAgICAgIHJldHVybiAoIWlzUHJlUmVsZWFzZVxyXG4gICAgICAgICAgICAmJiAodmVyc2lvbiAhPT0gbnVsbClcclxuICAgICAgICAgICAgJiYgKChjdXJyZW50VmVyc2lvbiA9PT0gdW5kZWZpbmVkKSB8fCAoc2VtdmVyLmd0ZSh2ZXJzaW9uLCBjdXJyZW50VmVyc2lvbikpKSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IHNlbXZlci5jb21wYXJlKHJocy50YWdfbmFtZSwgbGhzLnRhZ19uYW1lKSk7XHJcblxyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnQpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzdGFydERvd25sb2FkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZG93bmxvYWRMaW5rOiBzdHJpbmcpIHtcclxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXNoYWRvd2VkLXZhcmlhYmxlIC0gd2h5IGlzIHRoaXMgZXZlbiByZXF1aXJlZCA/XHJcbiAgY29uc3QgcmVkaXJlY3Rpb25VUkwgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICBodHRwcy5yZXF1ZXN0KGdldFJlcXVlc3RPcHRpb25zKGRvd25sb2FkTGluayksIHJlcyA9PiB7XHJcbiAgICAgIHJldHVybiByZXNvbHZlKHJlcy5oZWFkZXJzWydsb2NhdGlvbiddKTtcclxuICAgIH0pXHJcbiAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXHJcbiAgICAgIC5lbmQoKTtcclxuICB9KTtcclxuICBjb25zdCBkbEluZm8gPSB7XHJcbiAgICBnYW1lOiBHQU1FX0lELFxyXG4gICAgbmFtZTogJ0xTTGliL0RpdmluZSBUb29sJyxcclxuICB9O1xyXG4gIGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtZG93bmxvYWQnLCBbcmVkaXJlY3Rpb25VUkxdLCBkbEluZm8sIHVuZGVmaW5lZCxcclxuICAgIChlcnJvciwgaWQpID0+IHtcclxuICAgICAgaWYgKGVycm9yICE9PSBudWxsKSB7XHJcbiAgICAgICAgaWYgKChlcnJvci5uYW1lID09PSAnQWxyZWFkeURvd25sb2FkZWQnKVxyXG4gICAgICAgICAgICAmJiAoZXJyb3IuZG93bmxvYWRJZCAhPT0gdW5kZWZpbmVkKSkge1xyXG4gICAgICAgICAgaWQgPSBlcnJvci5kb3dubG9hZElkO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdEb3dubG9hZCBmYWlsZWQnLFxyXG4gICAgICAgICAgICBlcnJvciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtaW5zdGFsbC1kb3dubG9hZCcsIGlkLCB0cnVlLCAoZXJyLCBtb2RJZCkgPT4ge1xyXG4gICAgICAgIGlmIChlcnIgIT09IG51bGwpIHtcclxuICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBpbnN0YWxsIExTTGliJyxcclxuICAgICAgICAgICAgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kRW5hYmxlZChwcm9maWxlSWQsIG1vZElkLCB0cnVlKSk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9KTtcclxuICAgIH0sICdhc2snKTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZURvd25sb2FkTGluayhjdXJyZW50UmVsZWFzZXM6IGFueVtdKSB7XHJcbiAgY29uc3QgYXJjaGl2ZXMgPSBjdXJyZW50UmVsZWFzZXNbMF0uYXNzZXRzLmZpbHRlcihhc3NldCA9PlxyXG4gICAgYXNzZXQubmFtZS5tYXRjaCgvKEV4cG9ydFRvb2wtdlswLTldKy5bMC05XSsuWzAtOV0rLnppcCkvaSkpO1xyXG5cclxuICBjb25zdCBkb3dubG9hZExpbmsgPSBhcmNoaXZlc1swXT8uYnJvd3Nlcl9kb3dubG9hZF91cmw7XHJcbiAgcmV0dXJuIChkb3dubG9hZExpbmsgPT09IHVuZGVmaW5lZClcclxuICAgID8gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ZhaWxlZCB0byByZXNvbHZlIGJyb3dzZXIgZG93bmxvYWQgdXJsJykpXHJcbiAgICA6IFByb21pc2UucmVzb2x2ZShkb3dubG9hZExpbmspO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tGb3JVcGRhdGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmVyc2lvbjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICByZXR1cm4gZ2V0TGF0ZXN0UmVsZWFzZXMoY3VycmVudFZlcnNpb24pXHJcbiAgICAudGhlbihhc3luYyBjdXJyZW50UmVsZWFzZXMgPT4ge1xyXG4gICAgICBjb25zdCBtb3N0UmVjZW50VmVyc2lvbiA9IGN1cnJlbnRSZWxlYXNlc1swXS50YWdfbmFtZS5zbGljZSgxKTtcclxuICAgICAgY29uc3QgZG93bmxvYWRMaW5rID0gYXdhaXQgcmVzb2x2ZURvd25sb2FkTGluayhjdXJyZW50UmVsZWFzZXMpO1xyXG4gICAgICBpZiAoc2VtdmVyLnZhbGlkKG1vc3RSZWNlbnRWZXJzaW9uKSA9PT0gbnVsbCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudFZlcnNpb24pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChzZW12ZXIuZ3QobW9zdFJlY2VudFZlcnNpb24sIGN1cnJlbnRWZXJzaW9uKSkge1xyXG4gICAgICAgICAgcmV0dXJuIG5vdGlmeVVwZGF0ZShhcGksIG1vc3RSZWNlbnRWZXJzaW9uLCBjdXJyZW50VmVyc2lvbilcclxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gc3RhcnREb3dubG9hZChhcGksIGRvd25sb2FkTGluaykpXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShtb3N0UmVjZW50VmVyc2lvbikpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnRWZXJzaW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCB8fCBlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudFZlcnNpb24pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdVbmFibGUgdG8gdXBkYXRlIExTTGliJywgZXJyKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50VmVyc2lvbik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkRGl2aW5lKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZ2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgcmV0dXJuIGdldExhdGVzdFJlbGVhc2VzKHVuZGVmaW5lZClcclxuICAgIC50aGVuKGFzeW5jIGN1cnJlbnRSZWxlYXNlcyA9PiB7XHJcbiAgICAgIGNvbnN0IGRvd25sb2FkTGluayA9IGF3YWl0IHJlc29sdmVEb3dubG9hZExpbmsoY3VycmVudFJlbGVhc2VzKTtcclxuICAgICAgcmV0dXJuIGRvd25sb2FkQ29uc2VudChhcGkpXHJcbiAgICAgICAgLnRoZW4oKCkgPT4gc3RhcnREb3dubG9hZChhcGksIGRvd25sb2FkTGluaykpO1xyXG4gICAgfSlcclxuICAgIC5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQgfHwgZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignVW5hYmxlIHRvIGRvd25sb2FkL2luc3RhbGwgTFNMaWInLCBlcnIpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuIl19