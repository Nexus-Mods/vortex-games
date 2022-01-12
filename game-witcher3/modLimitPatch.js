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
                this.mApi.showErrorNotification('Failed to generate mod limit patch', err);
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
                    if (this.mIsPatched
                        || (stream.bytesRead < (start + chunk.length))
                        || (stream.bytesRead > (end + chunk.length))) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kTGltaXRQYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZExpbWl0UGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQXVCO0FBQ3ZCLGdEQUF3QjtBQUN4QiwyQ0FBaUU7QUFFakUsdUNBQXFEO0FBRXJELHFDQUFtRDtBQUVuRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFDN0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBRTNCLE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRXJFLE1BQWEsZUFBZTtJQUkxQixZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO0lBQzFCLENBQUM7SUFFWSxtQkFBbUI7O1lBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbkMsTUFBTSxJQUFJLEdBQXNCLHNCQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDbkUsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLGdCQUFPLENBQUMsQ0FBQztZQUM5RCxJQUFJLENBQUMsQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxDQUFBLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSxpQkFBSSxDQUFDLGVB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S0FBYSxFQUFFLEVBQUU7b0JBQ25DLElBQUksSUFBSSxDQUFDLFVBQVU7MkJBQ2QsQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzsyQkFDM0MsQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFO3dCQUM5QyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUNyQjt5QkFBTTt3QkFDTCxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFOzRCQUN0QyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUM3QyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDOzRCQUM1QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzt5QkFDeEI7NkJBQU0sSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRTs0QkFFM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7NEJBQ3ZCLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ3JCOzZCQUFNOzRCQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ3JCO3FCQUNGO2dCQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FBQTtDQUNGO0FBeExELDBDQXdMQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgc2V0U3VwcHJlc3NNb2RMaW1pdFBhdGNoIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIEkxOE5fTkFNRVNQQUNFIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuY29uc3QgUkFOR0VfU1RBUlQgPSAweEI5NDAwMDtcclxuY29uc3QgUkFOR0VfRU5EID0gMHhCOTgwMDA7XHJcblxyXG5jb25zdCBVTlBBVENIRURfU0VRID0gWzB4QkEsIDB4QzAsIDB4MDAsIDB4MDAsIDB4MDAsIDB4NDgsIDB4OEQsIDB4NEJdO1xyXG5jb25zdCBQQVRDSEVEX1NFUSA9IFsweEJBLCAweEY0LCAweDAxLCAweDAwLCAweDAwLCAweDQ4LCAweDhELCAweDRCXTtcclxuXHJcbmV4cG9ydCBjbGFzcyBNb2RMaW1pdFBhdGNoZXIge1xyXG4gIHByaXZhdGUgbUFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcclxuICBwcml2YXRlIG1Jc1BhdGNoZWQ6IGJvb2xlYW47XHJcblxyXG4gIGNvbnN0cnVjdG9yKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xyXG4gICAgdGhpcy5tQXBpID0gYXBpO1xyXG4gICAgdGhpcy5tSXNQYXRjaGVkID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXN5bmMgZW5zdXJlTW9kTGltaXRQYXRjaCgpIHtcclxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5tQXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBnYW1lOiB0eXBlcy5JR2FtZVN0b3JlZCA9IHNlbGVjdG9ycy5nYW1lQnlJZChzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBkaXNjb3ZlcnkgPSBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkW0dBTUVfSURdO1xyXG4gICAgaWYgKCFkaXNjb3Zlcnk/LnBhdGgpIHtcclxuICAgICAgdGhyb3cgbmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJyk7XHJcbiAgICB9XHJcbiAgICBhd2FpdCB0aGlzLnF1ZXJ5UGF0Y2goKTtcclxuICAgIGNvbnN0IHN0YWdpbmdQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gJ01vZCBMaW1pdCBQYXRjaGVyJztcclxuICAgIGxldCBtb2Q6IHR5cGVzLklNb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XHJcbiAgICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZU1vZExpbWl0UGF0Y2hNb2QobW9kTmFtZSk7XHJcbiAgICAgICAgbW9kID0gdXRpbC5nZXRTYWZlKHRoaXMubUFwaS5nZXRTdGF0ZSgpLFxyXG4gICAgICAgICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHNyYyA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZ2FtZS5leGVjdXRhYmxlKTtcclxuICAgICAgY29uc3QgZGVzdCA9IHBhdGguam9pbihzdGFnaW5nUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgsIGdhbWUuZXhlY3V0YWJsZSk7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGRlc3QpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCddLmluY2x1ZGVzKGVyci5jb2RlKSA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhzcmMsIGRlc3QpO1xyXG4gICAgICBjb25zdCB0ZW1wRmlsZSA9IGRlc3QgKyAnLnRtcCc7XHJcbiAgICAgIGF3YWl0IHRoaXMuc3RyZWFtRXhlY3V0YWJsZShSQU5HRV9TVEFSVCwgUkFOR0VfRU5ELCBkZXN0LCB0ZW1wRmlsZSk7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGRlc3QpO1xyXG4gICAgICBhd2FpdCBmcy5yZW5hbWVBc3luYyh0ZW1wRmlsZSwgZGVzdCk7XHJcbiAgICAgIHRoaXMubUFwaS5zZW5kTm90aWZpY2F0aW9uKHtcclxuICAgICAgICBtZXNzYWdlOiAnUGF0Y2ggZ2VuZXJhdGVkIHN1Y2Nlc3NmdWxseScsXHJcbiAgICAgICAgdHlwZTogJ3N1Y2Nlc3MnLFxyXG4gICAgICAgIGRpc3BsYXlNUzogNTAwMCxcclxuICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgdGhpcy5tQXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGdlbmVyYXRlIG1vZCBsaW1pdCBwYXRjaCcsIGVycik7XHJcbiAgICAgIHRoaXMubUFwaS5ldmVudHMuZW1pdCgncmVtb3ZlLW1vZCcsIEdBTUVfSUQsIG1vZE5hbWUpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2ROYW1lKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRMaW1pdFRleHQodDogYW55KSB7XHJcbiAgICByZXR1cm4gdCgnV2l0Y2hlciAzIGlzIHJlc3RyaWN0ZWQgdG8gMTkyIGZpbGUgaGFuZGxlcyB3aGljaCBpcyBxdWlja2x5IHJlYWNoZWQgd2hlbiAnXHJcbiAgICAgICsgJ2FkZGluZyBtb2RzIChhYm91dCB+MjUgbW9kcykgLSBWb3J0ZXggaGFzIGRldGVjdGVkIHRoYXQgdGhlIGN1cnJlbnQgbW9kcyBlbnZpcm9ubWVudCBtYXkgYmUgJ1xyXG4gICAgICArICdicmVhY2hpbmcgdGhpcyBsaW1pdDsgdGhpcyBpc3N1ZSB3aWxsIHVzdWFsbHkgZXhoaWJpdCBpdHNlbGYgYnkgdGhlIGdhbWUgZmFpbGluZyB0byBzdGFydCB1cC57e2JsfX0nXHJcbiAgICAgICsgJ1ZvcnRleCBjYW4gYXR0ZW1wdCB0byBwYXRjaCB5b3VyIGdhbWUgZXhlY3V0YWJsZSB0byBpbmNyZWFzZSB0aGUgYXZhaWxhYmxlIGZpbGUgaGFuZGxlcyB0byA1MDAgJ1xyXG4gICAgICArICd3aGljaCBzaG91bGQgY2F0ZXIgZm9yIG1vc3QgaWYgbm90IGFsbCBtb2RkaW5nIGVudmlyb25tZW50cy57e2JsfX1QbGVhc2Ugbm90ZSAtIHRoZSBwYXRjaCBpcyBhcHBsaWVkIGFzICdcclxuICAgICAgKyAnYSBtb2Qgd2hpY2ggd2lsbCBiZSBnZW5lcmF0ZWQgYW5kIGF1dG9tYXRpY2FsbHkgZW5hYmxlZDsgdG8gZGlzYWJsZSB0aGUgcGF0Y2gsIHNpbXBseSByZW1vdmUgb3IgZGlzYWJsZSAnXHJcbiAgICAgICsgJ3RoZSBcIldpdGNoZXIgMyBNb2QgTGltaXQgUGF0Y2hlclwiIG1vZCBhbmQgdGhlIG9yaWdpbmFsIGdhbWUgZXhlY3V0YWJsZSB3aWxsIGJlIHJlc3RvcmVkLicsXHJcbiAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFLCByZXBsYWNlOiB7IGJsOiAnW2JyXVsvYnJdW2JyXVsvYnJdJywgYnI6ICdbYnJdWy9icl0nIH0gfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIHF1ZXJ5UGF0Y2goKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCB0ID0gdGhpcy5tQXBpLnRyYW5zbGF0ZTtcclxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLmdldExpbWl0VGV4dCh0KTtcclxuICAgIGNvbnN0IHJlczogdHlwZXMuSURpYWxvZ1Jlc3VsdCA9IGF3YWl0ICh0aGlzLm1BcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIExpbWl0IFBhdGNoJywge1xyXG4gICAgICBiYmNvZGU6IG1lc3NhZ2UsXHJcbiAgICAgIGNoZWNrYm94ZXM6IFtcclxuICAgICAgICB7IGlkOiAnc3VwcHJlc3MtbGltaXQtcGF0Y2hlci10ZXN0JywgdGV4dDogJ0RvIG5vdCBhc2sgYWdhaW4nLCB2YWx1ZTogZmFsc2UgfVxyXG4gICAgICBdLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxyXG4gICAgICB7IGxhYmVsOiAnR2VuZXJhdGUgUGF0Y2gnIH0sXHJcbiAgICBdKSBhcyBhbnkpO1xyXG4gICAgaWYgKHJlcy5pbnB1dFsnc3VwcHJlc3MtbGltaXQtcGF0Y2hlci10ZXN0J10gPT09IHRydWUpIHtcclxuICAgICAgdGhpcy5tQXBpLnN0b3JlLmRpc3BhdGNoKHNldFN1cHByZXNzTW9kTGltaXRQYXRjaCh0cnVlKSk7XHJcbiAgICB9XHJcbiAgICBpZiAocmVzLmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcclxuICAgICAgdGhyb3cgbmV3IHV0aWwuVXNlckNhbmNlbGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjcmVhdGVNb2RMaW1pdFBhdGNoTW9kKG1vZE5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgbW9kID0ge1xyXG4gICAgICBpZDogbW9kTmFtZSxcclxuICAgICAgc3RhdGU6ICdpbnN0YWxsZWQnLFxyXG4gICAgICBhdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgbmFtZTogJ01vZCBMaW1pdCBQYXRjaGVyJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dpdGNoZXIgMyBpcyByZXN0cmljdGVkIHRvIDE5MiBmaWxlIGhhbmRsZXMgd2hpY2ggaXMgcXVpY2tseSByZWFjaGVkIHdoZW4gJ1xyXG4gICAgICAgICAgICAgICAgICAgKyAnYWRkaW5nIG1vZHMgKGFib3V0IH4yNSBtb2RzKSAtIHRoaXMgbW9kIGluY3JlYXNlcyB0aGUgbGltaXQgdG8gNTAwJyxcclxuICAgICAgICBsb2dpY2FsRmlsZU5hbWU6ICdXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoZXInLFxyXG4gICAgICAgIG1vZElkOiA0MiwgLy8gTWVhbmluZyBvZiBsaWZlXHJcbiAgICAgICAgdmVyc2lvbjogJzEuMC4wJyxcclxuICAgICAgICBpbnN0YWxsVGltZTogbmV3IERhdGUoKSxcclxuICAgICAgfSxcclxuICAgICAgaW5zdGFsbGF0aW9uUGF0aDogbW9kTmFtZSxcclxuICAgICAgdHlwZTogJ3czbW9kbGltaXRwYXRjaGVyJyxcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5tQXBpLmV2ZW50cy5lbWl0KCdjcmVhdGUtbW9kJywgR0FNRV9JRCwgbW9kLCBhc3luYyAoZXJyb3IpID0+IHtcclxuICAgICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcclxuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHRoaXMubUFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICAgICAgICB0aGlzLm1BcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKHByb2ZpbGVJZCwgbW9kTmFtZSwgdHJ1ZSkpO1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhc1NlcXVlbmNlKHNlcXVlbmNlOiBCdWZmZXIsIGNodW5rOiBCdWZmZXIpIHtcclxuICAgIGNvbnN0IGZpcnN0U2VxQnl0ZSA9IHNlcXVlbmNlWzBdO1xyXG4gICAgbGV0IGZvdW5kU2VxID0gZmFsc2U7XHJcbiAgICBsZXQgaXRlciA9IDA7XHJcbiAgICB3aGlsZSAoaXRlciA8IGNodW5rLmxlbmd0aCkge1xyXG4gICAgICBpZiAoIWZvdW5kU2VxICYmIGNodW5rW2l0ZXJdID09PSBmaXJzdFNlcUJ5dGUpIHtcclxuICAgICAgICBjb25zdCBzdWJBcnJheSA9IF8uY2xvbmVEZWVwKEFycmF5LmZyb20oY2h1bmsuc2xpY2UoaXRlciwgaXRlciArIHNlcXVlbmNlLmxlbmd0aCkpKTtcclxuICAgICAgICBmb3VuZFNlcSA9IF8uaXNFcXVhbChzZXF1ZW5jZSwgQnVmZmVyLmZyb20oc3ViQXJyYXkpKTtcclxuICAgICAgfVxyXG4gICAgICBpdGVyKys7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZvdW5kU2VxO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBwYXRjaENodW5rKGNodW5rOiBCdWZmZXIpOiBCdWZmZXIge1xyXG4gICAgY29uc3QgaWR4ID0gY2h1bmsuaW5kZXhPZihCdWZmZXIuZnJvbShVTlBBVENIRURfU0VRKSk7XHJcbiAgICBjb25zdCBwYXRjaGVkQnVmZmVyID0gQnVmZmVyLmZyb20oUEFUQ0hFRF9TRVEpO1xyXG4gICAgY29uc3QgZGF0YSA9IEJ1ZmZlci5hbGxvYyhjaHVuay5sZW5ndGgpO1xyXG4gICAgZGF0YS5maWxsKGNodW5rLnNsaWNlKDAsIGlkeCksIDAsIGlkeCk7XHJcbiAgICBkYXRhLmZpbGwocGF0Y2hlZEJ1ZmZlciwgaWR4LCBpZHggKyBwYXRjaGVkQnVmZmVyLmxlbmd0aCk7XHJcbiAgICBkYXRhLmZpbGwoY2h1bmsuc2xpY2UoaWR4ICsgcGF0Y2hlZEJ1ZmZlci5sZW5ndGgpLCBpZHggKyBwYXRjaGVkQnVmZmVyLmxlbmd0aCk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgc3RyZWFtRXhlY3V0YWJsZShzdGFydDogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcFBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3Qgd3JpdGVyID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odGVtcFBhdGgpO1xyXG4gICAgICBjb25zdCBzdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKTtcclxuICAgICAgY29uc3QgdW5wYXRjaGVkID0gQnVmZmVyLmZyb20oVU5QQVRDSEVEX1NFUSk7XHJcbiAgICAgIGNvbnN0IHBhdGNoZWQgPSBCdWZmZXIuZnJvbShQQVRDSEVEX1NFUSk7XHJcbiAgICAgIGNvbnN0IG9uRXJyb3IgPSAoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgIHRoaXMubUlzUGF0Y2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIHdyaXRlci5lbmQoKTtcclxuICAgICAgICBpZiAoIXN0cmVhbS5kZXN0cm95ZWQpIHtcclxuICAgICAgICAgIHN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XHJcbiAgICAgIH07XHJcbiAgICAgIHN0cmVhbS5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMubUlzUGF0Y2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIHdyaXRlci5lbmQoKTtcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICB9KTtcclxuICAgICAgc3RyZWFtLm9uKCdlcnJvcicsIG9uRXJyb3IpO1xyXG4gICAgICBzdHJlYW0ub24oJ2RhdGEnLCAoKGNodW5rOiBCdWZmZXIpID0+IHtcclxuICAgICAgICBpZiAodGhpcy5tSXNQYXRjaGVkXHJcbiAgICAgICAgICB8fCAoc3RyZWFtLmJ5dGVzUmVhZCA8IChzdGFydCArIGNodW5rLmxlbmd0aCkpXHJcbiAgICAgICAgICB8fCAoc3RyZWFtLmJ5dGVzUmVhZCA+IChlbmQgKyBjaHVuay5sZW5ndGgpKSkge1xyXG4gICAgICAgICAgd3JpdGVyLndyaXRlKGNodW5rKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaWYgKHRoaXMuaGFzU2VxdWVuY2UodW5wYXRjaGVkLCBjaHVuaykpIHtcclxuICAgICAgICAgICAgY29uc3QgcGF0Y2hlZEJ1ZmZlciA9IHRoaXMucGF0Y2hDaHVuayhjaHVuayk7XHJcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShwYXRjaGVkQnVmZmVyKTtcclxuICAgICAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gdHJ1ZTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5oYXNTZXF1ZW5jZShwYXRjaGVkLCBjaHVuaykpIHtcclxuICAgICAgICAgICAgLy8gZXhlYyBpcyBhbHJlYWR5IHBhdGNoZWQuXHJcbiAgICAgICAgICAgIHRoaXMubUlzUGF0Y2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShjaHVuayk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3cml0ZXIud3JpdGUoY2h1bmspO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSkpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==