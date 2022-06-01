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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aHViRG93bmxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdpdGh1YkRvd25sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUErQjtBQUMvQiwwQ0FBNEI7QUFDNUIsK0NBQWlDO0FBQ2pDLHlDQUEyQjtBQUUzQixxQ0FBOEM7QUFHOUMsMkNBQWtFO0FBRWxFLE1BQU0sVUFBVSxHQUFHLDRDQUE0QyxDQUFDO0FBRWhFLFNBQVMsS0FBSyxDQUFDLE9BQWUsRUFBRSxPQUFlO0lBQzdDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckMsTUFBTSxVQUFVLEdBQUcsaUJBQWlCLENBQUMsR0FBRyxPQUFPLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQztRQUM5RCxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQW9CLEVBQUUsRUFBRTtZQUM3QyxHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sVUFBVSxHQUF3QixHQUFHLENBQUMsT0FBTyxDQUFDO1lBQ3BELE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzlGLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUN0RCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDckYsSUFBQSxnQkFBRyxFQUFDLE1BQU0sRUFBRSw0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TyxPQUFPLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUFBO0FBL0JELDBDQStCQztBQUVELFNBQXNCLGNBQWMsQ0FBQyxHQUF3Qjs7UUFDM0QsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuQyxNQUFNLE1BQU0sR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM3QyxPQUFPLGlCQUFpQixDQUFDLFNBQVMsQ0FBQzthQUNoQyxJQUFJLENBQUMsQ0FBTSxlQUFlLEVBQUMsRUFBRTtZQUM1QixNQUFNLFlBQVksR0FBRyxNQUFNLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sZUFBZSxDQUFDLEdBQUcsQ0FBQztpQkFDeEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUEsQ0FBQzthQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUNYLElBQUksR0FBRyxZQUFZLGlCQUFJLENBQUMsWUFBWSxJQUFJLEdBQUcsWUFBWSxpQkFBSSxDQUFDLGVBQWUsRUFBRTtnQkFDM0UsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDMUI7aUJBQU07Z0JBQ0wsR0FBRyxDQUFDLHFCQUFxQixDQUFDLGtDQUFrQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNuRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUMxQjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUFBO0FBakJELHdDQWlCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcclxuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0ICogYXMgdXJsIGZyb20gJ3VybCc7XHJcblxyXG5pbXBvcnQgeyBHQU1FX0lELCBMU0xJQl9VUkwgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBJbmNvbWluZ0h0dHBIZWFkZXJzLCBJbmNvbWluZ01lc3NhZ2UgfSBmcm9tICdodHRwJztcclxuaW1wb3J0IHsgYWN0aW9ucywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5jb25zdCBHSVRIVUJfVVJMID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvTm9yYnl0ZS9sc2xpYic7XHJcblxyXG5mdW5jdGlvbiBxdWVyeShiYXNlVXJsOiBzdHJpbmcsIHJlcXVlc3Q6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGNvbnN0IGdldFJlcXVlc3QgPSBnZXRSZXF1ZXN0T3B0aW9ucyhgJHtiYXNlVXJsfS8ke3JlcXVlc3R9YCk7XHJcbiAgICBodHRwcy5nZXQoZ2V0UmVxdWVzdCwgKHJlczogSW5jb21pbmdNZXNzYWdlKSA9PiB7XHJcbiAgICAgIHJlcy5zZXRFbmNvZGluZygndXRmLTgnKTtcclxuICAgICAgY29uc3QgbXNnSGVhZGVyczogSW5jb21pbmdIdHRwSGVhZGVycyA9IHJlcy5oZWFkZXJzO1xyXG4gICAgICBjb25zdCBjYWxsc1JlbWFpbmluZyA9IHBhcnNlSW50KHV0aWwuZ2V0U2FmZShtc2dIZWFkZXJzLCBbJ3gtcmF0ZWxpbWl0LXJlbWFpbmluZyddLCAnMCcpLCAxMCk7XHJcbiAgICAgIGlmICgocmVzLnN0YXR1c0NvZGUgPT09IDQwMykgJiYgKGNhbGxzUmVtYWluaW5nID09PSAwKSkge1xyXG4gICAgICAgIGNvbnN0IHJlc2V0RGF0ZSA9IHBhcnNlSW50KHV0aWwuZ2V0U2FmZShtc2dIZWFkZXJzLCBbJ3gtcmF0ZWxpbWl0LXJlc2V0J10sICcwJyksIDEwKTtcclxuICAgICAgICBsb2coJ2luZm8nLCAnR2l0SHViIHJhdGUgbGltaXQgZXhjZWVkZWQnLFxyXG4gICAgICAgICAgeyByZXNldF9hdDogKG5ldyBEYXRlKHJlc2V0RGF0ZSkpLnRvU3RyaW5nKCkgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJykpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBsZXQgb3V0cHV0OiBzdHJpbmcgPSAnJztcclxuICAgICAgcmVzXHJcbiAgICAgICAgLm9uKCdkYXRhJywgZGF0YSA9PiBvdXRwdXQgKz0gZGF0YSlcclxuICAgICAgICAub24oJ2VuZCcsICgpID0+IHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKEpTT04ucGFyc2Uob3V0cHV0KSk7XHJcbiAgICAgICAgICB9IGNhdGNoIChwYXJzZUVycikge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KHBhcnNlRXJyKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pXHJcbiAgICAgIC5vbignZXJyb3InLCBlcnIgPT4ge1xyXG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgICAgfSlcclxuICAgICAgLmVuZCgpO1xyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRSZXF1ZXN0T3B0aW9ucyhsaW5rKSB7XHJcbiAgY29uc3QgcmVsVXJsID0gdXJsLnBhcnNlKGxpbmspO1xyXG4gIHJldHVybiAoe1xyXG4gICAgLi4uXy5waWNrKHJlbFVybCwgWydwb3J0JywgJ2hvc3RuYW1lJywgJ3BhdGgnXSksXHJcbiAgICBoZWFkZXJzOiB7XHJcbiAgICAgICdVc2VyLUFnZW50JzogJ1ZvcnRleCcsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBkb3dubG9hZENvbnNlbnQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgcmV0dXJuIGFwaS5zaG93RGlhbG9nKCdlcnJvcicsICdEaXZpbmUgdG9vbCBpcyBtaXNzaW5nJywge1xyXG4gICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdCYWxkdXJcXCdzIEdhdGUgM1xcJ3MgbW9kZGluZyBwYXR0ZXJuIGluIG1vc3QgKGlmIG5vdCBhbGwpIGNhc2VzIHdpbGwgcmVxdWlyZSBhIDNyZCAnXHJcbiAgICAgICsgJ3BhcnR5IHRvb2wgbmFtZWQgXCJ7e25hbWV9fVwiIHRvIG1hbmlwdWxhdGUgZ2FtZSBmaWxlcy5bYnJdWy9icl1bYnJdWy9icl0nXHJcbiAgICAgICsgJ1ZvcnRleCBjYW4gZG93bmxvYWQgYW5kIGluc3RhbGwgdGhpcyB0b29sIGZvciB5b3UgYXMgYSBtb2QgZW50cnkuIFBsZWFzZSBlbnN1cmUgdGhhdCB0aGUgJ1xyXG4gICAgICArICd0b29sIGlzIGFsd2F5cyBlbmFibGVkIGFuZCBkZXBsb3llZCBvbiB0aGUgbW9kcyBwYWdlLlticl1bL2JyXVticl1bL2JyXSdcclxuICAgICAgKyAnUGxlYXNlIG5vdGUgdGhhdCBzb21lIEFudGktVmlydXMgc29mdHdhcmUgbWF5IGZsYWcgdGhpcyB0b29sIGFzIG1hbGljaW91cyBkdWUgJ1xyXG4gICAgICArICd0byB0aGUgbmF0dXJlIG9mIHRoZSB0b29sICh1bnBhY2tzIC5wYWsgZmlsZXMpLiBXZSBzdWdnZXN0IHlvdSBlbnN1cmUgdGhhdCAnXHJcbiAgICAgICsgJ3lvdXIgc2VjdXJpdHkgc29mdHdhcmUgaXMgY29uZmlndXJlZCB0byBhbGxvdyB0aGlzIHRvb2wgdG8gaW5zdGFsbC4nLCB7IHJlcGxhY2U6IHsgbmFtZTogJ0xTTGliJyB9IH0pLFxyXG4gIH0sIFtcclxuICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICB7IGxhYmVsOiAnRG93bmxvYWQnIH0sXHJcbiAgXSlcclxuICAudGhlbihyZXN1bHQgPT4gKHJlc3VsdC5hY3Rpb24gPT09ICdDYW5jZWwnKVxyXG4gICAgPyBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSlcclxuICAgIDogUHJvbWlzZS5yZXNvbHZlKCkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBub3RpZnlVcGRhdGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBsYXRlc3Q6IHN0cmluZywgY3VycmVudDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgZ2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChhcGkuc3RvcmUuZ2V0U3RhdGUoKSk7XHJcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgdHlwZTogJ2luZm8nLFxyXG4gICAgICBpZDogYGRpdmluZS11cGRhdGVgLFxyXG4gICAgICBub0Rpc21pc3M6IHRydWUsXHJcbiAgICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXHJcbiAgICAgIHRpdGxlOiAnVXBkYXRlIGZvciB7e25hbWV9fScsXHJcbiAgICAgIG1lc3NhZ2U6ICdMYXRlc3Q6IHt7bGF0ZXN0fX0sIEluc3RhbGxlZDoge3tjdXJyZW50fX0nLFxyXG4gICAgICByZXBsYWNlOiB7XHJcbiAgICAgICAgbGF0ZXN0LFxyXG4gICAgICAgIGN1cnJlbnQsXHJcbiAgICAgIH0sXHJcbiAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICB7IHRpdGxlIDogJ01vcmUnLCBhY3Rpb246IChkaXNtaXNzOiAoKSA9PiB2b2lkKSA9PiB7XHJcbiAgICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ3t7bmFtZX19IFVwZGF0ZScsIHtcclxuICAgICAgICAgICAgICB0ZXh0OiAnVm9ydGV4IGhhcyBkZXRlY3RlZCBhIG5ld2VyIHZlcnNpb24gb2Yge3tuYW1lfX0gKHt7bGF0ZXN0fX0pIGF2YWlsYWJsZSB0byBkb3dubG9hZCBmcm9tIHt7d2Vic2l0ZX19LiBZb3UgY3VycmVudGx5IGhhdmUgdmVyc2lvbiB7e2N1cnJlbnR9fSBpbnN0YWxsZWQuJ1xyXG4gICAgICAgICAgICAgICsgJ1xcblZvcnRleCBjYW4gZG93bmxvYWQgYW5kIGF0dGVtcHQgdG8gaW5zdGFsbCB0aGUgbmV3IHVwZGF0ZSBmb3IgeW91LicsXHJcbiAgICAgICAgICAgICAgcGFyYW1ldGVyczoge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ0xTTGliL0RpdmluZSBUb29sJyxcclxuICAgICAgICAgICAgICAgIHdlYnNpdGU6IExTTElCX1VSTCxcclxuICAgICAgICAgICAgICAgIGxhdGVzdCxcclxuICAgICAgICAgICAgICAgIGN1cnJlbnQsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSwgW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICBsYWJlbDogJ0Rvd25sb2FkJyxcclxuICAgICAgICAgICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc21pc3MoKTtcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgdGl0bGU6ICdEaXNtaXNzJyxcclxuICAgICAgICAgIGFjdGlvbjogKGRpc21pc3MpID0+IHtcclxuICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICBkaXNtaXNzKCk7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldExhdGVzdFJlbGVhc2VzKGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcpIHtcclxuICBpZiAoR0lUSFVCX1VSTCkge1xyXG4gICAgcmV0dXJuIHF1ZXJ5KEdJVEhVQl9VUkwsICdyZWxlYXNlcycpXHJcbiAgICAudGhlbigocmVsZWFzZXMpID0+IHtcclxuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlbGVhc2VzKSkge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnZXhwZWN0ZWQgYXJyYXkgb2YgZ2l0aHViIHJlbGVhc2VzJykpO1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSByZWxlYXNlc1xyXG4gICAgICAgIC5maWx0ZXIocmVsID0+IHtcclxuICAgICAgICAgIGNvbnN0IHRhZ05hbWUgPSB1dGlsLmdldFNhZmUocmVsLCBbJ3RhZ19uYW1lJ10sIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICBjb25zdCBpc1ByZVJlbGVhc2UgPSB1dGlsLmdldFNhZmUocmVsLCBbJ3ByZXJlbGVhc2UnXSwgZmFsc2UpO1xyXG4gICAgICAgICAgY29uc3QgdmVyc2lvbiA9IHNlbXZlci52YWxpZCh0YWdOYW1lKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4gKCFpc1ByZVJlbGVhc2VcclxuICAgICAgICAgICAgJiYgKHZlcnNpb24gIT09IG51bGwpXHJcbiAgICAgICAgICAgICYmICgoY3VycmVudFZlcnNpb24gPT09IHVuZGVmaW5lZCkgfHwgKHNlbXZlci5ndGUodmVyc2lvbiwgY3VycmVudFZlcnNpb24pKSkpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXIuY29tcGFyZShyaHMudGFnX25hbWUsIGxocy50YWdfbmFtZSkpO1xyXG5cclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50KTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc3RhcnREb3dubG9hZChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGRvd25sb2FkTGluazogc3RyaW5nKSB7XHJcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1zaGFkb3dlZC12YXJpYWJsZSAtIHdoeSBpcyB0aGlzIGV2ZW4gcmVxdWlyZWQgP1xyXG4gIGNvbnN0IHJlZGlyZWN0aW9uVVJMID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgaHR0cHMucmVxdWVzdChnZXRSZXF1ZXN0T3B0aW9ucyhkb3dubG9hZExpbmspLCByZXMgPT4ge1xyXG4gICAgICByZXR1cm4gcmVzb2x2ZShyZXMuaGVhZGVyc1snbG9jYXRpb24nXSk7XHJcbiAgICB9KVxyXG4gICAgICAub24oJ2Vycm9yJywgZXJyID0+IHJlamVjdChlcnIpKVxyXG4gICAgICAuZW5kKCk7XHJcbiAgfSk7XHJcbiAgY29uc3QgZGxJbmZvID0ge1xyXG4gICAgZ2FtZTogR0FNRV9JRCxcclxuICAgIG5hbWU6ICdMU0xpYi9EaXZpbmUgVG9vbCcsXHJcbiAgfTtcclxuICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWRvd25sb2FkJywgW3JlZGlyZWN0aW9uVVJMXSwgZGxJbmZvLCB1bmRlZmluZWQsXHJcbiAgICAoZXJyb3IsIGlkKSA9PiB7XHJcbiAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xyXG4gICAgICAgIGlmICgoZXJyb3IubmFtZSA9PT0gJ0FscmVhZHlEb3dubG9hZGVkJylcclxuICAgICAgICAgICAgJiYgKGVycm9yLmRvd25sb2FkSWQgIT09IHVuZGVmaW5lZCkpIHtcclxuICAgICAgICAgIGlkID0gZXJyb3IuZG93bmxvYWRJZDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRG93bmxvYWQgZmFpbGVkJyxcclxuICAgICAgICAgICAgZXJyb3IsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWluc3RhbGwtZG93bmxvYWQnLCBpZCwgdHJ1ZSwgKGVyciwgbW9kSWQpID0+IHtcclxuICAgICAgICBpZiAoZXJyICE9PSBudWxsKSB7XHJcbiAgICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gaW5zdGFsbCBMU0xpYicsXHJcbiAgICAgICAgICAgIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQocHJvZmlsZUlkLCBtb2RJZCwgdHJ1ZSkpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICAgICAgfSk7XHJcbiAgICB9LCAnYXNrJyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVEb3dubG9hZExpbmsoY3VycmVudFJlbGVhc2VzOiBhbnlbXSkge1xyXG4gIGNvbnN0IGFyY2hpdmVzID0gY3VycmVudFJlbGVhc2VzWzBdLmFzc2V0cy5maWx0ZXIoYXNzZXQgPT5cclxuICAgIGFzc2V0Lm5hbWUubWF0Y2goLyhFeHBvcnRUb29sLXZbMC05XSsuWzAtOV0rLlswLTldKy56aXApL2kpKTtcclxuXHJcbiAgY29uc3QgZG93bmxvYWRMaW5rID0gYXJjaGl2ZXNbMF0/LmJyb3dzZXJfZG93bmxvYWRfdXJsO1xyXG4gIHJldHVybiAoZG93bmxvYWRMaW5rID09PSB1bmRlZmluZWQpXHJcbiAgICA/IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdGYWlsZWQgdG8gcmVzb2x2ZSBicm93c2VyIGRvd25sb2FkIHVybCcpKVxyXG4gICAgOiBQcm9taXNlLnJlc29sdmUoZG93bmxvYWRMaW5rKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrRm9yVXBkYXRlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZlcnNpb246IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgcmV0dXJuIGdldExhdGVzdFJlbGVhc2VzKGN1cnJlbnRWZXJzaW9uKVxyXG4gICAgLnRoZW4oYXN5bmMgY3VycmVudFJlbGVhc2VzID0+IHtcclxuICAgICAgaWYgKGN1cnJlbnRSZWxlYXNlc1swXSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgLy8gV2UgZmFpbGVkIHRvIGNoZWNrIGZvciB1cGRhdGVzIC0gdGhhdCdzIHVuZm9ydHVuYXRlIGJ1dCBzaG91bGRuJ3RcclxuICAgICAgICAvLyAgYmUgcmVwb3J0ZWQgdG8gdGhlIHVzZXIgYXMgaXQgd2lsbCBqdXN0IGNvbmZ1c2UgdGhlbS5cclxuICAgICAgICBsb2coJ2Vycm9yJywgJ1VuYWJsZSB0byB1cGRhdGUgTFNMaWInLCAnRmFpbGVkIHRvIGZpbmQgYW55IHJlbGVhc2VzJyk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50VmVyc2lvbik7XHJcbiAgICAgIH1cclxuICAgICAgY29uc3QgbW9zdFJlY2VudFZlcnNpb24gPSBjdXJyZW50UmVsZWFzZXNbMF0udGFnX25hbWUuc2xpY2UoMSk7XHJcbiAgICAgIGNvbnN0IGRvd25sb2FkTGluayA9IGF3YWl0IHJlc29sdmVEb3dubG9hZExpbmsoY3VycmVudFJlbGVhc2VzKTtcclxuICAgICAgaWYgKHNlbXZlci52YWxpZChtb3N0UmVjZW50VmVyc2lvbikgPT09IG51bGwpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnRWZXJzaW9uKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZiAoc2VtdmVyLmd0KG1vc3RSZWNlbnRWZXJzaW9uLCBjdXJyZW50VmVyc2lvbikpIHtcclxuICAgICAgICAgIHJldHVybiBub3RpZnlVcGRhdGUoYXBpLCBtb3N0UmVjZW50VmVyc2lvbiwgY3VycmVudFZlcnNpb24pXHJcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHN0YXJ0RG93bmxvYWQoYXBpLCBkb3dubG9hZExpbmspKVxyXG4gICAgICAgICAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUobW9zdFJlY2VudFZlcnNpb24pKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50VmVyc2lvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQgfHwgZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnRWZXJzaW9uKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignVW5hYmxlIHRvIHVwZGF0ZSBMU0xpYicsIGVycik7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudFZlcnNpb24pO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZERpdmluZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xyXG4gIHJldHVybiBnZXRMYXRlc3RSZWxlYXNlcyh1bmRlZmluZWQpXHJcbiAgICAudGhlbihhc3luYyBjdXJyZW50UmVsZWFzZXMgPT4ge1xyXG4gICAgICBjb25zdCBkb3dubG9hZExpbmsgPSBhd2FpdCByZXNvbHZlRG93bmxvYWRMaW5rKGN1cnJlbnRSZWxlYXNlcyk7XHJcbiAgICAgIHJldHVybiBkb3dubG9hZENvbnNlbnQoYXBpKVxyXG4gICAgICAgIC50aGVuKCgpID0+IHN0YXJ0RG93bmxvYWQoYXBpLCBkb3dubG9hZExpbmspKTtcclxuICAgIH0pXHJcbiAgICAuY2F0Y2goZXJyID0+IHtcclxuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkIHx8IGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ1VuYWJsZSB0byBkb3dubG9hZC9pbnN0YWxsIExTTGliJywgZXJyKTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcbiJdfQ==