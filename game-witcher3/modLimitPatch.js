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
                this.mApi.store.dispatch(actions_1.setSuppressModLimitPatch(true));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kTGltaXRQYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZExpbWl0UGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQXVCO0FBQ3ZCLGdEQUF3QjtBQUN4QiwyQ0FBaUU7QUFFakUsdUNBQXFEO0FBRXJELHFDQUFtRDtBQUVuRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFDN0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBRTNCLE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRXJFLE1BQWEsZUFBZTtJQUkxQixZQUFZLEdBQXdCO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO0lBQzFCLENBQUM7SUFFWSxtQkFBbUI7O1lBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbkMsTUFBTSxJQUFJLEdBQXNCLHNCQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7WUFDbkUsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLGdCQUFPLENBQUMsQ0FBQztZQUM5RCxJQUFJLEVBQUMsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksQ0FBQSxFQUFFO2dCQUNwQixNQUFNLElBQUksaUJBQUksQ0FBQyxlQUFlLENB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RUFBRTtvQkFDbkMsSUFBSSxJQUFJLENBQUMsVUFBVTsyQkFDZCxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzJCQUMzQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUU7d0JBQzlDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7cUJBQ3JCO3lCQUFNO3dCQUNMLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQUU7NEJBQ3RDLE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7NEJBQzdDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUM7NEJBQzVCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO3lCQUN4Qjs2QkFBTSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxFQUFFOzRCQUUzQyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzs0QkFDdkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt5QkFDckI7NkJBQU07NEJBQ0wsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzt5QkFDckI7cUJBQ0Y7Z0JBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNOLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0NBQ0Y7QUF4TEQsMENBd0xDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBzZXRTdXBwcmVzc01vZExpbWl0UGF0Y2ggfSBmcm9tICcuL2FjdGlvbnMnO1xyXG5cclxuaW1wb3J0IHsgR0FNRV9JRCwgSTE4Tl9OQU1FU1BBQ0UgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5jb25zdCBSQU5HRV9TVEFSVCA9IDB4Qjk0MDAwO1xyXG5jb25zdCBSQU5HRV9FTkQgPSAweEI5ODAwMDtcclxuXHJcbmNvbnN0IFVOUEFUQ0hFRF9TRVEgPSBbMHhCQSwgMHhDMCwgMHgwMCwgMHgwMCwgMHgwMCwgMHg0OCwgMHg4RCwgMHg0Ql07XHJcbmNvbnN0IFBBVENIRURfU0VRID0gWzB4QkEsIDB4RjQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4NDgsIDB4OEQsIDB4NEJdO1xyXG5cclxuZXhwb3J0IGNsYXNzIE1vZExpbWl0UGF0Y2hlciB7XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbUlzUGF0Y2hlZDogYm9vbGVhbjtcclxuXHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgICB0aGlzLm1Jc1BhdGNoZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBlbnN1cmVNb2RMaW1pdFBhdGNoKCkge1xyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGdhbWU6IHR5cGVzLklHYW1lU3RvcmVkID0gc2VsZWN0b3JzLmdhbWVCeUlkKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbR0FNRV9JRF07XHJcbiAgICBpZiAoIWRpc2NvdmVyeT8ucGF0aCkge1xyXG4gICAgICB0aHJvdyBuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnKTtcclxuICAgIH1cclxuICAgIGF3YWl0IHRoaXMucXVlcnlQYXRjaCgpO1xyXG4gICAgY29uc3Qgc3RhZ2luZ1BhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSAnTW9kIExpbWl0IFBhdGNoZXInO1xyXG4gICAgbGV0IG1vZDogdHlwZXMuSU1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcclxuICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlTW9kTGltaXRQYXRjaE1vZChtb2ROYW1lKTtcclxuICAgICAgICBtb2QgPSB1dGlsLmdldFNhZmUodGhpcy5tQXBpLmdldFN0YXRlKCksXHJcbiAgICAgICAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgc3JjID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBnYW1lLmV4ZWN1dGFibGUpO1xyXG4gICAgICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKHN0YWdpbmdQYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCwgZ2FtZS5leGVjdXRhYmxlKTtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdClcclxuICAgICAgICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJ10uaW5jbHVkZXMoZXJyLmNvZGUpID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgICAgYXdhaXQgZnMuY29weUFzeW5jKHNyYywgZGVzdCk7XHJcbiAgICAgIGNvbnN0IHRlbXBGaWxlID0gZGVzdCArICcudG1wJztcclxuICAgICAgYXdhaXQgdGhpcy5zdHJlYW1FeGVjdXRhYmxlKFJBTkdFX1NUQVJULCBSQU5HRV9FTkQsIGRlc3QsIHRlbXBGaWxlKTtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdCk7XHJcbiAgICAgIGF3YWl0IGZzLnJlbmFtZUFzeW5jKHRlbXBGaWxlLCBkZXN0KTtcclxuICAgICAgdGhpcy5tQXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgIG1lc3NhZ2U6ICdQYXRjaCBnZW5lcmF0ZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgICB0eXBlOiAnc3VjY2VzcycsXHJcbiAgICAgICAgZGlzcGxheU1TOiA1MDAwLFxyXG4gICAgICB9KTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICB0aGlzLm1BcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gZ2VuZXJhdGUgbW9kIGxpbWl0IHBhdGNoJywgZXJyKTtcclxuICAgICAgdGhpcy5tQXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kJywgR0FNRV9JRCwgbW9kTmFtZSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1vZE5hbWUpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGdldExpbWl0VGV4dCh0OiBhbnkpIHtcclxuICAgIHJldHVybiB0KCdXaXRjaGVyIDMgaXMgcmVzdHJpY3RlZCB0byAxOTIgZmlsZSBoYW5kbGVzIHdoaWNoIGlzIHF1aWNrbHkgcmVhY2hlZCB3aGVuICdcclxuICAgICAgKyAnYWRkaW5nIG1vZHMgKGFib3V0IH4yNSBtb2RzKSAtIFZvcnRleCBoYXMgZGV0ZWN0ZWQgdGhhdCB0aGUgY3VycmVudCBtb2RzIGVudmlyb25tZW50IG1heSBiZSAnXHJcbiAgICAgICsgJ2JyZWFjaGluZyB0aGlzIGxpbWl0OyB0aGlzIGlzc3VlIHdpbGwgdXN1YWxseSBleGhpYml0IGl0c2VsZiBieSB0aGUgZ2FtZSBmYWlsaW5nIHRvIHN0YXJ0IHVwLnt7Ymx9fSdcclxuICAgICAgKyAnVm9ydGV4IGNhbiBhdHRlbXB0IHRvIHBhdGNoIHlvdXIgZ2FtZSBleGVjdXRhYmxlIHRvIGluY3JlYXNlIHRoZSBhdmFpbGFibGUgZmlsZSBoYW5kbGVzIHRvIDUwMCAnXHJcbiAgICAgICsgJ3doaWNoIHNob3VsZCBjYXRlciBmb3IgbW9zdCBpZiBub3QgYWxsIG1vZGRpbmcgZW52aXJvbm1lbnRzLnt7Ymx9fVBsZWFzZSBub3RlIC0gdGhlIHBhdGNoIGlzIGFwcGxpZWQgYXMgJ1xyXG4gICAgICArICdhIG1vZCB3aGljaCB3aWxsIGJlIGdlbmVyYXRlZCBhbmQgYXV0b21hdGljYWxseSBlbmFibGVkOyB0byBkaXNhYmxlIHRoZSBwYXRjaCwgc2ltcGx5IHJlbW92ZSBvciBkaXNhYmxlICdcclxuICAgICAgKyAndGhlIFwiV2l0Y2hlciAzIE1vZCBMaW1pdCBQYXRjaGVyXCIgbW9kIGFuZCB0aGUgb3JpZ2luYWwgZ2FtZSBleGVjdXRhYmxlIHdpbGwgYmUgcmVzdG9yZWQuJyxcclxuICAgICAgeyBuczogSTE4Tl9OQU1FU1BBQ0UsIHJlcGxhY2U6IHsgYmw6ICdbYnJdWy9icl1bYnJdWy9icl0nLCBicjogJ1ticl1bL2JyXScgfSB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgcXVlcnlQYXRjaCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IHQgPSB0aGlzLm1BcGkudHJhbnNsYXRlO1xyXG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuZ2V0TGltaXRUZXh0KHQpO1xyXG4gICAgY29uc3QgcmVzOiB0eXBlcy5JRGlhbG9nUmVzdWx0ID0gYXdhaXQgKHRoaXMubUFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdNb2QgTGltaXQgUGF0Y2gnLCB7XHJcbiAgICAgIGJiY29kZTogbWVzc2FnZSxcclxuICAgICAgY2hlY2tib3hlczogW1xyXG4gICAgICAgIHsgaWQ6ICdzdXBwcmVzcy1saW1pdC1wYXRjaGVyLXRlc3QnLCB0ZXh0OiAnRG8gbm90IGFzayBhZ2FpbicsIHZhbHVlOiBmYWxzZSB9XHJcbiAgICAgIF0sXHJcbiAgICB9LCBbXHJcbiAgICAgIHsgbGFiZWw6ICdDYW5jZWwnIH0sXHJcbiAgICAgIHsgbGFiZWw6ICdHZW5lcmF0ZSBQYXRjaCcgfSxcclxuICAgIF0pIGFzIGFueSk7XHJcbiAgICBpZiAocmVzLmlucHV0WydzdXBwcmVzcy1saW1pdC1wYXRjaGVyLXRlc3QnXSA9PT0gdHJ1ZSkge1xyXG4gICAgICB0aGlzLm1BcGkuc3RvcmUuZGlzcGF0Y2goc2V0U3VwcHJlc3NNb2RMaW1pdFBhdGNoKHRydWUpKTtcclxuICAgIH1cclxuICAgIGlmIChyZXMuYWN0aW9uID09PSAnQ2FuY2VsJykge1xyXG4gICAgICB0aHJvdyBuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNyZWF0ZU1vZExpbWl0UGF0Y2hNb2QobW9kTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCBtb2QgPSB7XHJcbiAgICAgIGlkOiBtb2ROYW1lLFxyXG4gICAgICBzdGF0ZTogJ2luc3RhbGxlZCcsXHJcbiAgICAgIGF0dHJpYnV0ZXM6IHtcclxuICAgICAgICBuYW1lOiAnTW9kIExpbWl0IFBhdGNoZXInLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV2l0Y2hlciAzIGlzIHJlc3RyaWN0ZWQgdG8gMTkyIGZpbGUgaGFuZGxlcyB3aGljaCBpcyBxdWlja2x5IHJlYWNoZWQgd2hlbiAnXHJcbiAgICAgICAgICAgICAgICAgICArICdhZGRpbmcgbW9kcyAoYWJvdXQgfjI1IG1vZHMpIC0gdGhpcyBtb2QgaW5jcmVhc2VzIHRoZSBsaW1pdCB0byA1MDAnLFxyXG4gICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogJ1dpdGNoZXIgMyBNb2QgTGltaXQgUGF0Y2hlcicsXHJcbiAgICAgICAgbW9kSWQ6IDQyLCAvLyBNZWFuaW5nIG9mIGxpZmVcclxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxyXG4gICAgICAgIGluc3RhbGxUaW1lOiBuZXcgRGF0ZSgpLFxyXG4gICAgICB9LFxyXG4gICAgICBpbnN0YWxsYXRpb25QYXRoOiBtb2ROYW1lLFxyXG4gICAgICB0eXBlOiAndzNtb2RsaW1pdHBhdGNoZXInLFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLm1BcGkuZXZlbnRzLmVtaXQoJ2NyZWF0ZS1tb2QnLCBHQU1FX0lELCBtb2QsIGFzeW5jIChlcnJvcikgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUodGhpcy5tQXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gICAgICAgIHRoaXMubUFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQocHJvZmlsZUlkLCBtb2ROYW1lLCB0cnVlKSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFzU2VxdWVuY2Uoc2VxdWVuY2U6IEJ1ZmZlciwgY2h1bms6IEJ1ZmZlcikge1xyXG4gICAgY29uc3QgZmlyc3RTZXFCeXRlID0gc2VxdWVuY2VbMF07XHJcbiAgICBsZXQgZm91bmRTZXEgPSBmYWxzZTtcclxuICAgIGxldCBpdGVyID0gMDtcclxuICAgIHdoaWxlIChpdGVyIDwgY2h1bmsubGVuZ3RoKSB7XHJcbiAgICAgIGlmICghZm91bmRTZXEgJiYgY2h1bmtbaXRlcl0gPT09IGZpcnN0U2VxQnl0ZSkge1xyXG4gICAgICAgIGNvbnN0IHN1YkFycmF5ID0gXy5jbG9uZURlZXAoQXJyYXkuZnJvbShjaHVuay5zbGljZShpdGVyLCBpdGVyICsgc2VxdWVuY2UubGVuZ3RoKSkpO1xyXG4gICAgICAgIGZvdW5kU2VxID0gXy5pc0VxdWFsKHNlcXVlbmNlLCBCdWZmZXIuZnJvbShzdWJBcnJheSkpO1xyXG4gICAgICB9XHJcbiAgICAgIGl0ZXIrKztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZm91bmRTZXE7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHBhdGNoQ2h1bmsoY2h1bms6IEJ1ZmZlcik6IEJ1ZmZlciB7XHJcbiAgICBjb25zdCBpZHggPSBjaHVuay5pbmRleE9mKEJ1ZmZlci5mcm9tKFVOUEFUQ0hFRF9TRVEpKTtcclxuICAgIGNvbnN0IHBhdGNoZWRCdWZmZXIgPSBCdWZmZXIuZnJvbShQQVRDSEVEX1NFUSk7XHJcbiAgICBjb25zdCBkYXRhID0gQnVmZmVyLmFsbG9jKGNodW5rLmxlbmd0aCk7XHJcbiAgICBkYXRhLmZpbGwoY2h1bmsuc2xpY2UoMCwgaWR4KSwgMCwgaWR4KTtcclxuICAgIGRhdGEuZmlsbChwYXRjaGVkQnVmZmVyLCBpZHgsIGlkeCArIHBhdGNoZWRCdWZmZXIubGVuZ3RoKTtcclxuICAgIGRhdGEuZmlsbChjaHVuay5zbGljZShpZHggKyBwYXRjaGVkQnVmZmVyLmxlbmd0aCksIGlkeCArIHBhdGNoZWRCdWZmZXIubGVuZ3RoKTtcclxuICAgIHJldHVybiBkYXRhO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBzdHJlYW1FeGVjdXRhYmxlKHN0YXJ0OiBudW1iZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZDogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogc3RyaW5nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCB3cml0ZXIgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh0ZW1wUGF0aCk7XHJcbiAgICAgIGNvbnN0IHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCB1bnBhdGNoZWQgPSBCdWZmZXIuZnJvbShVTlBBVENIRURfU0VRKTtcclxuICAgICAgY29uc3QgcGF0Y2hlZCA9IEJ1ZmZlci5mcm9tKFBBVENIRURfU0VRKTtcclxuICAgICAgY29uc3Qgb25FcnJvciA9IChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gZmFsc2U7XHJcbiAgICAgICAgd3JpdGVyLmVuZCgpO1xyXG4gICAgICAgIGlmICghc3RyZWFtLmRlc3Ryb3llZCkge1xyXG4gICAgICAgICAgc3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgICAgfTtcclxuICAgICAgc3RyZWFtLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gZmFsc2U7XHJcbiAgICAgICAgd3JpdGVyLmVuZCgpO1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBzdHJlYW0ub24oJ2Vycm9yJywgb25FcnJvcik7XHJcbiAgICAgIHN0cmVhbS5vbignZGF0YScsICgoY2h1bms6IEJ1ZmZlcikgPT4ge1xyXG4gICAgICAgIGlmICh0aGlzLm1Jc1BhdGNoZWRcclxuICAgICAgICAgIHx8IChzdHJlYW0uYnl0ZXNSZWFkIDwgKHN0YXJ0ICsgY2h1bmsubGVuZ3RoKSlcclxuICAgICAgICAgIHx8IChzdHJlYW0uYnl0ZXNSZWFkID4gKGVuZCArIGNodW5rLmxlbmd0aCkpKSB7XHJcbiAgICAgICAgICB3cml0ZXIud3JpdGUoY2h1bmspO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5oYXNTZXF1ZW5jZSh1bnBhdGNoZWQsIGNodW5rKSkge1xyXG4gICAgICAgICAgICBjb25zdCBwYXRjaGVkQnVmZmVyID0gdGhpcy5wYXRjaENodW5rKGNodW5rKTtcclxuICAgICAgICAgICAgd3JpdGVyLndyaXRlKHBhdGNoZWRCdWZmZXIpO1xyXG4gICAgICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhhc1NlcXVlbmNlKHBhdGNoZWQsIGNodW5rKSkge1xyXG4gICAgICAgICAgICAvLyBleGVjIGlzIGFscmVhZHkgcGF0Y2hlZC5cclxuICAgICAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgd3JpdGVyLndyaXRlKGNodW5rKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHdyaXRlci53cml0ZShjaHVuayk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19