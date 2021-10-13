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
            }
            catch (err) {
                this.mApi.events.emit('remove-mod', common_1.GAME_ID, modName);
                return Promise.reject(err);
            }
            return Promise.resolve(modName);
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
                    if (this.mIsPatched || (stream.bytesRead + 65536) < start || stream.bytesRead > end + 65536) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kTGltaXRQYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZExpbWl0UGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsb0RBQXVCO0FBQ3ZCLGdEQUF3QjtBQUN4QiwyQ0FBaUU7QUFFakUscUNBQW1DO0FBRW5DLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUM3QixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUM7QUFFM0IsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDdkUsTUFBTSxXQUFXLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFFckUsTUFBYSxlQUFlO0lBSTFCLFlBQVksR0FBd0I7UUFDbEMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7UUFDaEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDMUIsQ0FBQztJQUVZLG1CQUFtQjs7WUFDOUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuQyxNQUFNLElBQUksR0FBc0Isc0JBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLGdCQUFPLENBQUMsQ0FBQztZQUNuRSxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsZ0JBQU8sQ0FBQyxDQUFDO1lBQzlELElBQUksRUFBQyxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxDQUFBLEVBQUU7Z0JBQ3BCLE1BQU0sSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO2FBQzFEO1lBQ0QsTUFBTSxXQUFXLEdBQUcsc0JBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sT0FBTyxHQUFHLG1CQUFtQixDQUFDO1lBQ3BDLElBQUksR0FBRyxHQUFlLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUMvRixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUU7Z0JBQ3JCLElBQUk7b0JBQ0YsTUFBTSxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQUM7b0JBQzNDLEdBQUcsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUNyQyxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sRUFBRSxPQUFPLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztpQkFDeEQ7Z0JBQUMsT0FBTyxHQUFHLEVBQUU7b0JBQ1osT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUM1QjthQUNGO1lBQ0QsSUFBSTtnQkFDRixNQUFNLEdBQUcsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLElBQUksR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO3FCQUN2QixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN6RixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUM5QixNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsTUFBTSxDQUFDO2dCQUMvQixNQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDcEUsTUFBTSxlQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMzQixNQUFNLGVBQUUsQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQ3RDO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxnQkFBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUN0RCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDNUI7WUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsQ0FBQztLQUFBO0lBRU8sc0JBQXNCLENBQUMsT0FBZTtRQUM1QyxNQUFNLEdBQUcsR0FBRztZQUNWLEVBQUUsRUFBRSxPQUFPO1lBQ1gsS0FBSyxFQUFFLFdBQVc7WUFDbEIsVUFBVSxFQUFFO2dCQUNWLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLFdBQVcsRUFBRSw0RUFBNEU7c0JBQzVFLG9FQUFvRTtnQkFDakYsZUFBZSxFQUFFLDZCQUE2QjtnQkFDOUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsT0FBTyxFQUFFLE9BQU87Z0JBQ2hCLFdBQVcsRUFBRSxJQUFJLElBQUksRUFBRTthQUN4QjtZQUNELGdCQUFnQixFQUFFLE9BQU87WUFDekIsSUFBSSxFQUFFLG1CQUFtQjtTQUMxQixDQUFDO1FBRUYsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNyQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGdCQUFPLEVBQUUsR0FBRyxFQUFFLENBQU8sS0FBSyxFQUFFLEVBQUU7Z0JBQ2hFLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtvQkFDbEIsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ3RCO2dCQUNELE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQkFBTyxDQUFDLENBQUM7Z0JBQ3BGLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQzFFLE9BQU8sT0FBTyxFQUFFLENBQUM7WUFDbkIsQ0FBQyxDQUFBLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVPLFdBQVcsQ0FBQyxRQUFnQixFQUFFLEtBQWE7UUFDakQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pDLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQztRQUNyQixJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7UUFDYixPQUFPLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFO1lBQzFCLElBQUksQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLFlBQVksRUFBRTtnQkFDN0MsTUFBTSxRQUFRLEdBQUcsZ0JBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDcEYsUUFBUSxHQUFHLGdCQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7YUFDdkQ7WUFDRCxJQUFJLEVBQUUsQ0FBQztTQUNSO1FBRUQsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVPLFVBQVUsQ0FBQyxLQUFhO1FBQzlCLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDL0MsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLEVBQUUsR0FBRyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvRSxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFYSxnQkFBZ0IsQ0FBQyxLQUFhLEVBQUUsR0FBVyxFQUFFLFFBQWdCLEVBQUUsUUFBZ0I7O1lBQzNGLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7Z0JBQ3JDLE1BQU0sTUFBTSxHQUFHLGVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDOUMsTUFBTSxNQUFNLEdBQUcsZUFBRSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUM3QyxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2dCQUN6QyxNQUFNLE9BQU8sR0FBRyxDQUFDLEdBQVUsRUFBRSxFQUFFO29CQUM3QixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztvQkFDeEIsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO3dCQUNyQixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7cUJBQ2hCO29CQUNELE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNyQixDQUFDLENBQUM7Z0JBQ0YsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO29CQUNwQixJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztvQkFDeEIsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUNiLE9BQU8sT0FBTyxFQUFFLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxDQUFDO2dCQUNILE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM1QixNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsS0FBYSxFQUFFLEVBQUU7b0JBQ25DLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDLEdBQUcsS0FBSyxJQUFJLE1BQU0sQ0FBQyxTQUFTLEdBQUcsR0FBRyxHQUFHLEtBQUssRUFBRTt3QkFDM0YsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDckI7eUJBQU07d0JBQ0wsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsRUFBRTs0QkFDdEMsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDN0MsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsQ0FBQzs0QkFDNUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7eUJBQ3hCOzZCQUFNLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLEVBQUU7NEJBRTNDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDOzRCQUN2QixNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO3lCQUNyQjs2QkFBTTs0QkFDTCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO3lCQUNyQjtxQkFDRjtnQkFDSCxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ04sQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDO0tBQUE7Q0FDRjtBQTNJRCwwQ0EySUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5jb25zdCBSQU5HRV9TVEFSVCA9IDB4Qjk0MDAwO1xyXG5jb25zdCBSQU5HRV9FTkQgPSAweEI5ODAwMDtcclxuXHJcbmNvbnN0IFVOUEFUQ0hFRF9TRVEgPSBbMHhCQSwgMHhDMCwgMHgwMCwgMHgwMCwgMHgwMCwgMHg0OCwgMHg4RCwgMHg0Ql07XHJcbmNvbnN0IFBBVENIRURfU0VRID0gWzB4QkEsIDB4RjQsIDB4MDEsIDB4MDAsIDB4MDAsIDB4NDgsIDB4OEQsIDB4NEJdO1xyXG5cclxuZXhwb3J0IGNsYXNzIE1vZExpbWl0UGF0Y2hlciB7XHJcbiAgcHJpdmF0ZSBtQXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xyXG4gIHByaXZhdGUgbUlzUGF0Y2hlZDogYm9vbGVhbjtcclxuXHJcbiAgY29uc3RydWN0b3IoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XHJcbiAgICB0aGlzLm1BcGkgPSBhcGk7XHJcbiAgICB0aGlzLm1Jc1BhdGNoZWQgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBhc3luYyBlbnN1cmVNb2RMaW1pdFBhdGNoKCkge1xyXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLm1BcGkuZ2V0U3RhdGUoKTtcclxuICAgIGNvbnN0IGdhbWU6IHR5cGVzLklHYW1lU3RvcmVkID0gc2VsZWN0b3JzLmdhbWVCeUlkKHN0YXRlLCBHQU1FX0lEKTtcclxuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbR0FNRV9JRF07XHJcbiAgICBpZiAoIWRpc2NvdmVyeT8ucGF0aCkge1xyXG4gICAgICB0aHJvdyBuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHN0YWdpbmdQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBtb2ROYW1lID0gJ01vZCBMaW1pdCBQYXRjaGVyJztcclxuICAgIGxldCBtb2Q6IHR5cGVzLklNb2QgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRCwgbW9kTmFtZV0sIHVuZGVmaW5lZCk7XHJcbiAgICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCB0aGlzLmNyZWF0ZU1vZExpbWl0UGF0Y2hNb2QobW9kTmFtZSk7XHJcbiAgICAgICAgbW9kID0gdXRpbC5nZXRTYWZlKHRoaXMubUFwaS5nZXRTdGF0ZSgpLFxyXG4gICAgICAgICAgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lELCBtb2ROYW1lXSwgdW5kZWZpbmVkKTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHNyYyA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZ2FtZS5leGVjdXRhYmxlKTtcclxuICAgICAgY29uc3QgZGVzdCA9IHBhdGguam9pbihzdGFnaW5nUGF0aCwgbW9kLmluc3RhbGxhdGlvblBhdGgsIGdhbWUuZXhlY3V0YWJsZSk7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGRlc3QpXHJcbiAgICAgICAgLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCddLmluY2x1ZGVzKGVyci5jb2RlKSA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhzcmMsIGRlc3QpO1xyXG4gICAgICBjb25zdCB0ZW1wRmlsZSA9IGRlc3QgKyAnLnRtcCc7XHJcbiAgICAgIGF3YWl0IHRoaXMuc3RyZWFtRXhlY3V0YWJsZShSQU5HRV9TVEFSVCwgUkFOR0VfRU5ELCBkZXN0LCB0ZW1wRmlsZSk7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGRlc3QpO1xyXG4gICAgICBhd2FpdCBmcy5yZW5hbWVBc3luYyh0ZW1wRmlsZSwgZGVzdCk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgdGhpcy5tQXBpLmV2ZW50cy5lbWl0KCdyZW1vdmUtbW9kJywgR0FNRV9JRCwgbW9kTmFtZSk7XHJcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobW9kTmFtZSk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNyZWF0ZU1vZExpbWl0UGF0Y2hNb2QobW9kTmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBjb25zdCBtb2QgPSB7XHJcbiAgICAgIGlkOiBtb2ROYW1lLFxyXG4gICAgICBzdGF0ZTogJ2luc3RhbGxlZCcsXHJcbiAgICAgIGF0dHJpYnV0ZXM6IHtcclxuICAgICAgICBuYW1lOiAnTW9kIExpbWl0IFBhdGNoZXInLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnV2l0Y2hlciAzIGlzIHJlc3RyaWN0ZWQgdG8gMTkyIGZpbGUgaGFuZGxlcyB3aGljaCBpcyBxdWlja2x5IHJlYWNoZWQgd2hlbiAnXHJcbiAgICAgICAgICAgICAgICAgICArICdhZGRpbmcgbW9kcyAoYWJvdXQgfjI1IG1vZHMpIC0gdGhpcyBtb2QgaW5jcmVhc2VzIHRoZSBsaW1pdCB0byA1MDAnLFxyXG4gICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogJ1dpdGNoZXIgMyBNb2QgTGltaXQgUGF0Y2hlcicsXHJcbiAgICAgICAgbW9kSWQ6IDQyLCAvLyBNZWFuaW5nIG9mIGxpZmVcclxuICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxyXG4gICAgICAgIGluc3RhbGxUaW1lOiBuZXcgRGF0ZSgpLFxyXG4gICAgICB9LFxyXG4gICAgICBpbnN0YWxsYXRpb25QYXRoOiBtb2ROYW1lLFxyXG4gICAgICB0eXBlOiAndzNtb2RsaW1pdHBhdGNoZXInLFxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLm1BcGkuZXZlbnRzLmVtaXQoJ2NyZWF0ZS1tb2QnLCBHQU1FX0lELCBtb2QsIGFzeW5jIChlcnJvcikgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvciAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUodGhpcy5tQXBpLmdldFN0YXRlKCksIEdBTUVfSUQpO1xyXG4gICAgICAgIHRoaXMubUFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEVuYWJsZWQocHJvZmlsZUlkLCBtb2ROYW1lLCB0cnVlKSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoKTtcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGFzU2VxdWVuY2Uoc2VxdWVuY2U6IEJ1ZmZlciwgY2h1bms6IEJ1ZmZlcikge1xyXG4gICAgY29uc3QgZmlyc3RTZXFCeXRlID0gc2VxdWVuY2VbMF07XHJcbiAgICBsZXQgZm91bmRTZXEgPSBmYWxzZTtcclxuICAgIGxldCBpdGVyID0gMDtcclxuICAgIHdoaWxlIChpdGVyIDwgY2h1bmsubGVuZ3RoKSB7XHJcbiAgICAgIGlmICghZm91bmRTZXEgJiYgY2h1bmtbaXRlcl0gPT09IGZpcnN0U2VxQnl0ZSkge1xyXG4gICAgICAgIGNvbnN0IHN1YkFycmF5ID0gXy5jbG9uZURlZXAoQXJyYXkuZnJvbShjaHVuay5zbGljZShpdGVyLCBpdGVyICsgc2VxdWVuY2UubGVuZ3RoKSkpO1xyXG4gICAgICAgIGZvdW5kU2VxID0gXy5pc0VxdWFsKHNlcXVlbmNlLCBCdWZmZXIuZnJvbShzdWJBcnJheSkpO1xyXG4gICAgICB9XHJcbiAgICAgIGl0ZXIrKztcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZm91bmRTZXE7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHBhdGNoQ2h1bmsoY2h1bms6IEJ1ZmZlcik6IEJ1ZmZlciB7XHJcbiAgICBjb25zdCBpZHggPSBjaHVuay5pbmRleE9mKEJ1ZmZlci5mcm9tKFVOUEFUQ0hFRF9TRVEpKTtcclxuICAgIGNvbnN0IHBhdGNoZWRCdWZmZXIgPSBCdWZmZXIuZnJvbShQQVRDSEVEX1NFUSk7XHJcbiAgICBjb25zdCBkYXRhID0gQnVmZmVyLmFsbG9jKGNodW5rLmxlbmd0aCk7XHJcbiAgICBkYXRhLmZpbGwoY2h1bmsuc2xpY2UoMCwgaWR4KSwgMCwgaWR4KTtcclxuICAgIGRhdGEuZmlsbChwYXRjaGVkQnVmZmVyLCBpZHgsIGlkeCArIHBhdGNoZWRCdWZmZXIubGVuZ3RoKTtcclxuICAgIGRhdGEuZmlsbChjaHVuay5zbGljZShpZHggKyBwYXRjaGVkQnVmZmVyLmxlbmd0aCksIGlkeCArIHBhdGNoZWRCdWZmZXIubGVuZ3RoKTtcclxuICAgIHJldHVybiBkYXRhO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBzdHJlYW1FeGVjdXRhYmxlKHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyLCBmaWxlUGF0aDogc3RyaW5nLCB0ZW1wUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBjb25zdCB3cml0ZXIgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbSh0ZW1wUGF0aCk7XHJcbiAgICAgIGNvbnN0IHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCB1bnBhdGNoZWQgPSBCdWZmZXIuZnJvbShVTlBBVENIRURfU0VRKTtcclxuICAgICAgY29uc3QgcGF0Y2hlZCA9IEJ1ZmZlci5mcm9tKFBBVENIRURfU0VRKTtcclxuICAgICAgY29uc3Qgb25FcnJvciA9IChlcnI6IEVycm9yKSA9PiB7XHJcbiAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gZmFsc2U7XHJcbiAgICAgICAgd3JpdGVyLmVuZCgpO1xyXG4gICAgICAgIGlmICghc3RyZWFtLmRlc3Ryb3llZCkge1xyXG4gICAgICAgICAgc3RyZWFtLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgICAgfTtcclxuICAgICAgc3RyZWFtLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5tSXNQYXRjaGVkID0gZmFsc2U7XHJcbiAgICAgICAgd3JpdGVyLmVuZCgpO1xyXG4gICAgICAgIHJldHVybiByZXNvbHZlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBzdHJlYW0ub24oJ2Vycm9yJywgb25FcnJvcik7XHJcbiAgICAgIHN0cmVhbS5vbignZGF0YScsICgoY2h1bms6IEJ1ZmZlcikgPT4ge1xyXG4gICAgICAgIGlmICh0aGlzLm1Jc1BhdGNoZWQgfHwgKHN0cmVhbS5ieXRlc1JlYWQgKyA2NTUzNikgPCBzdGFydCB8fCBzdHJlYW0uYnl0ZXNSZWFkID4gZW5kICsgNjU1MzYpIHtcclxuICAgICAgICAgIHdyaXRlci53cml0ZShjaHVuayk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIGlmICh0aGlzLmhhc1NlcXVlbmNlKHVucGF0Y2hlZCwgY2h1bmspKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBhdGNoZWRCdWZmZXIgPSB0aGlzLnBhdGNoQ2h1bmsoY2h1bmspO1xyXG4gICAgICAgICAgICB3cml0ZXIud3JpdGUocGF0Y2hlZEJ1ZmZlcik7XHJcbiAgICAgICAgICAgIHRoaXMubUlzUGF0Y2hlZCA9IHRydWU7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaGFzU2VxdWVuY2UocGF0Y2hlZCwgY2h1bmspKSB7XHJcbiAgICAgICAgICAgIC8vIGV4ZWMgaXMgYWxyZWFkeSBwYXRjaGVkLlxyXG4gICAgICAgICAgICB0aGlzLm1Jc1BhdGNoZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB3cml0ZXIud3JpdGUoY2h1bmspO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd3JpdGVyLndyaXRlKGNodW5rKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pKTtcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXX0=