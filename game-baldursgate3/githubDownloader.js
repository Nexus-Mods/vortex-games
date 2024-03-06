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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aHViRG93bmxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdpdGh1YkRvd25sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IsMENBQTRCO0FBQzVCLCtDQUFpQztBQUNqQyx5Q0FBMkI7QUFFM0IscUNBQThDO0FBRzlDLDJDQUFrRTtBQUVsRSxNQUFNLFVBQVUsR0FBRyw0Q0FBNEMsQ0FBQztBQUVoRSxTQUFTLEtBQUssQ0FBQyxPQUFlLEVBQUUsT0FBZTtJQUM3QyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDLEdBQUcsT0FBTyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDOUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFvQixFQUFFLEVBQUU7WUFDN0MsR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QixNQUFNLFVBQVUsR0FBd0IsR0FBRyxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM5RixJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDdEQsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGlCQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3JGLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVB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LE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUN6QyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FBQTtBQS9CRCwwQ0ErQkM7QUFFRCxTQUFzQixjQUFjLENBQUMsR0FBd0I7O1FBQzNELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkMsTUFBTSxNQUFNLEdBQUcsc0JBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0MsT0FBTyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7YUFDaEMsSUFBSSxDQUFDLENBQU0sZUFBZSxFQUFDLEVBQUU7WUFDNUIsTUFBTSxZQUFZLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNoRSxPQUFPLGVBQWUsQ0FBQyxHQUFHLENBQUM7aUJBQ3hCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFBLENBQUM7YUFDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDWCxJQUFJLEdBQUcsWUFBWSxpQkFBSSxDQUFDLFlBQVksSUFBSSxHQUFHLFlBQVksaUJBQUksQ0FBQyxlQUFlLEVBQUU7Z0JBQzNFLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQzFCO2lCQUFNO2dCQUNMLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbkUsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDMUI7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FBQTtBQWpCRCx3Q0FpQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCAqIGFzIHVybCBmcm9tICd1cmwnO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBMU0xJQl9VUkwgfSBmcm9tICcuL2NvbW1vbic7XG5cbmltcG9ydCB7IEluY29taW5nSHR0cEhlYWRlcnMsIEluY29taW5nTWVzc2FnZSB9IGZyb20gJ2h0dHAnO1xuaW1wb3J0IHsgYWN0aW9ucywgbG9nLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmNvbnN0IEdJVEhVQl9VUkwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9Ob3JieXRlL2xzbGliJztcblxuZnVuY3Rpb24gcXVlcnkoYmFzZVVybDogc3RyaW5nLCByZXF1ZXN0OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGdldFJlcXVlc3QgPSBnZXRSZXF1ZXN0T3B0aW9ucyhgJHtiYXNlVXJsfS8ke3JlcXVlc3R9YCk7XG4gICAgaHR0cHMuZ2V0KGdldFJlcXVlc3QsIChyZXM6IEluY29taW5nTWVzc2FnZSkgPT4ge1xuICAgICAgcmVzLnNldEVuY29kaW5nKCd1dGYtOCcpO1xuICAgICAgY29uc3QgbXNnSGVhZGVyczogSW5jb21pbmdIdHRwSGVhZGVycyA9IHJlcy5oZWFkZXJzO1xuICAgICAgY29uc3QgY2FsbHNSZW1haW5pbmcgPSBwYXJzZUludCh1dGlsLmdldFNhZmUobXNnSGVhZGVycywgWyd4LXJhdGVsaW1pdC1yZW1haW5pbmcnXSwgJzAnKSwgMTApO1xuICAgICAgaWYgKChyZXMuc3RhdHVzQ29kZSA9PT0gNDAzKSAmJiAoY2FsbHNSZW1haW5pbmcgPT09IDApKSB7XG4gICAgICAgIGNvbnN0IHJlc2V0RGF0ZSA9IHBhcnNlSW50KHV0aWwuZ2V0U2FmZShtc2dIZWFkZXJzLCBbJ3gtcmF0ZWxpbWl0LXJlc2V0J10sICcwJyksIDEwKTtcbiAgICAgICAgbG9nKCdpbmZvJywgJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJyxcbiAgICAgICAgICB7IHJlc2V0X2F0OiAobmV3IERhdGUocmVzZXREYXRlKSkudG9TdHJpbmcoKSB9KTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJykpO1xuICAgICAgfVxuXG4gICAgICBsZXQgb3V0cHV0OiBzdHJpbmcgPSAnJztcbiAgICAgIHJlc1xuICAgICAgICAub24oJ2RhdGEnLCBkYXRhID0+IG91dHB1dCArPSBkYXRhKVxuICAgICAgICAub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoSlNPTi5wYXJzZShvdXRwdXQpKTtcbiAgICAgICAgICB9IGNhdGNoIChwYXJzZUVycikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChwYXJzZUVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxuICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiB7XG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgIH0pXG4gICAgICAuZW5kKCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRSZXF1ZXN0T3B0aW9ucyhsaW5rKSB7XG4gIGNvbnN0IHJlbFVybCA9IHVybC5wYXJzZShsaW5rKTtcbiAgcmV0dXJuICh7XG4gICAgLi4uXy5waWNrKHJlbFVybCwgWydwb3J0JywgJ2hvc3RuYW1lJywgJ3BhdGgnXSksXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1VzZXItQWdlbnQnOiAnVm9ydGV4JyxcbiAgICB9LFxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRDb25zZW50KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gYXBpLnNob3dEaWFsb2coJ2Vycm9yJywgJ0RpdmluZSB0b29sIGlzIG1pc3NpbmcnLCB7XG4gICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdCYWxkdXJcXCdzIEdhdGUgM1xcJ3MgbW9kZGluZyBwYXR0ZXJuIGluIG1vc3QgKGlmIG5vdCBhbGwpIGNhc2VzIHdpbGwgcmVxdWlyZSBhIDNyZCAnXG4gICAgICArICdwYXJ0eSB0b29sIG5hbWVkIFwie3tuYW1lfX1cIiB0byBtYW5pcHVsYXRlIGdhbWUgZmlsZXMuW2JyXVsvYnJdW2JyXVsvYnJdJ1xuICAgICAgKyAnVm9ydGV4IGNhbiBkb3dubG9hZCBhbmQgaW5zdGFsbCB0aGlzIHRvb2wgZm9yIHlvdSBhcyBhIG1vZCBlbnRyeS4gUGxlYXNlIGVuc3VyZSB0aGF0IHRoZSAnXG4gICAgICArICd0b29sIGlzIGFsd2F5cyBlbmFibGVkIGFuZCBkZXBsb3llZCBvbiB0aGUgbW9kcyBwYWdlLlticl1bL2JyXVticl1bL2JyXSdcbiAgICAgICsgJ1BsZWFzZSBub3RlIHRoYXQgc29tZSBBbnRpLVZpcnVzIHNvZnR3YXJlIG1heSBmbGFnIHRoaXMgdG9vbCBhcyBtYWxpY2lvdXMgZHVlICdcbiAgICAgICsgJ3RvIHRoZSBuYXR1cmUgb2YgdGhlIHRvb2wgKHVucGFja3MgLnBhayBmaWxlcykuIFdlIHN1Z2dlc3QgeW91IGVuc3VyZSB0aGF0ICdcbiAgICAgICsgJ3lvdXIgc2VjdXJpdHkgc29mdHdhcmUgaXMgY29uZmlndXJlZCB0byBhbGxvdyB0aGlzIHRvb2wgdG8gaW5zdGFsbC4nLCB7IHJlcGxhY2U6IHsgbmFtZTogJ0xTTGliJyB9IH0pLFxuICB9LCBbXG4gICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcbiAgICB7IGxhYmVsOiAnRG93bmxvYWQnIH0sXG4gIF0pXG4gIC50aGVuKHJlc3VsdCA9PiAocmVzdWx0LmFjdGlvbiA9PT0gJ0NhbmNlbCcpXG4gICAgPyBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSlcbiAgICA6IFByb21pc2UucmVzb2x2ZSgpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbm90aWZ5VXBkYXRlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgbGF0ZXN0OiBzdHJpbmcsIGN1cnJlbnQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBnYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGFwaS5zdG9yZS5nZXRTdGF0ZSgpKTtcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgdHlwZTogJ2luZm8nLFxuICAgICAgaWQ6IGBkaXZpbmUtdXBkYXRlYCxcbiAgICAgIG5vRGlzbWlzczogdHJ1ZSxcbiAgICAgIGFsbG93U3VwcHJlc3M6IHRydWUsXG4gICAgICB0aXRsZTogJ1VwZGF0ZSBmb3Ige3tuYW1lfX0nLFxuICAgICAgbWVzc2FnZTogJ0xhdGVzdDoge3tsYXRlc3R9fSwgSW5zdGFsbGVkOiB7e2N1cnJlbnR9fScsXG4gICAgICByZXBsYWNlOiB7XG4gICAgICAgIGxhdGVzdCxcbiAgICAgICAgY3VycmVudCxcbiAgICAgIH0sXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIHsgdGl0bGUgOiAnTW9yZScsIGFjdGlvbjogKGRpc21pc3M6ICgpID0+IHZvaWQpID0+IHtcbiAgICAgICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ3t7bmFtZX19IFVwZGF0ZScsIHtcbiAgICAgICAgICAgICAgdGV4dDogJ1ZvcnRleCBoYXMgZGV0ZWN0ZWQgYSBuZXdlciB2ZXJzaW9uIG9mIHt7bmFtZX19ICh7e2xhdGVzdH19KSBhdmFpbGFibGUgdG8gZG93bmxvYWQgZnJvbSB7e3dlYnNpdGV9fS4gWW91IGN1cnJlbnRseSBoYXZlIHZlcnNpb24ge3tjdXJyZW50fX0gaW5zdGFsbGVkLidcbiAgICAgICAgICAgICAgKyAnXFxuVm9ydGV4IGNhbiBkb3dubG9hZCBhbmQgYXR0ZW1wdCB0byBpbnN0YWxsIHRoZSBuZXcgdXBkYXRlIGZvciB5b3UuJyxcbiAgICAgICAgICAgICAgcGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdMU0xpYi9EaXZpbmUgVG9vbCcsXG4gICAgICAgICAgICAgICAgd2Vic2l0ZTogTFNMSUJfVVJMLFxuICAgICAgICAgICAgICAgIGxhdGVzdCxcbiAgICAgICAgICAgICAgICBjdXJyZW50LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSwgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGxhYmVsOiAnRG93bmxvYWQnLFxuICAgICAgICAgICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzbWlzcygpO1xuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdGl0bGU6ICdEaXNtaXNzJyxcbiAgICAgICAgICBhY3Rpb246IChkaXNtaXNzKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TGF0ZXN0UmVsZWFzZXMoY3VycmVudFZlcnNpb246IHN0cmluZykge1xuICBpZiAoR0lUSFVCX1VSTCkge1xuICAgIHJldHVybiBxdWVyeShHSVRIVUJfVVJMLCAncmVsZWFzZXMnKVxuICAgIC50aGVuKChyZWxlYXNlcykgPT4ge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlbGVhc2VzKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ2V4cGVjdGVkIGFycmF5IG9mIGdpdGh1YiByZWxlYXNlcycpKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGN1cnJlbnQgPSByZWxlYXNlc1xuICAgICAgICAuZmlsdGVyKHJlbCA9PiB7XG4gICAgICAgICAgY29uc3QgdGFnTmFtZSA9IHV0aWwuZ2V0U2FmZShyZWwsIFsndGFnX25hbWUnXSwgdW5kZWZpbmVkKTtcbiAgICAgICAgICBjb25zdCBpc1ByZVJlbGVhc2UgPSB1dGlsLmdldFNhZmUocmVsLCBbJ3ByZXJlbGVhc2UnXSwgZmFsc2UpO1xuICAgICAgICAgIGNvbnN0IHZlcnNpb24gPSBzZW12ZXIudmFsaWQodGFnTmFtZSk7XG5cbiAgICAgICAgICByZXR1cm4gKCFpc1ByZVJlbGVhc2VcbiAgICAgICAgICAgICYmICh2ZXJzaW9uICE9PSBudWxsKVxuICAgICAgICAgICAgJiYgKChjdXJyZW50VmVyc2lvbiA9PT0gdW5kZWZpbmVkKSB8fCAoc2VtdmVyLmd0ZSh2ZXJzaW9uLCBjdXJyZW50VmVyc2lvbikpKSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyLmNvbXBhcmUocmhzLnRhZ19uYW1lLCBsaHMudGFnX25hbWUpKTtcblxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50KTtcbiAgICB9KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzdGFydERvd25sb2FkKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZG93bmxvYWRMaW5rOiBzdHJpbmcpIHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1zaGFkb3dlZC12YXJpYWJsZSAtIHdoeSBpcyB0aGlzIGV2ZW4gcmVxdWlyZWQgP1xuICBjb25zdCByZWRpcmVjdGlvblVSTCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBodHRwcy5yZXF1ZXN0KGdldFJlcXVlc3RPcHRpb25zKGRvd25sb2FkTGluayksIHJlcyA9PiB7XG4gICAgICByZXR1cm4gcmVzb2x2ZShyZXMuaGVhZGVyc1snbG9jYXRpb24nXSk7XG4gICAgfSlcbiAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXG4gICAgICAuZW5kKCk7XG4gIH0pO1xuICBjb25zdCBkbEluZm8gPSB7XG4gICAgZ2FtZTogR0FNRV9JRCxcbiAgICBuYW1lOiAnTFNMaWIvRGl2aW5lIFRvb2wnLFxuICB9O1xuICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWRvd25sb2FkJywgW3JlZGlyZWN0aW9uVVJMXSwgZGxJbmZvLCB1bmRlZmluZWQsXG4gICAgKGVycm9yLCBpZCkgPT4ge1xuICAgICAgaWYgKGVycm9yICE9PSBudWxsKSB7XG4gICAgICAgIGlmICgoZXJyb3IubmFtZSA9PT0gJ0FscmVhZHlEb3dubG9hZGVkJylcbiAgICAgICAgICAgICYmIChlcnJvci5kb3dubG9hZElkICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICAgICAgaWQgPSBlcnJvci5kb3dubG9hZElkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0Rvd25sb2FkIGZhaWxlZCcsXG4gICAgICAgICAgICBlcnJvciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhcGkuZXZlbnRzLmVtaXQoJ3N0YXJ0LWluc3RhbGwtZG93bmxvYWQnLCBpZCwgdHJ1ZSwgKGVyciwgbW9kSWQpID0+IHtcbiAgICAgICAgaWYgKGVyciAhPT0gbnVsbCkge1xuICAgICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBpbnN0YWxsIExTTGliJyxcbiAgICAgICAgICAgIGVyciwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICAgICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kRW5hYmxlZChwcm9maWxlSWQsIG1vZElkLCB0cnVlKSk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0sICdhc2snKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZURvd25sb2FkTGluayhjdXJyZW50UmVsZWFzZXM6IGFueVtdKSB7XG4gIGNvbnN0IGFyY2hpdmVzID0gY3VycmVudFJlbGVhc2VzWzBdLmFzc2V0cy5maWx0ZXIoYXNzZXQgPT5cbiAgICBhc3NldC5uYW1lLm1hdGNoKC8oRXhwb3J0VG9vbC12WzAtOV0rLlswLTldKy5bMC05XSsuemlwKS9pKSk7XG5cbiAgY29uc3QgZG93bmxvYWRMaW5rID0gYXJjaGl2ZXNbMF0/LmJyb3dzZXJfZG93bmxvYWRfdXJsO1xuICByZXR1cm4gKGRvd25sb2FkTGluayA9PT0gdW5kZWZpbmVkKVxuICAgID8gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ZhaWxlZCB0byByZXNvbHZlIGJyb3dzZXIgZG93bmxvYWQgdXJsJykpXG4gICAgOiBQcm9taXNlLnJlc29sdmUoZG93bmxvYWRMaW5rKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrRm9yVXBkYXRlcyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gZ2V0TGF0ZXN0UmVsZWFzZXMoY3VycmVudFZlcnNpb24pXG4gICAgLnRoZW4oYXN5bmMgY3VycmVudFJlbGVhc2VzID0+IHtcbiAgICAgIGlmIChjdXJyZW50UmVsZWFzZXNbMF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBXZSBmYWlsZWQgdG8gY2hlY2sgZm9yIHVwZGF0ZXMgLSB0aGF0J3MgdW5mb3J0dW5hdGUgYnV0IHNob3VsZG4ndFxuICAgICAgICAvLyAgYmUgcmVwb3J0ZWQgdG8gdGhlIHVzZXIgYXMgaXQgd2lsbCBqdXN0IGNvbmZ1c2UgdGhlbS5cbiAgICAgICAgbG9nKCdlcnJvcicsICdVbmFibGUgdG8gdXBkYXRlIExTTGliJywgJ0ZhaWxlZCB0byBmaW5kIGFueSByZWxlYXNlcycpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnRWZXJzaW9uKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1vc3RSZWNlbnRWZXJzaW9uID0gY3VycmVudFJlbGVhc2VzWzBdLnRhZ19uYW1lLnNsaWNlKDEpO1xuICAgICAgY29uc3QgZG93bmxvYWRMaW5rID0gYXdhaXQgcmVzb2x2ZURvd25sb2FkTGluayhjdXJyZW50UmVsZWFzZXMpO1xuICAgICAgaWYgKHNlbXZlci52YWxpZChtb3N0UmVjZW50VmVyc2lvbikgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50VmVyc2lvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc2VtdmVyLmd0KG1vc3RSZWNlbnRWZXJzaW9uLCBjdXJyZW50VmVyc2lvbikpIHtcbiAgICAgICAgICByZXR1cm4gbm90aWZ5VXBkYXRlKGFwaSwgbW9zdFJlY2VudFZlcnNpb24sIGN1cnJlbnRWZXJzaW9uKVxuICAgICAgICAgICAgLnRoZW4oKCkgPT4gc3RhcnREb3dubG9hZChhcGksIGRvd25sb2FkTGluaykpXG4gICAgICAgICAgICAudGhlbigoKSA9PiBQcm9taXNlLnJlc29sdmUobW9zdFJlY2VudFZlcnNpb24pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnRWZXJzaW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQgfHwgZXJyIGluc3RhbmNlb2YgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50VmVyc2lvbik7XG4gICAgICB9XG5cbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ1VuYWJsZSB0byB1cGRhdGUgTFNMaWInLCBlcnIpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50VmVyc2lvbik7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZERpdmluZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZ2FtZUlkID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gIHJldHVybiBnZXRMYXRlc3RSZWxlYXNlcyh1bmRlZmluZWQpXG4gICAgLnRoZW4oYXN5bmMgY3VycmVudFJlbGVhc2VzID0+IHtcbiAgICAgIGNvbnN0IGRvd25sb2FkTGluayA9IGF3YWl0IHJlc29sdmVEb3dubG9hZExpbmsoY3VycmVudFJlbGVhc2VzKTtcbiAgICAgIHJldHVybiBkb3dubG9hZENvbnNlbnQoYXBpKVxuICAgICAgICAudGhlbigoKSA9PiBzdGFydERvd25sb2FkKGFwaSwgZG93bmxvYWRMaW5rKSk7XG4gICAgfSlcbiAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCB8fCBlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdVbmFibGUgdG8gZG93bmxvYWQvaW5zdGFsbCBMU0xpYicsIGVycik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9KTtcbn1cbiJdfQ==