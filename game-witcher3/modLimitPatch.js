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
exports.ModLimitPatcher = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const actions_1 = require("./actions");
const common_1 = require("./common");
const RANGE_START = 0xB94000;
const RANGE_END = 0xB98000;
const UNPATCHED_SEQ = [0xBA, 0xC0, 0x00, 0x00, 0x00, 0x48, 0x8D, 0x4B];
const PATCHED_SEQ = [0xBA, 0xF4, 0x01, 0x00, 0x00, 0x48, 0x8D, 0x4B];
const OFFSET = 65536;
class ModLimitPatcher {
    constructor(api) {
        this.mApi = api;
        this.mIsPatched = false;
    }
    ensureModLimitPatch() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.mApi.getState();
            const game = vortex_api_1.selectors.gameById(state, common_1.GAME_ID);
            const discovery = state.settings.gameMode.discovered[common_1.GAME_ID];
            if (!(discovery === null || discovery === void 0 ? void 0 : discovery.path)) {
                throw new vortex_api_1.util.ProcessCanceled('Game is not discovered');
            }
            yield this.queryPatch();
            const stagingPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const modName = 'Mod Limit Patcher';
            let mod = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID, modName], undefined);
            if (mod === undefined) {
                try {
                    yield this.createModLimitPatchMod(modName);
                    mod = vortex_api_1.util.getSafe(this.mApi.getState(), ['persistent', 'mods', common_1.GAME_ID, modName], undefined);
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }
            try {
                const src = path_1.default.join(discovery.path, game.executable);
                const dest = path_1.default.join(stagingPath, mod.installationPath, game.executable);
                yield vortex_api_1.fs.removeAsync(dest)
                    .catch(err => ['ENOENT'].includes(err.code) ? Promise.resolve() : Promise.reject(err));
                yield vortex_api_1.fs.copyAsync(src, dest);
                const tempFile = dest + '.tmp';
                yield this.streamExecutable(RANGE_START, RANGE_END, dest, tempFile);
                yield vortex_api_1.fs.removeAsync(dest);
                yield vortex_api_1.fs.renameAsync(tempFile, dest);
                this.mApi.sendNotification({
                    message: 'Patch generated successfully',
                    type: 'success',
                    displayMS: 5000,
                });
            }
            catch (err) {
                const allowReport = !(err instanceof vortex_api_1.util.UserCanceled);
                this.mApi.showErrorNotification('Failed to generate mod limit patch', err, { allowReport });
                this.mApi.events.emit('remove-mod', common_1.GAME_ID, modName);
                return Promise.resolve(undefined);
            }
            return Promise.resolve(modName);
        });
    }
    getLimitText(t) {
        return t('Witcher 3 is restricted to 192 file handles which is quickly reached when '
            + 'adding mods (about ~25 mods) - Vortex has detected that the current mods environment may be '
            + 'breaching this limit; this issue will usually exhibit itself by the game failing to start up.{{bl}}'
            + 'Vortex can attempt to patch your game executable to increase the available file handles to 500 '
            + 'which should cater for most if not all modding environments.{{bl}}Please note - the patch is applied as '
            + 'a mod which will be generated and automatically enabled; to disable the patch, simply remove or disable '
            + 'the "Witcher 3 Mod Limit Patcher" mod and the original game executable will be restored.', { ns: common_1.I18N_NAMESPACE, replace: { bl: '[br][/br][br][/br]', br: '[br][/br]' } });
    }
    queryPatch() {
        return __awaiter(this, void 0, void 0, function* () {
            const t = this.mApi.translate;
            const message = this.getLimitText(t);
            const res = yield this.mApi.showDialog('question', 'Mod Limit Patch', {
                bbcode: message,
                checkboxes: [
                    { id: 'suppress-limit-patcher-test', text: 'Do not ask again', value: false }
                ],
            }, [
                { label: 'Cancel' },
                { label: 'Generate Patch' },
            ]);
            if (res.input['suppress-limit-patcher-test'] === true) {
                this.mApi.store.dispatch((0, actions_1.setSuppressModLimitPatch)(true));
            }
            if (res.action === 'Cancel') {
                throw new vortex_api_1.util.UserCanceled();
            }
            return Promise.resolve();
        });
    }
    createModLimitPatchMod(modName) {
        const mod = {
            id: modName,
            state: 'installed',
            attributes: {
                name: 'Mod Limit Patcher',
                description: 'Witcher 3 is restricted to 192 file handles which is quickly reached when '
                    + 'adding mods (about ~25 mods) - this mod increases the limit to 500',
                logicalFileName: 'Witcher 3 Mod Limit Patcher',
                modId: 42,
                version: '1.0.0',
                installTime: new Date(),
            },
            installationPath: modName,
            type: 'w3modlimitpatcher',
        };
        return new Promise((resolve, reject) => {
            this.mApi.events.emit('create-mod', common_1.GAME_ID, mod, (error) => __awaiter(this, void 0, void 0, function* () {
                if (error !== null) {
                    return reject(error);
                }
                const profileId = vortex_api_1.selectors.lastActiveProfileForGame(this.mApi.getState(), common_1.GAME_ID);
                this.mApi.store.dispatch(vortex_api_1.actions.setModEnabled(profileId, modName, true));
                return resolve();
            }));
        });
    }
    hasSequence(sequence, chunk) {
        const firstSeqByte = sequence[0];
        let foundSeq = false;
        let iter = 0;
        while (iter < chunk.length) {
            if (!foundSeq && chunk[iter] === firstSeqByte) {
                const subArray = lodash_1.default.cloneDeep(Array.from(chunk.slice(iter, iter + sequence.length)));
                foundSeq = lodash_1.default.isEqual(sequence, Buffer.from(subArray));
            }
            iter++;
        }
        return foundSeq;
    }
    patchChunk(chunk) {
        const idx = chunk.indexOf(Buffer.from(UNPATCHED_SEQ));
        const patchedBuffer = Buffer.from(PATCHED_SEQ);
        const data = Buffer.alloc(chunk.length);
        data.fill(chunk.slice(0, idx), 0, idx);
        data.fill(patchedBuffer, idx, idx + patchedBuffer.length);
        data.fill(chunk.slice(idx + patchedBuffer.length), idx + patchedBuffer.length);
        return data;
    }
    streamExecutable(start, end, filePath, tempPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const writer = vortex_api_1.fs.createWriteStream(tempPath);
                const stream = vortex_api_1.fs.createReadStream(filePath);
                const unpatched = Buffer.from(UNPATCHED_SEQ);
                const patched = Buffer.from(PATCHED_SEQ);
                const onError = (err) => {
                    this.mIsPatched = false;
                    writer.end();
                    if (!stream.destroyed) {
                        stream.close();
                    }
                    return reject(err);
                };
                stream.on('end', () => {
                    this.mIsPatched = false;
                    writer.end();
                    return resolve();
                });
                stream.on('error', onError);
                stream.on('data', ((chunk) => {
                    if (this.mIsPatched || (stream.bytesRead + OFFSET) < start || stream.bytesRead > end + OFFSET) {
                        writer.write(chunk);
                    }
                    else {
                        if (this.hasSequence(unpatched, chunk)) {
                            const patchedBuffer = this.patchChunk(chunk);
                            writer.write(patchedBuffer);
                            this.mIsPatched = true;
                        }
                        else if (this.hasSequence(patched, chunk)) {
                            this.mIsPatched = true;
                            writer.write(chunk);
                        }
                        else {
                            writer.write(chunk);
                        }
                    }
                }));
            });
        });
    }
}
exports.ModLimitPatcher = ModLimitPatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kTGltaXRQYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZExpbWl0UGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0Esb0RBQXVCO0FBQ3ZCLGdEQUF3QjtBQUN4QiwyQ0FBaUU7QUFFakUsdUNBQXFEO0FBRXJELHFDQUFtRDtBQU9uRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFDN0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBRTNCLE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRXJFLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQztBQUVyQixNQUFhLGVBQWU7SUFJMUIsWUFBWSxHQUF3QjtRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztJQUMxQixDQUFDO0lBRVksbUJBQW1COztZQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sSUFBSSxHQUFzQixzQkFBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ25FLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxnQkFBTyxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksQ0FBQSxFQUFF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QUMsQ0FBQztZQUNOLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0NBQ0Y7QUF2TEQsMENBdUxDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBzZXRTdXBwcmVzc01vZExpbWl0UGF0Y2ggfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgSTE4Tl9OQU1FU1BBQ0UgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG4vKipcclxuICogVGhlb3JldGljYWxseSB0aGUgbW9kIGxpbWl0IHBhdGNoZXIgaXMgbm8gbG9uZ2VyIG5lZWRlZCAoQ0RQUiByYWlzZWQgdGhlIGZpbGUgaGFuZGxlIGxpbWl0KVxyXG4gKiAgYnV0IHdlIHdpbGwgc3RpbGwga2VlcCB0aGlzIGZ1bmN0aW9uYWxpdHkgaW4gY2FzZSBpdCBpcyBuZWVkZWQgaW4gdGhlIGZ1dHVyZS5cclxuICovXHJcblxyXG5jb25zdCBSQU5HRV9TVEFSVCA9IDB4Qjk0MDAwO1xyXG5jb25zdCBSQU5HRV9FTkQgPSAweEI5ODAwMDtcclxuXHJcbmNvbnN0IFVOUEFUQ0hFRF9TRVEgPSBbMHhCQSwgMHhDMCwgMHgwMCwgMHgwMCwgMHgwMCwgMHg0OCwgMHg4RCwgMHg0Ql07XHJcbmNvbnN0IFBBVENIRURfU0VRID0gWzB4QkEsIDB4RjQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4NDgsIDB4OEQsIDB4NEJdO1xyXG5cclxuY29uc3QgT0ZGU0VUID0gNjU1MzY7XHJcblxyXG5leHBvcnQgY2xhc3MgTW9kTGltaXRQYXRjaGVyIHtcclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtSXNQYXRjaGVkOiBib29sZWFuO1xyXG5cclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIHRoaXMubUFwaSA9IGFwaTtcclxuICAgIHRoaXMubUlzUGF0Y2hlZCA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGVuc3VyZU1vZExpbWl0UGF0Y2goKSB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZTogdHlwZXMuSUdhbWVTdG9yZWQgPSBzZWxlY3RvcnMuZ2FtZUJ5SWQoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtHQU1FX0lEXTtcclxuICAgIGlmICghZGlzY292ZXJ5Py5wYXRoKSB7XHJcbiAgICAgIHRocm93IG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcpO1xyXG4gICAgfVxyXG4gICAgYXdhaXQgdGhpcy5xdWVyeVBhdGNoKCk7XHJcbiAgICBjb25zdCBzdGFnaW5nUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgbW9kTmFtZSA9ICdNb2QgTGltaXQgUGF0Y2hlcic7XHJcbiAgICBsZXQgbW9kOiB0eXBlcy5JTW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xyXG4gICAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVNb2RMaW1pdFBhdGNoTW9kKG1vZE5hbWUpO1xyXG4gICAgICAgIG1vZCA9IHV0aWwuZ2V0U2FmZSh0aGlzLm1BcGkuZ2V0U3RhdGUoKSxcclxuICAgICAgICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBzcmMgPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIGdhbWUuZXhlY3V0YWJsZSk7XHJcbiAgICAgIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oc3RhZ2luZ1BhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCBnYW1lLmV4ZWN1dGFibGUpO1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhkZXN0KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gWydFTk9FTlQnXS5pbmNsdWRlcyhlcnIuY29kZSkgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoc3JjLCBkZXN0KTtcclxuICAgICAgY29uc3QgdGVtcEZpbGUgPSBkZXN0ICsgJy50bXAnO1xyXG4gICAgICBhd2FpdCB0aGlzLnN0cmVhbUV4ZWN1dGFibGUoUkFOR0VfU1RBUlQsIFJBTkdFX0VORCwgZGVzdCwgdGVtcEZpbGUpO1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhkZXN0KTtcclxuICAgICAgYXdhaXQgZnMucmVuYW1lQXN5bmModGVtcEZpbGUsIGRlc3QpO1xyXG4gICAgICB0aGlzLm1BcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgbWVzc2FnZTogJ1BhdGNoIGdlbmVyYXRlZCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgICAgICBkaXNwbGF5TVM6IDUwMDAsXHJcbiAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gIShlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZClcclxuICAgICAgdGhpcy5tQXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGdlbmVyYXRlIG1vZCBsaW1pdCBwYXRjaCcsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcclxuICAgICAgdGhpcy5tQXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kJywgR0FNRV9JRCwgbW9kTmFtZSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZE5hbWUpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldExpbWl0VGV4dCh0OiBhbnkpIHtcclxuICAgIHJldHVybiB0KCdXaXRjaGVyIDMgaXMgcmVzdHJpY3RlZCB0byAxOTIgZmlsZSBoYW5kbGVzIHdoaWNoIGlzIHF1aWNrbHkgcmVhY2hlZCB3aGVuICdcclxuICAgICAgKyAnYWRkaW5nIG1vZHMgKGFib3V0IH4yNSBtb2RzKSAtIFZvcnRleCBoYXMgZGV0ZWN0ZWQgdGhhdCB0aGUgY3VycmVudCBtb2RzIGVudmlyb25tZW50IG1heSBiZSAnXHJcbiAgICAgICsgJ2JyZWFjaGluZyB0aGlzIGxpbWl0OyB0aGlzIGlzc3VlIHdpbGwgdXN1YWxseSBleGhpYml0IGl0c2VsZiBieSB0aGUgZ2FtZSBmYWlsaW5nIHRvIHN0YXJ0IHVwLnt7Ymx9fSdcclxuICAgICAgKyAnVm9ydGV4IGNhbiBhdHRlbXB0IHRvIHBhdGNoIHlvdXIgZ2FtZSBleGVjdXRhYmxlIHRvIGluY3JlYXNlIHRoZSBhdmFpbGFibGUgZmlsZSBoYW5kbGVzIHRvIDUwMCAnXHJcbiAgICAgICsgJ3doaWNoIHNob3VsZCBjYXRlciBmb3IgbW9zdCBpZiBub3QgYWxsIG1vZGRpbmcgZW52aXJvbm1lbnRzLnt7Ymx9fVBsZWFzZSBub3RlIC0gdGhlIHBhdGNoIGlzIGFwcGxpZWQgYXMgJ1xyXG4gICAgICArICdhIG1vZCB3aGljaCB3aWxsIGJlIGdlbmVyYXRlZCBhbmQgYXV0b21hdGljYWxseSBlbmFibGVkOyB0byBkaXNhYmxlIHRoZSBwYXRjaCwgc2ltcGx5IHJlbW92ZSBvciBkaXNhYmxlICdcclxuICAgICAgKyAndGhlIFwiV2l0Y2hlciAzIE1vZCBMaW1pdCBQYXRjaGVyXCIgbW9kIGFuZCB0aGUgb3JpZ2luYWwgZ2FtZSBleGVjdXRhYmxlIHdpbGwgYmUgcmVzdG9yZWQuJyxcclxuICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UsIHJlcGxhY2U6IHsgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nLCBicjogJ1ticl1bL2JyXScgfSB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgcXVlcnlQYXRjaCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IHQgPSB0aGlzLm1BcGkudHJhbnNsYXRlO1xyXG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuZ2V0TGltaXRUZXh0KHQpO1xyXG4gICAgY29uc3QgcmVzOiB0eXBlcy5JRGlhbG9nUmVzdWx0ID0gYXdhaXQgKHRoaXMubUFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdNb2QgTGltaXQgUGF0Y2gnLCB7XHJcbiAgICAgIGJiY29kZTogbWVzc2FnZSxcclxuICAgICAgY2hlY2tib3hlczogW1xyXG4gICAgICAgIHsgaWQ6ICdzdXBwcmVzcy1saW1pdC1wYXRjaGVyLXRlc3QnLCB0ZXh0OiAnRG8gbm90IGFzayBhZ2FpbicsIHZhbHVlOiBmYWxzZSB9XHJcbiAgICAgIF0sXHJcbiAgICB9LCBbXHJcbiAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdHZW5lcmF0ZSBQYXRjaCcgfSxcclxuICAgIF0pIGFzIGFueSk7XHJcbiAgICBpZiAocmVzLmlucHV0WydzdXBwcmVzcy1saW1pdC1wYXRjaGVyLXRlc3QnXSA9PT0gdHJ1ZSkge1xyXG4gICAgICB0aGlzLm1BcGkuc3RvcmUuZGlzcGF0Y2goc2V0U3VwcHJlc3NNb2RMaW1pdFBhdGNoKHRydWUpKTtcclxuICAgIH1cclxuICAgIGlmIChyZXMuYWN0aW9uID09PSAnQ2FuY2VsJykge1xyXG4gICAgICB0aHJvdyBuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNyZWF0ZU1vZExpbWl0UGF0Y2hNb2QobW9kTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCBtb2QgPSB7XHJcbiAgICAgIGlkOiBtb2ROYW1lLFxyXG4gICAgICBzdGF0ZTogJ2luc3RhbGxlZCcsXHJcbiAgICAgIGF0dHJpYnV0ZXM6IHtcclxuICAgICAgICBuYW1lOiAnTW9kIExpbWl0IFBhdGNoZXInLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV2l0Y2hlciAzIGlzIHJlc3RyaWN0ZWQgdG8gMTkyIGZpbGUgaGFuZGxlcyB3aGljaCBpcyBxdWlja2x5IHJlYWNoZWQgd2hlbiAnXHJcbiAgICAgICAgICAgICAgICAgICArICdhZGRpbmcgbW9kcyAoYWJvdXQgfjI1IG1vZHMpIC0gdGhpcyBtb2QgaW5jcmVhc2VzIHRoZSBsaW1pdCB0byA1MDAnLFxyXG4gICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogJ1dpdGNoZXIgMyBNb2QgTGltaXQgUGF0Y2hlcicsXHJcbiAgICAgICAgbW9kSWQ6IDQyLCAvLyBNZWFuaW5nIG9mIGxpZmVcclxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxyXG4gICAgICAgIGluc3RhbGxUaW1lOiBuZXcgRGF0ZSgpLFxyXG4gICAgICB9LFxyXG4gICAgICBpbnN0YWxsYXRpb25QYXRoOiBtb2ROYW1lLFxyXG4gICAgICB0eXBlOiAndzNtb2RsaW1pdHBhdGNoZXInLFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLm1BcGkuZXZlbnRzLmVtaXQoJ2NyZWF0ZS1tb2QnLCBHQU1FX0lELCBtb2QsIGFzeW5jIChlcnJvcikgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUodGhpcy5tQXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gICAgICAgIHRoaXMubUFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQocHJvZmlsZUlkLCBtb2ROYW1lLCB0cnVlKSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFzU2VxdWVuY2Uoc2VxdWVuY2U6IEJ1ZmZlciwgY2h1bms6IEJ1ZmZlcikge1xyXG4gICAgY29uc3QgZmlyc3RTZXFCeXRlID0gc2VxdWVuY2VbMF07XHJcbiAgICBsZXQgZm91bmRTZXEgPSBmYWxzZTtcclxuICAgIGxldCBpdGVyID0gMDtcclxuICAgIHdoaWxlIChpdGVyIDwgY2h1bmsubGVuZ3RoKSB7XHJcbiAgICAgIGlmICghZm91bmRTZXEgJiYgY2h1bmtbaXRlcl0gPT09IGZpcnN0U2VxQnl0ZSkge1xyXG4gICAgICAgIGNvbnN0IHN1YkFycmF5ID0gXy5jbG9uZURlZXAoQXJyYXkuZnJvbShjaHVuay5zbGljZShpdGVyLCBpdGVyICsgc2VxdWVuY2UubGVuZ3RoKSkpO1xyXG4gICAgICAgIGZvdW5kU2VxID0gXy5pc0VxdWFsKHNlcXVlbmNlLCBCdWZmZXIuZnJvbShzdWJBcnJheSkpO1xyXG4gICAgICB9XHJcbiAgICAgIGl0ZXIrKztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZm91bmRTZXE7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHBhdGNoQ2h1bmsoY2h1bms6IEJ1ZmZlcik6IEJ1ZmZlciB7XHJcbiAgICBjb25zdCBpZHggPSBjaHVuay5pbmRleE9mKEJ1ZmZlci5mcm9tKFVOUEFUQ0hFRF9TRVEpKTtcclxuICAgIGNvbnN0IHBhdGNoZWRCdWZmZXIgPSBCdWZmZXIuZnJvbShQQVRDSEVEX1NFUSk7XHJcbiAgICBjb25zdCBkYXRhID0gQnVmZmVyLmFsbG9jKGNodW5rLmxlbmd0aCk7XHJcbiAgICBkYXRhLmZpbGwoY2h1bmsuc2xpY2UoMCwgaWR4KSwgMCwgaWR4KTtcclxuICAgIGRhdGEuZmlsbChwYXRjaGVkQnVmZmVyLCBpZHgsIGlkeCArIHBhdGNoZWRCdWZmZXIubGVuZ3RoKTtcclxuICAgIGRhdGEuZmlsbChjaHVuay5zbGljZShpZHggKyBwYXRjaGVkQnVmZmVyLmxlbmd0aCksIGlkeCArIHBhdGNoZWRCdWZmZXIubGVuZ3RoKTtcclxuICAgIHJldHVybiBkYXRhO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBzdHJlYW1FeGVjdXRhYmxlKHN0YXJ0OiBudW1iZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCB3cml0ZXIgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh0ZW1wUGF0aCk7XHJcbiAgICAgIGNvbnN0IHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCB1bnBhdGNoZWQgPSBCdWZmZXIuZnJvbShVTlBBVENIRURfU0VRKTtcclxuICAgICAgY29uc3QgcGF0Y2hlZCA9IEJ1ZmZlci5mcm9tKFBBVENIRURfU0VRKTtcclxuICAgICAgY29uc3Qgb25FcnJvciA9IChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gZmFsc2U7XHJcbiAgICAgICAgd3JpdGVyLmVuZCgpO1xyXG4gICAgICAgIGlmICghc3RyZWFtLmRlc3Ryb3llZCkge1xyXG4gICAgICAgICAgc3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgICAgfTtcclxuICAgICAgc3RyZWFtLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gZmFsc2U7XHJcbiAgICAgICAgd3JpdGVyLmVuZCgpO1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBzdHJlYW0ub24oJ2Vycm9yJywgb25FcnJvcik7XHJcbiAgICAgIHN0cmVhbS5vbignZGF0YScsICgoY2h1bms6IEJ1ZmZlcikgPT4ge1xyXG4gICAgICAgIGlmICh0aGlzLm1Jc1BhdGNoZWQgfHwgKHN0cmVhbS5ieXRlc1JlYWQgKyBPRkZTRVQpIDwgc3RhcnQgfHwgc3RyZWFtLmJ5dGVzUmVhZCA+IGVuZCArIE9GRlNFVCkge1xyXG4gICAgICAgICAgd3JpdGVyLndyaXRlKGNodW5rKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHRoaXMuaGFzU2VxdWVuY2UodW5wYXRjaGVkLCBjaHVuaykpIHtcclxuICAgICAgICAgICAgY29uc3QgcGF0Y2hlZEJ1ZmZlciA9IHRoaXMucGF0Y2hDaHVuayhjaHVuayk7XHJcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShwYXRjaGVkQnVmZmVyKTtcclxuICAgICAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gdHJ1ZTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5oYXNTZXF1ZW5jZShwYXRjaGVkLCBjaHVuaykpIHtcclxuICAgICAgICAgICAgLy8gZXhlYyBpcyBhbHJlYWR5IHBhdGNoZWQuXHJcbiAgICAgICAgICAgIHRoaXMubUlzUGF0Y2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShjaHVuayk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3cml0ZXIud3JpdGUoY2h1bmspO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==