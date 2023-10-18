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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kTGltaXRQYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZExpbWl0UGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQXVCO0FBQ3ZCLGdEQUF3QjtBQUN4QiwyQ0FBaUU7QUFFakUsdUNBQXFEO0FBRXJELHFDQUFtRDtBQUVuRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFDN0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBRTNCLE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRXJFLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQztBQUVyQixNQUFhLGVBQWU7SUFJMUIsWUFBWSxHQUF3QjtRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztJQUMxQixDQUFDO0lBRVksbUJBQW1COztZQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sSUFBSSxHQUFzQixzQkFBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ25FLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxnQkFBTyxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksQ0FBQSxFQUFF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QkFDbkIsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxLQUFhLEVBQUUsRUFBRTtvQkFDbkMsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxLQUFLLElBQUksTUFBTSxDQUFDLFNBQVMsR0FBRyxHQUFHLEdBQUcsTUFBTSxFQUFFO3dCQUM3RixNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUNyQjt5QkFBTTt3QkFDTCxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFOzRCQUN0QyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUM3QyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDOzRCQUM1QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzt5QkFDeEI7NkJBQU0sSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRTs0QkFFM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7NEJBQ3ZCLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ3JCOzZCQUFNOzRCQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ3JCO3FCQUNGO2dCQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FBQTtDQUNGO0FBdkxELDBDQXVMQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IHNldFN1cHByZXNzTW9kTGltaXRQYXRjaCB9IGZyb20gJy4vYWN0aW9ucyc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIEkxOE5fTkFNRVNQQUNFIH0gZnJvbSAnLi9jb21tb24nO1xuXG5jb25zdCBSQU5HRV9TVEFSVCA9IDB4Qjk0MDAwO1xuY29uc3QgUkFOR0VfRU5EID0gMHhCOTgwMDA7XG5cbmNvbnN0IFVOUEFUQ0hFRF9TRVEgPSBbMHhCQSwgMHhDMCwgMHgwMCwgMHgwMCwgMHgwMCwgMHg0OCwgMHg4RCwgMHg0Ql07XG5jb25zdCBQQVRDSEVEX1NFUSA9IFsweEJBLCAweEY0LCAweDAxLCAweDAwLCAweDAwLCAweDQ4LCAweDhELCAweDRCXTtcblxuY29uc3QgT0ZGU0VUID0gNjU1MzY7XG5cbmV4cG9ydCBjbGFzcyBNb2RMaW1pdFBhdGNoZXIge1xuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XG4gIHByaXZhdGUgbUlzUGF0Y2hlZDogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgICB0aGlzLm1BcGkgPSBhcGk7XG4gICAgdGhpcy5tSXNQYXRjaGVkID0gZmFsc2U7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZW5zdXJlTW9kTGltaXRQYXRjaCgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGdhbWU6IHR5cGVzLklHYW1lU3RvcmVkID0gc2VsZWN0b3JzLmdhbWVCeUlkKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW0dBTUVfSURdO1xuICAgIGlmICghZGlzY292ZXJ5Py5wYXRoKSB7XG4gICAgICB0aHJvdyBuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5xdWVyeVBhdGNoKCk7XG4gICAgY29uc3Qgc3RhZ2luZ1BhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgICBjb25zdCBtb2ROYW1lID0gJ01vZCBMaW1pdCBQYXRjaGVyJztcbiAgICBsZXQgbW9kOiB0eXBlcy5JTW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xuICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVNb2RMaW1pdFBhdGNoTW9kKG1vZE5hbWUpO1xuICAgICAgICBtb2QgPSB1dGlsLmdldFNhZmUodGhpcy5tQXBpLmdldFN0YXRlKCksXG4gICAgICAgICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNyYyA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZ2FtZS5leGVjdXRhYmxlKTtcbiAgICAgIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oc3RhZ2luZ1BhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCBnYW1lLmV4ZWN1dGFibGUpO1xuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdClcbiAgICAgICAgLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCddLmluY2x1ZGVzKGVyci5jb2RlKSA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoc3JjLCBkZXN0KTtcbiAgICAgIGNvbnN0IHRlbXBGaWxlID0gZGVzdCArICcudG1wJztcbiAgICAgIGF3YWl0IHRoaXMuc3RyZWFtRXhlY3V0YWJsZShSQU5HRV9TVEFSVCwgUkFOR0VfRU5ELCBkZXN0LCB0ZW1wRmlsZSk7XG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhkZXN0KTtcbiAgICAgIGF3YWl0IGZzLnJlbmFtZUFzeW5jKHRlbXBGaWxlLCBkZXN0KTtcbiAgICAgIHRoaXMubUFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgbWVzc2FnZTogJ1BhdGNoIGdlbmVyYXRlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgICB0eXBlOiAnc3VjY2VzcycsXG4gICAgICAgIGRpc3BsYXlNUzogNTAwMCxcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc3QgYWxsb3dSZXBvcnQgPSAhKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxuICAgICAgdGhpcy5tQXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGdlbmVyYXRlIG1vZCBsaW1pdCBwYXRjaCcsIGVyciwgeyBhbGxvd1JlcG9ydCB9KTtcbiAgICAgIHRoaXMubUFwaS5ldmVudHMuZW1pdCgncmVtb3ZlLW1vZCcsIEdBTUVfSUQsIG1vZE5hbWUpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kTmFtZSk7XG4gIH1cblxuICBwdWJsaWMgZ2V0TGltaXRUZXh0KHQ6IGFueSkge1xuICAgIHJldHVybiB0KCdXaXRjaGVyIDMgaXMgcmVzdHJpY3RlZCB0byAxOTIgZmlsZSBoYW5kbGVzIHdoaWNoIGlzIHF1aWNrbHkgcmVhY2hlZCB3aGVuICdcbiAgICAgICsgJ2FkZGluZyBtb2RzIChhYm91dCB+MjUgbW9kcykgLSBWb3J0ZXggaGFzIGRldGVjdGVkIHRoYXQgdGhlIGN1cnJlbnQgbW9kcyBlbnZpcm9ubWVudCBtYXkgYmUgJ1xuICAgICAgKyAnYnJlYWNoaW5nIHRoaXMgbGltaXQ7IHRoaXMgaXNzdWUgd2lsbCB1c3VhbGx5IGV4aGliaXQgaXRzZWxmIGJ5IHRoZSBnYW1lIGZhaWxpbmcgdG8gc3RhcnQgdXAue3tibH19J1xuICAgICAgKyAnVm9ydGV4IGNhbiBhdHRlbXB0IHRvIHBhdGNoIHlvdXIgZ2FtZSBleGVjdXRhYmxlIHRvIGluY3JlYXNlIHRoZSBhdmFpbGFibGUgZmlsZSBoYW5kbGVzIHRvIDUwMCAnXG4gICAgICArICd3aGljaCBzaG91bGQgY2F0ZXIgZm9yIG1vc3QgaWYgbm90IGFsbCBtb2RkaW5nIGVudmlyb25tZW50cy57e2JsfX1QbGVhc2Ugbm90ZSAtIHRoZSBwYXRjaCBpcyBhcHBsaWVkIGFzICdcbiAgICAgICsgJ2EgbW9kIHdoaWNoIHdpbGwgYmUgZ2VuZXJhdGVkIGFuZCBhdXRvbWF0aWNhbGx5IGVuYWJsZWQ7IHRvIGRpc2FibGUgdGhlIHBhdGNoLCBzaW1wbHkgcmVtb3ZlIG9yIGRpc2FibGUgJ1xuICAgICAgKyAndGhlIFwiV2l0Y2hlciAzIE1vZCBMaW1pdCBQYXRjaGVyXCIgbW9kIGFuZCB0aGUgb3JpZ2luYWwgZ2FtZSBleGVjdXRhYmxlIHdpbGwgYmUgcmVzdG9yZWQuJyxcbiAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFLCByZXBsYWNlOiB7IGJsOiAnW2JyXVsvYnJdW2JyXVsvYnJdJywgYnI6ICdbYnJdWy9icl0nIH0gfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHF1ZXJ5UGF0Y2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgdCA9IHRoaXMubUFwaS50cmFuc2xhdGU7XG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuZ2V0TGltaXRUZXh0KHQpO1xuICAgIGNvbnN0IHJlczogdHlwZXMuSURpYWxvZ1Jlc3VsdCA9IGF3YWl0ICh0aGlzLm1BcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIExpbWl0IFBhdGNoJywge1xuICAgICAgYmJjb2RlOiBtZXNzYWdlLFxuICAgICAgY2hlY2tib3hlczogW1xuICAgICAgICB7IGlkOiAnc3VwcHJlc3MtbGltaXQtcGF0Y2hlci10ZXN0JywgdGV4dDogJ0RvIG5vdCBhc2sgYWdhaW4nLCB2YWx1ZTogZmFsc2UgfVxuICAgICAgXSxcbiAgICB9LCBbXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxuICAgICAgeyBsYWJlbDogJ0dlbmVyYXRlIFBhdGNoJyB9LFxuICAgIF0pIGFzIGFueSk7XG4gICAgaWYgKHJlcy5pbnB1dFsnc3VwcHJlc3MtbGltaXQtcGF0Y2hlci10ZXN0J10gPT09IHRydWUpIHtcbiAgICAgIHRoaXMubUFwaS5zdG9yZS5kaXNwYXRjaChzZXRTdXBwcmVzc01vZExpbWl0UGF0Y2godHJ1ZSkpO1xuICAgIH1cbiAgICBpZiAocmVzLmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcbiAgICAgIHRocm93IG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlTW9kTGltaXRQYXRjaE1vZChtb2ROYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBtb2QgPSB7XG4gICAgICBpZDogbW9kTmFtZSxcbiAgICAgIHN0YXRlOiAnaW5zdGFsbGVkJyxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgbmFtZTogJ01vZCBMaW1pdCBQYXRjaGVyJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdXaXRjaGVyIDMgaXMgcmVzdHJpY3RlZCB0byAxOTIgZmlsZSBoYW5kbGVzIHdoaWNoIGlzIHF1aWNrbHkgcmVhY2hlZCB3aGVuICdcbiAgICAgICAgICAgICAgICAgICArICdhZGRpbmcgbW9kcyAoYWJvdXQgfjI1IG1vZHMpIC0gdGhpcyBtb2QgaW5jcmVhc2VzIHRoZSBsaW1pdCB0byA1MDAnLFxuICAgICAgICBsb2dpY2FsRmlsZU5hbWU6ICdXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoZXInLFxuICAgICAgICBtb2RJZDogNDIsIC8vIE1lYW5pbmcgb2YgbGlmZVxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgICAgICBpbnN0YWxsVGltZTogbmV3IERhdGUoKSxcbiAgICAgIH0sXG4gICAgICBpbnN0YWxsYXRpb25QYXRoOiBtb2ROYW1lLFxuICAgICAgdHlwZTogJ3czbW9kbGltaXRwYXRjaGVyJyxcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRoaXMubUFwaS5ldmVudHMuZW1pdCgnY3JlYXRlLW1vZCcsIEdBTUVfSUQsIG1vZCwgYXN5bmMgKGVycm9yKSA9PiB7XG4gICAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUodGhpcy5tQXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xuICAgICAgICB0aGlzLm1BcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKHByb2ZpbGVJZCwgbW9kTmFtZSwgdHJ1ZSkpO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGhhc1NlcXVlbmNlKHNlcXVlbmNlOiBCdWZmZXIsIGNodW5rOiBCdWZmZXIpIHtcbiAgICBjb25zdCBmaXJzdFNlcUJ5dGUgPSBzZXF1ZW5jZVswXTtcbiAgICBsZXQgZm91bmRTZXEgPSBmYWxzZTtcbiAgICBsZXQgaXRlciA9IDA7XG4gICAgd2hpbGUgKGl0ZXIgPCBjaHVuay5sZW5ndGgpIHtcbiAgICAgIGlmICghZm91bmRTZXEgJiYgY2h1bmtbaXRlcl0gPT09IGZpcnN0U2VxQnl0ZSkge1xuICAgICAgICBjb25zdCBzdWJBcnJheSA9IF8uY2xvbmVEZWVwKEFycmF5LmZyb20oY2h1bmsuc2xpY2UoaXRlciwgaXRlciArIHNlcXVlbmNlLmxlbmd0aCkpKTtcbiAgICAgICAgZm91bmRTZXEgPSBfLmlzRXF1YWwoc2VxdWVuY2UsIEJ1ZmZlci5mcm9tKHN1YkFycmF5KSk7XG4gICAgICB9XG4gICAgICBpdGVyKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZvdW5kU2VxO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaENodW5rKGNodW5rOiBCdWZmZXIpOiBCdWZmZXIge1xuICAgIGNvbnN0IGlkeCA9IGNodW5rLmluZGV4T2YoQnVmZmVyLmZyb20oVU5QQVRDSEVEX1NFUSkpO1xuICAgIGNvbnN0IHBhdGNoZWRCdWZmZXIgPSBCdWZmZXIuZnJvbShQQVRDSEVEX1NFUSk7XG4gICAgY29uc3QgZGF0YSA9IEJ1ZmZlci5hbGxvYyhjaHVuay5sZW5ndGgpO1xuICAgIGRhdGEuZmlsbChjaHVuay5zbGljZSgwLCBpZHgpLCAwLCBpZHgpO1xuICAgIGRhdGEuZmlsbChwYXRjaGVkQnVmZmVyLCBpZHgsIGlkeCArIHBhdGNoZWRCdWZmZXIubGVuZ3RoKTtcbiAgICBkYXRhLmZpbGwoY2h1bmsuc2xpY2UoaWR4ICsgcGF0Y2hlZEJ1ZmZlci5sZW5ndGgpLCBpZHggKyBwYXRjaGVkQnVmZmVyLmxlbmd0aCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHN0cmVhbUV4ZWN1dGFibGUoc3RhcnQ6IG51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qgd3JpdGVyID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odGVtcFBhdGgpO1xuICAgICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XG4gICAgICBjb25zdCB1bnBhdGNoZWQgPSBCdWZmZXIuZnJvbShVTlBBVENIRURfU0VRKTtcbiAgICAgIGNvbnN0IHBhdGNoZWQgPSBCdWZmZXIuZnJvbShQQVRDSEVEX1NFUSk7XG4gICAgICBjb25zdCBvbkVycm9yID0gKGVycjogRXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gZmFsc2U7XG4gICAgICAgIHdyaXRlci5lbmQoKTtcbiAgICAgICAgaWYgKCFzdHJlYW0uZGVzdHJveWVkKSB7XG4gICAgICAgICAgc3RyZWFtLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgfTtcbiAgICAgIHN0cmVhbS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSBmYWxzZTtcbiAgICAgICAgd3JpdGVyLmVuZCgpO1xuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgICBzdHJlYW0ub24oJ2Vycm9yJywgb25FcnJvcik7XG4gICAgICBzdHJlYW0ub24oJ2RhdGEnLCAoKGNodW5rOiBCdWZmZXIpID0+IHtcbiAgICAgICAgaWYgKHRoaXMubUlzUGF0Y2hlZCB8fCAoc3RyZWFtLmJ5dGVzUmVhZCArIE9GRlNFVCkgPCBzdGFydCB8fCBzdHJlYW0uYnl0ZXNSZWFkID4gZW5kICsgT0ZGU0VUKSB7XG4gICAgICAgICAgd3JpdGVyLndyaXRlKGNodW5rKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodGhpcy5oYXNTZXF1ZW5jZSh1bnBhdGNoZWQsIGNodW5rKSkge1xuICAgICAgICAgICAgY29uc3QgcGF0Y2hlZEJ1ZmZlciA9IHRoaXMucGF0Y2hDaHVuayhjaHVuayk7XG4gICAgICAgICAgICB3cml0ZXIud3JpdGUocGF0Y2hlZEJ1ZmZlcik7XG4gICAgICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5oYXNTZXF1ZW5jZShwYXRjaGVkLCBjaHVuaykpIHtcbiAgICAgICAgICAgIC8vIGV4ZWMgaXMgYWxyZWFkeSBwYXRjaGVkLlxuICAgICAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShjaHVuayk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShjaHVuayk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSk7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==