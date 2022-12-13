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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kTGltaXRQYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZExpbWl0UGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQXVCO0FBQ3ZCLGdEQUF3QjtBQUN4QiwyQ0FBaUU7QUFFakUsdUNBQXFEO0FBRXJELHFDQUFtRDtBQUVuRCxNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUM7QUFDN0IsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBRTNCLE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRXJFLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQztBQUVyQixNQUFhLGVBQWU7SUFJMUIsWUFBWSxHQUF3QjtRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztJQUMxQixDQUFDO0lBRVksbUJBQW1COztZQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25DLE1BQU0sSUFBSSxHQUFzQixzQkFBUyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ25FLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxnQkFBTyxDQUFDLENBQUM7WUFDOUQsSUFBSSxDQUFDLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksQ0FBQSxFQUFF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QkFDbkIsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQzVCLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxLQUFhLEVBQUUsRUFBRTtvQkFDbkMsSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsR0FBRyxLQUFLLElBQUksTUFBTSxDQUFDLFNBQVMsR0FBRyxHQUFHLEdBQUcsTUFBTSxFQUFFO3dCQUM3RixNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO3FCQUNyQjt5QkFBTTt3QkFDTCxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFOzRCQUN0QyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUM3QyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDOzRCQUM1QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzt5QkFDeEI7NkJBQU0sSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRTs0QkFFM0MsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7NEJBQ3ZCLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ3JCOzZCQUFNOzRCQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBQ3JCO3FCQUNGO2dCQUNILENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDTixDQUFDLENBQUMsQ0FBQztRQUNMLENBQUM7S0FBQTtDQUNGO0FBdkxELDBDQXVMQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgc2V0U3VwcHJlc3NNb2RMaW1pdFBhdGNoIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQsIEkxOE5fTkFNRVNQQUNFIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuY29uc3QgUkFOR0VfU1RBUlQgPSAweEI5NDAwMDtcclxuY29uc3QgUkFOR0VfRU5EID0gMHhCOTgwMDA7XHJcblxyXG5jb25zdCBVTlBBVENIRURfU0VRID0gWzB4QkEsIDB4QzAsIDB4MDAsIDB4MDAsIDB4MDAsIDB4NDgsIDB4OEQsIDB4NEJdO1xyXG5jb25zdCBQQVRDSEVEX1NFUSA9IFsweEJBLCAweEY0LCAweDAxLCAweDAwLCAweDAwLCAweDQ4LCAweDhELCAweDRCXTtcclxuXHJcbmNvbnN0IE9GRlNFVCA9IDY1NTM2O1xyXG5cclxuZXhwb3J0IGNsYXNzIE1vZExpbWl0UGF0Y2hlciB7XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbUlzUGF0Y2hlZDogYm9vbGVhbjtcclxuXHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgICB0aGlzLm1Jc1BhdGNoZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBlbnN1cmVNb2RMaW1pdFBhdGNoKCkge1xyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGdhbWU6IHR5cGVzLklHYW1lU3RvcmVkID0gc2VsZWN0b3JzLmdhbWVCeUlkKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbR0FNRV9JRF07XHJcbiAgICBpZiAoIWRpc2NvdmVyeT8ucGF0aCkge1xyXG4gICAgICB0aHJvdyBuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnKTtcclxuICAgIH1cclxuICAgIGF3YWl0IHRoaXMucXVlcnlQYXRjaCgpO1xyXG4gICAgY29uc3Qgc3RhZ2luZ1BhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IG1vZE5hbWUgPSAnTW9kIExpbWl0IFBhdGNoZXInO1xyXG4gICAgbGV0IG1vZDogdHlwZXMuSU1vZCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcclxuICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuY3JlYXRlTW9kTGltaXRQYXRjaE1vZChtb2ROYW1lKTtcclxuICAgICAgICBtb2QgPSB1dGlsLmdldFNhZmUodGhpcy5tQXBpLmdldFN0YXRlKCksXHJcbiAgICAgICAgICBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSUQsIG1vZE5hbWVdLCB1bmRlZmluZWQpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgc3JjID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBnYW1lLmV4ZWN1dGFibGUpO1xyXG4gICAgICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKHN0YWdpbmdQYXRoLCBtb2QuaW5zdGFsbGF0aW9uUGF0aCwgZ2FtZS5leGVjdXRhYmxlKTtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdClcclxuICAgICAgICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJ10uaW5jbHVkZXMoZXJyLmNvZGUpID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuICAgICAgYXdhaXQgZnMuY29weUFzeW5jKHNyYywgZGVzdCk7XHJcbiAgICAgIGNvbnN0IHRlbXBGaWxlID0gZGVzdCArICcudG1wJztcclxuICAgICAgYXdhaXQgdGhpcy5zdHJlYW1FeGVjdXRhYmxlKFJBTkdFX1NUQVJULCBSQU5HRV9FTkQsIGRlc3QsIHRlbXBGaWxlKTtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZGVzdCk7XHJcbiAgICAgIGF3YWl0IGZzLnJlbmFtZUFzeW5jKHRlbXBGaWxlLCBkZXN0KTtcclxuICAgICAgdGhpcy5tQXBpLnNlbmROb3RpZmljYXRpb24oe1xyXG4gICAgICAgIG1lc3NhZ2U6ICdQYXRjaCBnZW5lcmF0ZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgICB0eXBlOiAnc3VjY2VzcycsXHJcbiAgICAgICAgZGlzcGxheU1TOiA1MDAwLFxyXG4gICAgICB9KTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBjb25zdCBhbGxvd1JlcG9ydCA9ICEoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpXHJcbiAgICAgIHRoaXMubUFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBnZW5lcmF0ZSBtb2QgbGltaXQgcGF0Y2gnLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XHJcbiAgICAgIHRoaXMubUFwaS5ldmVudHMuZW1pdCgncmVtb3ZlLW1vZCcsIEdBTUVfSUQsIG1vZE5hbWUpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtb2ROYW1lKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBnZXRMaW1pdFRleHQodDogYW55KSB7XHJcbiAgICByZXR1cm4gdCgnV2l0Y2hlciAzIGlzIHJlc3RyaWN0ZWQgdG8gMTkyIGZpbGUgaGFuZGxlcyB3aGljaCBpcyBxdWlja2x5IHJlYWNoZWQgd2hlbiAnXHJcbiAgICAgICsgJ2FkZGluZyBtb2RzIChhYm91dCB+MjUgbW9kcykgLSBWb3J0ZXggaGFzIGRldGVjdGVkIHRoYXQgdGhlIGN1cnJlbnQgbW9kcyBlbnZpcm9ubWVudCBtYXkgYmUgJ1xyXG4gICAgICArICdicmVhY2hpbmcgdGhpcyBsaW1pdDsgdGhpcyBpc3N1ZSB3aWxsIHVzdWFsbHkgZXhoaWJpdCBpdHNlbGYgYnkgdGhlIGdhbWUgZmFpbGluZyB0byBzdGFydCB1cC57e2JsfX0nXHJcbiAgICAgICsgJ1ZvcnRleCBjYW4gYXR0ZW1wdCB0byBwYXRjaCB5b3VyIGdhbWUgZXhlY3V0YWJsZSB0byBpbmNyZWFzZSB0aGUgYXZhaWxhYmxlIGZpbGUgaGFuZGxlcyB0byA1MDAgJ1xyXG4gICAgICArICd3aGljaCBzaG91bGQgY2F0ZXIgZm9yIG1vc3QgaWYgbm90IGFsbCBtb2RkaW5nIGVudmlyb25tZW50cy57e2JsfX1QbGVhc2Ugbm90ZSAtIHRoZSBwYXRjaCBpcyBhcHBsaWVkIGFzICdcclxuICAgICAgKyAnYSBtb2Qgd2hpY2ggd2lsbCBiZSBnZW5lcmF0ZWQgYW5kIGF1dG9tYXRpY2FsbHkgZW5hYmxlZDsgdG8gZGlzYWJsZSB0aGUgcGF0Y2gsIHNpbXBseSByZW1vdmUgb3IgZGlzYWJsZSAnXHJcbiAgICAgICsgJ3RoZSBcIldpdGNoZXIgMyBNb2QgTGltaXQgUGF0Y2hlclwiIG1vZCBhbmQgdGhlIG9yaWdpbmFsIGdhbWUgZXhlY3V0YWJsZSB3aWxsIGJlIHJlc3RvcmVkLicsXHJcbiAgICAgIHsgbnM6IEkxOE5fTkFNRVNQQUNFLCByZXBsYWNlOiB7IGJsOiAnW2JyXVsvYnJdW2JyXVsvYnJdJywgYnI6ICdbYnJdWy9icl0nIH0gfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGFzeW5jIHF1ZXJ5UGF0Y2goKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCB0ID0gdGhpcy5tQXBpLnRyYW5zbGF0ZTtcclxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLmdldExpbWl0VGV4dCh0KTtcclxuICAgIGNvbnN0IHJlczogdHlwZXMuSURpYWxvZ1Jlc3VsdCA9IGF3YWl0ICh0aGlzLm1BcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIExpbWl0IFBhdGNoJywge1xyXG4gICAgICBiYmNvZGU6IG1lc3NhZ2UsXHJcbiAgICAgIGNoZWNrYm94ZXM6IFtcclxuICAgICAgICB7IGlkOiAnc3VwcHJlc3MtbGltaXQtcGF0Y2hlci10ZXN0JywgdGV4dDogJ0RvIG5vdCBhc2sgYWdhaW4nLCB2YWx1ZTogZmFsc2UgfVxyXG4gICAgICBdLFxyXG4gICAgfSwgW1xyXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxyXG4gICAgICB7IGxhYmVsOiAnR2VuZXJhdGUgUGF0Y2gnIH0sXHJcbiAgICBdKSBhcyBhbnkpO1xyXG4gICAgaWYgKHJlcy5pbnB1dFsnc3VwcHJlc3MtbGltaXQtcGF0Y2hlci10ZXN0J10gPT09IHRydWUpIHtcclxuICAgICAgdGhpcy5tQXBpLnN0b3JlLmRpc3BhdGNoKHNldFN1cHByZXNzTW9kTGltaXRQYXRjaCh0cnVlKSk7XHJcbiAgICB9XHJcbiAgICBpZiAocmVzLmFjdGlvbiA9PT0gJ0NhbmNlbCcpIHtcclxuICAgICAgdGhyb3cgbmV3IHV0aWwuVXNlckNhbmNlbGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjcmVhdGVNb2RMaW1pdFBhdGNoTW9kKG1vZE5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc3QgbW9kID0ge1xyXG4gICAgICBpZDogbW9kTmFtZSxcclxuICAgICAgc3RhdGU6ICdpbnN0YWxsZWQnLFxyXG4gICAgICBhdHRyaWJ1dGVzOiB7XHJcbiAgICAgICAgbmFtZTogJ01vZCBMaW1pdCBQYXRjaGVyJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ1dpdGNoZXIgMyBpcyByZXN0cmljdGVkIHRvIDE5MiBmaWxlIGhhbmRsZXMgd2hpY2ggaXMgcXVpY2tseSByZWFjaGVkIHdoZW4gJ1xyXG4gICAgICAgICAgICAgICAgICAgKyAnYWRkaW5nIG1vZHMgKGFib3V0IH4yNSBtb2RzKSAtIHRoaXMgbW9kIGluY3JlYXNlcyB0aGUgbGltaXQgdG8gNTAwJyxcclxuICAgICAgICBsb2dpY2FsRmlsZU5hbWU6ICdXaXRjaGVyIDMgTW9kIExpbWl0IFBhdGNoZXInLFxyXG4gICAgICAgIG1vZElkOiA0MiwgLy8gTWVhbmluZyBvZiBsaWZlXHJcbiAgICAgICAgdmVyc2lvbjogJzEuMC4wJyxcclxuICAgICAgICBpbnN0YWxsVGltZTogbmV3IERhdGUoKSxcclxuICAgICAgfSxcclxuICAgICAgaW5zdGFsbGF0aW9uUGF0aDogbW9kTmFtZSxcclxuICAgICAgdHlwZTogJ3czbW9kbGltaXRwYXRjaGVyJyxcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5tQXBpLmV2ZW50cy5lbWl0KCdjcmVhdGUtbW9kJywgR0FNRV9JRCwgbW9kLCBhc3luYyAoZXJyb3IpID0+IHtcclxuICAgICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcclxuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMubGFzdEFjdGl2ZVByb2ZpbGVGb3JHYW1lKHRoaXMubUFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcclxuICAgICAgICB0aGlzLm1BcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKHByb2ZpbGVJZCwgbW9kTmFtZSwgdHJ1ZSkpO1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGhhc1NlcXVlbmNlKHNlcXVlbmNlOiBCdWZmZXIsIGNodW5rOiBCdWZmZXIpIHtcclxuICAgIGNvbnN0IGZpcnN0U2VxQnl0ZSA9IHNlcXVlbmNlWzBdO1xyXG4gICAgbGV0IGZvdW5kU2VxID0gZmFsc2U7XHJcbiAgICBsZXQgaXRlciA9IDA7XHJcbiAgICB3aGlsZSAoaXRlciA8IGNodW5rLmxlbmd0aCkge1xyXG4gICAgICBpZiAoIWZvdW5kU2VxICYmIGNodW5rW2l0ZXJdID09PSBmaXJzdFNlcUJ5dGUpIHtcclxuICAgICAgICBjb25zdCBzdWJBcnJheSA9IF8uY2xvbmVEZWVwKEFycmF5LmZyb20oY2h1bmsuc2xpY2UoaXRlciwgaXRlciArIHNlcXVlbmNlLmxlbmd0aCkpKTtcclxuICAgICAgICBmb3VuZFNlcSA9IF8uaXNFcXVhbChzZXF1ZW5jZSwgQnVmZmVyLmZyb20oc3ViQXJyYXkpKTtcclxuICAgICAgfVxyXG4gICAgICBpdGVyKys7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZvdW5kU2VxO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBwYXRjaENodW5rKGNodW5rOiBCdWZmZXIpOiBCdWZmZXIge1xyXG4gICAgY29uc3QgaWR4ID0gY2h1bmsuaW5kZXhPZihCdWZmZXIuZnJvbShVTlBBVENIRURfU0VRKSk7XHJcbiAgICBjb25zdCBwYXRjaGVkQnVmZmVyID0gQnVmZmVyLmZyb20oUEFUQ0hFRF9TRVEpO1xyXG4gICAgY29uc3QgZGF0YSA9IEJ1ZmZlci5hbGxvYyhjaHVuay5sZW5ndGgpO1xyXG4gICAgZGF0YS5maWxsKGNodW5rLnNsaWNlKDAsIGlkeCksIDAsIGlkeCk7XHJcbiAgICBkYXRhLmZpbGwocGF0Y2hlZEJ1ZmZlciwgaWR4LCBpZHggKyBwYXRjaGVkQnVmZmVyLmxlbmd0aCk7XHJcbiAgICBkYXRhLmZpbGwoY2h1bmsuc2xpY2UoaWR4ICsgcGF0Y2hlZEJ1ZmZlci5sZW5ndGgpLCBpZHggKyBwYXRjaGVkQnVmZmVyLmxlbmd0aCk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgc3RyZWFtRXhlY3V0YWJsZShzdGFydDogbnVtYmVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmQ6IG51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IHN0cmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcFBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgY29uc3Qgd3JpdGVyID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odGVtcFBhdGgpO1xyXG4gICAgICBjb25zdCBzdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKTtcclxuICAgICAgY29uc3QgdW5wYXRjaGVkID0gQnVmZmVyLmZyb20oVU5QQVRDSEVEX1NFUSk7XHJcbiAgICAgIGNvbnN0IHBhdGNoZWQgPSBCdWZmZXIuZnJvbShQQVRDSEVEX1NFUSk7XHJcbiAgICAgIGNvbnN0IG9uRXJyb3IgPSAoZXJyOiBFcnJvcikgPT4ge1xyXG4gICAgICAgIHRoaXMubUlzUGF0Y2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIHdyaXRlci5lbmQoKTtcclxuICAgICAgICBpZiAoIXN0cmVhbS5kZXN0cm95ZWQpIHtcclxuICAgICAgICAgIHN0cmVhbS5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XHJcbiAgICAgIH07XHJcbiAgICAgIHN0cmVhbS5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMubUlzUGF0Y2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIHdyaXRlci5lbmQoKTtcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZSgpO1xyXG4gICAgICB9KTtcclxuICAgICAgc3RyZWFtLm9uKCdlcnJvcicsIG9uRXJyb3IpO1xyXG4gICAgICBzdHJlYW0ub24oJ2RhdGEnLCAoKGNodW5rOiBCdWZmZXIpID0+IHtcclxuICAgICAgICBpZiAodGhpcy5tSXNQYXRjaGVkIHx8IChzdHJlYW0uYnl0ZXNSZWFkICsgT0ZGU0VUKSA8IHN0YXJ0IHx8IHN0cmVhbS5ieXRlc1JlYWQgPiBlbmQgKyBPRkZTRVQpIHtcclxuICAgICAgICAgIHdyaXRlci53cml0ZShjaHVuayk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICh0aGlzLmhhc1NlcXVlbmNlKHVucGF0Y2hlZCwgY2h1bmspKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGNoZWRCdWZmZXIgPSB0aGlzLnBhdGNoQ2h1bmsoY2h1bmspO1xyXG4gICAgICAgICAgICB3cml0ZXIud3JpdGUocGF0Y2hlZEJ1ZmZlcik7XHJcbiAgICAgICAgICAgIHRoaXMubUlzUGF0Y2hlZCA9IHRydWU7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaGFzU2VxdWVuY2UocGF0Y2hlZCwgY2h1bmspKSB7XHJcbiAgICAgICAgICAgIC8vIGV4ZWMgaXMgYWxyZWFkeSBwYXRjaGVkLlxyXG4gICAgICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB3cml0ZXIud3JpdGUoY2h1bmspO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd3JpdGVyLndyaXRlKGNodW5rKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXX0=