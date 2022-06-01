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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kTGltaXRQYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZExpbWl0UGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQXVCO0FBQ3ZCLGdEQUF3QjtBQUN4QiwyQ0FBaUU7QUFFakUsdUNBQXFEO0FBRXJELHFDQUFtRDtBQUVuRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFDN0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBRTNCLE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRXJFLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQztBQUVyQixNQUFhLGVBQWU7SUFJMUIsWUFBWSxHQUF3QjtRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztJQUMxQixDQUFDO0lBRVksbUJBQW1COztZQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sSUFBSSxHQUFzQixzQkFBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ25FLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxnQkFBTyxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksQ0FBQSxFQUFF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LEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEtBQWEsRUFBRSxFQUFFO29CQUNuQyxJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEtBQUssSUFBSSxNQUFNLENBQUMsU0FBUyxHQUFHLEdBQUcsR0FBRyxNQUFNLEVBQUU7d0JBQzdGLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQ3JCO3lCQUFNO3dCQUNMLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUU7NEJBQ3RDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQzdDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7NEJBQzVCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO3lCQUN4Qjs2QkFBTSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFOzRCQUUzQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzs0QkFDdkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt5QkFDckI7NkJBQU07NEJBQ0wsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt5QkFDckI7cUJBQ0Y7Z0JBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNOLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0NBQ0Y7QUF0TEQsMENBc0xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBzZXRTdXBwcmVzc01vZExpbWl0UGF0Y2ggfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgSTE4Tl9OQU1FU1BBQ0UgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5jb25zdCBSQU5HRV9TVEFSVCA9IDB4Qjk0MDAwO1xyXG5jb25zdCBSQU5HRV9FTkQgPSAweEI5ODAwMDtcclxuXHJcbmNvbnN0IFVOUEFUQ0hFRF9TRVEgPSBbMHhCQSwgMHhDMCwgMHgwMCwgMHgwMCwgMHgwMCwgMHg0OCwgMHg4RCwgMHg0Ql07XHJcbmNvbnN0IFBBVENIRURfU0VRID0gWzB4QkEsIDB4RjQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4NDgsIDB4OEQsIDB4NEJdO1xyXG5cclxuY29uc3QgT0ZGU0VUID0gNjU1MzY7XHJcblxyXG5leHBvcnQgY2xhc3MgTW9kTGltaXRQYXRjaGVyIHtcclxuICBwcml2YXRlIG1BcGk6IHR5cGVzLklFeHRlbnNpb25BcGk7XHJcbiAgcHJpdmF0ZSBtSXNQYXRjaGVkOiBib29sZWFuO1xyXG5cclxuICBjb25zdHJ1Y3RvcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcclxuICAgIHRoaXMubUFwaSA9IGFwaTtcclxuICAgIHRoaXMubUlzUGF0Y2hlZCA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGFzeW5jIGVuc3VyZU1vZExpbWl0UGF0Y2goKSB7XHJcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMubUFwaS5nZXRTdGF0ZSgpO1xyXG4gICAgY29uc3QgZ2FtZTogdHlwZXMuSUdhbWVTdG9yZWQgPSBzZWxlY3RvcnMuZ2FtZUJ5SWQoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtHQU1FX0lEXTtcclxuICAgIGlmICghZGlzY292ZXJ5Py5wYXRoKSB7XHJcbiAgICAgIHRocm93IG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcpO1xyXG4gICAgfVxyXG4gICAgYXdhaXQgdGhpcy5xdWVyeVBhdGNoKCk7XHJcbiAgICBjb25zdCBzdGFnaW5nUGF0aCA9IHNlbGVjdG9ycy5pbnN0YWxsUGF0aEZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xyXG4gICAgY29uc3QgbW9kTmFtZSA9ICdNb2QgTGltaXQgUGF0Y2hlcic7XHJcbiAgICBsZXQgbW9kOiB0eXBlcy5JTW9kID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xyXG4gICAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5jcmVhdGVNb2RMaW1pdFBhdGNoTW9kKG1vZE5hbWUpO1xyXG4gICAgICAgIG1vZCA9IHV0aWwuZ2V0U2FmZSh0aGlzLm1BcGkuZ2V0U3RhdGUoKSxcclxuICAgICAgICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBzcmMgPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIGdhbWUuZXhlY3V0YWJsZSk7XHJcbiAgICAgIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oc3RhZ2luZ1BhdGgsIG1vZC5pbnN0YWxsYXRpb25QYXRoLCBnYW1lLmV4ZWN1dGFibGUpO1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhkZXN0KVxyXG4gICAgICAgIC5jYXRjaChlcnIgPT4gWydFTk9FTlQnXS5pbmNsdWRlcyhlcnIuY29kZSkgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoc3JjLCBkZXN0KTtcclxuICAgICAgY29uc3QgdGVtcEZpbGUgPSBkZXN0ICsgJy50bXAnO1xyXG4gICAgICBhd2FpdCB0aGlzLnN0cmVhbUV4ZWN1dGFibGUoUkFOR0VfU1RBUlQsIFJBTkdFX0VORCwgZGVzdCwgdGVtcEZpbGUpO1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhkZXN0KTtcclxuICAgICAgYXdhaXQgZnMucmVuYW1lQXN5bmModGVtcEZpbGUsIGRlc3QpO1xyXG4gICAgICB0aGlzLm1BcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICAgICAgbWVzc2FnZTogJ1BhdGNoIGdlbmVyYXRlZCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICAgIHR5cGU6ICdzdWNjZXNzJyxcclxuICAgICAgICBkaXNwbGF5TVM6IDUwMDAsXHJcbiAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBnZW5lcmF0ZSBtb2QgbGltaXQgcGF0Y2gnLCBlcnIpO1xyXG4gICAgICB0aGlzLm1BcGkuZXZlbnRzLmVtaXQoJ3JlbW92ZS1tb2QnLCBHQU1FX0lELCBtb2ROYW1lKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kTmFtZSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0TGltaXRUZXh0KHQ6IGFueSkge1xyXG4gICAgcmV0dXJuIHQoJ1dpdGNoZXIgMyBpcyByZXN0cmljdGVkIHRvIDE5MiBmaWxlIGhhbmRsZXMgd2hpY2ggaXMgcXVpY2tseSByZWFjaGVkIHdoZW4gJ1xyXG4gICAgICArICdhZGRpbmcgbW9kcyAoYWJvdXQgfjI1IG1vZHMpIC0gVm9ydGV4IGhhcyBkZXRlY3RlZCB0aGF0IHRoZSBjdXJyZW50IG1vZHMgZW52aXJvbm1lbnQgbWF5IGJlICdcclxuICAgICAgKyAnYnJlYWNoaW5nIHRoaXMgbGltaXQ7IHRoaXMgaXNzdWUgd2lsbCB1c3VhbGx5IGV4aGliaXQgaXRzZWxmIGJ5IHRoZSBnYW1lIGZhaWxpbmcgdG8gc3RhcnQgdXAue3tibH19J1xyXG4gICAgICArICdWb3J0ZXggY2FuIGF0dGVtcHQgdG8gcGF0Y2ggeW91ciBnYW1lIGV4ZWN1dGFibGUgdG8gaW5jcmVhc2UgdGhlIGF2YWlsYWJsZSBmaWxlIGhhbmRsZXMgdG8gNTAwICdcclxuICAgICAgKyAnd2hpY2ggc2hvdWxkIGNhdGVyIGZvciBtb3N0IGlmIG5vdCBhbGwgbW9kZGluZyBlbnZpcm9ubWVudHMue3tibH19UGxlYXNlIG5vdGUgLSB0aGUgcGF0Y2ggaXMgYXBwbGllZCBhcyAnXHJcbiAgICAgICsgJ2EgbW9kIHdoaWNoIHdpbGwgYmUgZ2VuZXJhdGVkIGFuZCBhdXRvbWF0aWNhbGx5IGVuYWJsZWQ7IHRvIGRpc2FibGUgdGhlIHBhdGNoLCBzaW1wbHkgcmVtb3ZlIG9yIGRpc2FibGUgJ1xyXG4gICAgICArICd0aGUgXCJXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoZXJcIiBtb2QgYW5kIHRoZSBvcmlnaW5hbCBnYW1lIGV4ZWN1dGFibGUgd2lsbCBiZSByZXN0b3JlZC4nLFxyXG4gICAgICB7IG5zOiBJMThOX05BTUVTUEFDRSwgcmVwbGFjZTogeyBibDogJ1ticl1bL2JyXVticl1bL2JyXScsIGJyOiAnW2JyXVsvYnJdJyB9IH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBxdWVyeVBhdGNoKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgdCA9IHRoaXMubUFwaS50cmFuc2xhdGU7XHJcbiAgICBjb25zdCBtZXNzYWdlID0gdGhpcy5nZXRMaW1pdFRleHQodCk7XHJcbiAgICBjb25zdCByZXM6IHR5cGVzLklEaWFsb2dSZXN1bHQgPSBhd2FpdCAodGhpcy5tQXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ01vZCBMaW1pdCBQYXRjaCcsIHtcclxuICAgICAgYmJjb2RlOiBtZXNzYWdlLFxyXG4gICAgICBjaGVja2JveGVzOiBbXHJcbiAgICAgICAgeyBpZDogJ3N1cHByZXNzLWxpbWl0LXBhdGNoZXItdGVzdCcsIHRleHQ6ICdEbyBub3QgYXNrIGFnYWluJywgdmFsdWU6IGZhbHNlIH1cclxuICAgICAgXSxcclxuICAgIH0sIFtcclxuICAgICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcclxuICAgICAgeyBsYWJlbDogJ0dlbmVyYXRlIFBhdGNoJyB9LFxyXG4gICAgXSkgYXMgYW55KTtcclxuICAgIGlmIChyZXMuaW5wdXRbJ3N1cHByZXNzLWxpbWl0LXBhdGNoZXItdGVzdCddID09PSB0cnVlKSB7XHJcbiAgICAgIHRoaXMubUFwaS5zdG9yZS5kaXNwYXRjaChzZXRTdXBwcmVzc01vZExpbWl0UGF0Y2godHJ1ZSkpO1xyXG4gICAgfVxyXG4gICAgaWYgKHJlcy5hY3Rpb24gPT09ICdDYW5jZWwnKSB7XHJcbiAgICAgIHRocm93IG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgY3JlYXRlTW9kTGltaXRQYXRjaE1vZChtb2ROYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IG1vZCA9IHtcclxuICAgICAgaWQ6IG1vZE5hbWUsXHJcbiAgICAgIHN0YXRlOiAnaW5zdGFsbGVkJyxcclxuICAgICAgYXR0cmlidXRlczoge1xyXG4gICAgICAgIG5hbWU6ICdNb2QgTGltaXQgUGF0Y2hlcicsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdXaXRjaGVyIDMgaXMgcmVzdHJpY3RlZCB0byAxOTIgZmlsZSBoYW5kbGVzIHdoaWNoIGlzIHF1aWNrbHkgcmVhY2hlZCB3aGVuICdcclxuICAgICAgICAgICAgICAgICAgICsgJ2FkZGluZyBtb2RzIChhYm91dCB+MjUgbW9kcykgLSB0aGlzIG1vZCBpbmNyZWFzZXMgdGhlIGxpbWl0IHRvIDUwMCcsXHJcbiAgICAgICAgbG9naWNhbEZpbGVOYW1lOiAnV2l0Y2hlciAzIE1vZCBMaW1pdCBQYXRjaGVyJyxcclxuICAgICAgICBtb2RJZDogNDIsIC8vIE1lYW5pbmcgb2YgbGlmZVxyXG4gICAgICAgIHZlcnNpb246ICcxLjAuMCcsXHJcbiAgICAgICAgaW5zdGFsbFRpbWU6IG5ldyBEYXRlKCksXHJcbiAgICAgIH0sXHJcbiAgICAgIGluc3RhbGxhdGlvblBhdGg6IG1vZE5hbWUsXHJcbiAgICAgIHR5cGU6ICd3M21vZGxpbWl0cGF0Y2hlcicsXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMubUFwaS5ldmVudHMuZW1pdCgnY3JlYXRlLW1vZCcsIEdBTUVfSUQsIG1vZCwgYXN5bmMgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yICE9PSBudWxsKSB7XHJcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmxhc3RBY3RpdmVQcm9maWxlRm9yR2FtZSh0aGlzLm1BcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XHJcbiAgICAgICAgdGhpcy5tQXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kRW5hYmxlZChwcm9maWxlSWQsIG1vZE5hbWUsIHRydWUpKTtcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBoYXNTZXF1ZW5jZShzZXF1ZW5jZTogQnVmZmVyLCBjaHVuazogQnVmZmVyKSB7XHJcbiAgICBjb25zdCBmaXJzdFNlcUJ5dGUgPSBzZXF1ZW5jZVswXTtcclxuICAgIGxldCBmb3VuZFNlcSA9IGZhbHNlO1xyXG4gICAgbGV0IGl0ZXIgPSAwO1xyXG4gICAgd2hpbGUgKGl0ZXIgPCBjaHVuay5sZW5ndGgpIHtcclxuICAgICAgaWYgKCFmb3VuZFNlcSAmJiBjaHVua1tpdGVyXSA9PT0gZmlyc3RTZXFCeXRlKSB7XHJcbiAgICAgICAgY29uc3Qgc3ViQXJyYXkgPSBfLmNsb25lRGVlcChBcnJheS5mcm9tKGNodW5rLnNsaWNlKGl0ZXIsIGl0ZXIgKyBzZXF1ZW5jZS5sZW5ndGgpKSk7XHJcbiAgICAgICAgZm91bmRTZXEgPSBfLmlzRXF1YWwoc2VxdWVuY2UsIEJ1ZmZlci5mcm9tKHN1YkFycmF5KSk7XHJcbiAgICAgIH1cclxuICAgICAgaXRlcisrO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmb3VuZFNlcTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcGF0Y2hDaHVuayhjaHVuazogQnVmZmVyKTogQnVmZmVyIHtcclxuICAgIGNvbnN0IGlkeCA9IGNodW5rLmluZGV4T2YoQnVmZmVyLmZyb20oVU5QQVRDSEVEX1NFUSkpO1xyXG4gICAgY29uc3QgcGF0Y2hlZEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKFBBVENIRURfU0VRKTtcclxuICAgIGNvbnN0IGRhdGEgPSBCdWZmZXIuYWxsb2MoY2h1bmsubGVuZ3RoKTtcclxuICAgIGRhdGEuZmlsbChjaHVuay5zbGljZSgwLCBpZHgpLCAwLCBpZHgpO1xyXG4gICAgZGF0YS5maWxsKHBhdGNoZWRCdWZmZXIsIGlkeCwgaWR4ICsgcGF0Y2hlZEJ1ZmZlci5sZW5ndGgpO1xyXG4gICAgZGF0YS5maWxsKGNodW5rLnNsaWNlKGlkeCArIHBhdGNoZWRCdWZmZXIubGVuZ3RoKSwgaWR4ICsgcGF0Y2hlZEJ1ZmZlci5sZW5ndGgpO1xyXG4gICAgcmV0dXJuIGRhdGE7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIHN0cmVhbUV4ZWN1dGFibGUoc3RhcnQ6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kOiBudW1iZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVQYXRoOiBzdHJpbmcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGNvbnN0IHdyaXRlciA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKHRlbXBQYXRoKTtcclxuICAgICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XHJcbiAgICAgIGNvbnN0IHVucGF0Y2hlZCA9IEJ1ZmZlci5mcm9tKFVOUEFUQ0hFRF9TRVEpO1xyXG4gICAgICBjb25zdCBwYXRjaGVkID0gQnVmZmVyLmZyb20oUEFUQ0hFRF9TRVEpO1xyXG4gICAgICBjb25zdCBvbkVycm9yID0gKGVycjogRXJyb3IpID0+IHtcclxuICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSBmYWxzZTtcclxuICAgICAgICB3cml0ZXIuZW5kKCk7XHJcbiAgICAgICAgaWYgKCFzdHJlYW0uZGVzdHJveWVkKSB7XHJcbiAgICAgICAgICBzdHJlYW0uY2xvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xyXG4gICAgICB9O1xyXG4gICAgICBzdHJlYW0ub24oJ2VuZCcsICgpID0+IHtcclxuICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSBmYWxzZTtcclxuICAgICAgICB3cml0ZXIuZW5kKCk7XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHN0cmVhbS5vbignZXJyb3InLCBvbkVycm9yKTtcclxuICAgICAgc3RyZWFtLm9uKCdkYXRhJywgKChjaHVuazogQnVmZmVyKSA9PiB7XHJcbiAgICAgICAgaWYgKHRoaXMubUlzUGF0Y2hlZCB8fCAoc3RyZWFtLmJ5dGVzUmVhZCArIE9GRlNFVCkgPCBzdGFydCB8fCBzdHJlYW0uYnl0ZXNSZWFkID4gZW5kICsgT0ZGU0VUKSB7XHJcbiAgICAgICAgICB3cml0ZXIud3JpdGUoY2h1bmspO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5oYXNTZXF1ZW5jZSh1bnBhdGNoZWQsIGNodW5rKSkge1xyXG4gICAgICAgICAgICBjb25zdCBwYXRjaGVkQnVmZmVyID0gdGhpcy5wYXRjaENodW5rKGNodW5rKTtcclxuICAgICAgICAgICAgd3JpdGVyLndyaXRlKHBhdGNoZWRCdWZmZXIpO1xyXG4gICAgICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhhc1NlcXVlbmNlKHBhdGNoZWQsIGNodW5rKSkge1xyXG4gICAgICAgICAgICAvLyBleGVjIGlzIGFscmVhZHkgcGF0Y2hlZC5cclxuICAgICAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgd3JpdGVyLndyaXRlKGNodW5rKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShjaHVuayk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19