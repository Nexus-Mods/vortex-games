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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeployment = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
function getDeployment(api, includedMods) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        const game = vortex_api_1.util.getGame(common_1.GAME_ID);
        if ((game === undefined) || ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined)) {
            (0, vortex_api_1.log)('error', 'game is not discovered', common_1.GAME_ID);
            return undefined;
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const installationDirectories = Object.values(mods)
            .filter(mod => (includedMods !== undefined)
            ? includedMods.includes(mod.id)
            : true)
            .map(mod => mod.installationPath);
        const filterFunc = (file) => installationDirectories.includes(file.source);
        const modPaths = game.getModPaths(discovery.path);
        const modTypes = Object.keys(modPaths).filter(key => !!modPaths[key]);
        const deployment = yield modTypes.reduce((accumP, modType) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            try {
                const manifest = yield vortex_api_1.util.getManifest(api, modType, common_1.GAME_ID);
                accum[modType] = manifest.files.filter(filterFunc);
            }
            catch (err) {
                (0, vortex_api_1.log)('error', 'failed to get manifest', err);
            }
            return accum;
        }), {});
        return deployment;
    });
}
exports.getDeployment = getDeployment;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQThDO0FBRTlDLHFDQUFtQztBQUluQyxTQUFzQixhQUFhLENBQUMsR0FBd0IsRUFDeEIsWUFBdUI7O1FBQ3pELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2xDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlELE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFPLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxNQUFLLFNBQVMsQ0FBQyxFQUFFO1lBQzNELElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1lBQ2hELE9BQU8sU0FBUyxDQUFDO1NBQ2xCO1FBRUQsTUFBTSxJQUFJLEdBQW9DLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFDOUQsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUV2QyxNQUFNLHVCQUF1QixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO2FBQ2hELE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxLQUFLLFNBQVMsQ0FBQztZQUN6QyxDQUFDLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQy9CLENBQUMsQ0FBQyxJQUFJLENBQUM7YUFDUixHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUVwQyxNQUFNLFVBQVUsR0FBRyxDQUFDLElBQW1CLEVBQUUsRUFBRSxDQUFDLHVCQUF1QixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFMUYsTUFBTSxRQUFRLEdBQWlDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hGLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sVUFBVSxHQUFnQixNQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBTyxNQUFNLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDOUUsTUFBTSxLQUFLLEdBQUcsTUFBTSxNQUFNLENBQUM7WUFDM0IsSUFBSTtnQkFDRixNQUFNLFFBQVEsR0FBOEIsTUFBTSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLGdCQUFPLENBQUMsQ0FBQztnQkFDMUYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3BEO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxHQUFHLENBQUMsQ0FBQzthQUM3QztZQUNELE9BQU8sS0FBSyxDQUFDO1FBQ2YsQ0FBQyxDQUFBLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFUCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0NBQUE7QUFwQ0Qsc0NBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbG9nLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuXG5pbXBvcnQgeyBJRGVwbG95ZWRGaWxlLCBJRGVwbG95bWVudCB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RGVwbG95bWVudChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmNsdWRlZE1vZHM/OiBzdHJpbmdbXSk6IFByb21pc2U8SURlcGxveW1lbnQ+IHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICBjb25zdCBnYW1lID0gdXRpbC5nZXRHYW1lKEdBTUVfSUQpO1xuICBpZiAoKGdhbWUgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xuICAgIGxvZygnZXJyb3InLCAnZ2FtZSBpcyBub3QgZGlzY292ZXJlZCcsIEdBTUVfSUQpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxuICAgIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcblxuICBjb25zdCBpbnN0YWxsYXRpb25EaXJlY3RvcmllcyA9IE9iamVjdC52YWx1ZXMobW9kcylcbiAgICAuZmlsdGVyKG1vZCA9PiAoaW5jbHVkZWRNb2RzICE9PSB1bmRlZmluZWQpXG4gICAgICA/IGluY2x1ZGVkTW9kcy5pbmNsdWRlcyhtb2QuaWQpXG4gICAgICA6IHRydWUpXG4gICAgLm1hcChtb2QgPT4gbW9kLmluc3RhbGxhdGlvblBhdGgpO1xuXG4gIGNvbnN0IGZpbHRlckZ1bmMgPSAoZmlsZTogSURlcGxveWVkRmlsZSkgPT4gaW5zdGFsbGF0aW9uRGlyZWN0b3JpZXMuaW5jbHVkZXMoZmlsZS5zb3VyY2UpO1xuXG4gIGNvbnN0IG1vZFBhdGhzOiB7IFt0eXBlSWQ6IHN0cmluZ106IHN0cmluZyB9ID0gZ2FtZS5nZXRNb2RQYXRocyhkaXNjb3ZlcnkucGF0aCk7XG4gIGNvbnN0IG1vZFR5cGVzID0gT2JqZWN0LmtleXMobW9kUGF0aHMpLmZpbHRlcihrZXkgPT4gISFtb2RQYXRoc1trZXldKTtcbiAgY29uc3QgZGVwbG95bWVudDogSURlcGxveW1lbnQgPSBhd2FpdCBtb2RUeXBlcy5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgbW9kVHlwZSkgPT4ge1xuICAgIGNvbnN0IGFjY3VtID0gYXdhaXQgYWNjdW1QO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYW5pZmVzdDogdHlwZXMuSURlcGxveW1lbnRNYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCBtb2RUeXBlLCBHQU1FX0lEKTtcbiAgICAgIGFjY3VtW21vZFR5cGVdID0gbWFuaWZlc3QuZmlsZXMuZmlsdGVyKGZpbHRlckZ1bmMpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gZ2V0IG1hbmlmZXN0JywgZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCB7fSk7XG5cbiAgcmV0dXJuIGRlcGxveW1lbnQ7XG59XG4iXX0=