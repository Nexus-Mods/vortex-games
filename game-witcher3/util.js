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
function getDeployment(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
        const game = vortex_api_1.util.getGame(common_1.GAME_ID);
        if ((game === undefined) || ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined)) {
            vortex_api_1.log('error', 'game is not discovered', common_1.GAME_ID);
            return undefined;
        }
        const modPaths = game.getModPaths(discovery.path);
        const modTypes = Object.keys(modPaths).filter(key => !!modPaths[key]);
        const deployment = yield modTypes.reduce((accumP, modType) => __awaiter(this, void 0, void 0, function* () {
            const accum = yield accumP;
            try {
                const manifest = yield vortex_api_1.util.getManifest(api, modType, common_1.GAME_ID);
                accum[modType] = manifest.files;
            }
            catch (err) {
                vortex_api_1.log('error', 'failed to get manifest', err);
            }
            return accum;
        }), {});
        return deployment;
    });
}
exports.getDeployment = getDeployment;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQThDO0FBRTlDLHFDQUFtQztBQUluQyxTQUFzQixhQUFhLENBQUMsR0FBd0I7O1FBQzFELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLFNBQVMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ2xDLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlELE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFPLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxTQUFTLGFBQVQsU0FBUyx1QkFBVCxTQUFTLENBQUUsSUFBSSxNQUFLLFNBQVMsQ0FBQyxFQUFFO1lBQzNELGdCQUFHLENBQUMsT0FBTyxFQUFFLHdCQUF3QixFQUFFLGdCQUFPLENBQUMsQ0FBQztZQUNoRCxPQUFPLFNBQVMsQ0FBQztTQUNsQjtRQUVELE1BQU0sUUFBUSxHQUFpQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoRixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLFVBQVUsR0FBZ0IsTUFBTSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQU8sTUFBTSxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQzlFLE1BQU0sS0FBSyxHQUFHLE1BQU0sTUFBTSxDQUFDO1lBQzNCLElBQUk7Z0JBQ0YsTUFBTSxRQUFRLEdBQThCLE1BQU0saUJBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxnQkFBTyxDQUFDLENBQUM7Z0JBQzFGLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO2FBQ2pDO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osZ0JBQUcsQ0FBQyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsR0FBRyxDQUFDLENBQUM7YUFDN0M7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRVAsT0FBTyxVQUFVLENBQUM7SUFDcEIsQ0FBQztDQUFBO0FBeEJELHNDQXdCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGxvZywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBJRGVwbG95bWVudCB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldERlcGxveW1lbnQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxJRGVwbG95bWVudD4ge1xyXG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLFxyXG4gICAgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XHJcbiAgY29uc3QgZ2FtZSA9IHV0aWwuZ2V0R2FtZShHQU1FX0lEKTtcclxuICBpZiAoKGdhbWUgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xyXG4gICAgbG9nKCdlcnJvcicsICdnYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJywgR0FNRV9JRCk7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbW9kUGF0aHM6IHsgW3R5cGVJZDogc3RyaW5nXTogc3RyaW5nIH0gPSBnYW1lLmdldE1vZFBhdGhzKGRpc2NvdmVyeS5wYXRoKTtcclxuICBjb25zdCBtb2RUeXBlcyA9IE9iamVjdC5rZXlzKG1vZFBhdGhzKS5maWx0ZXIoa2V5ID0+ICEhbW9kUGF0aHNba2V5XSk7XHJcbiAgY29uc3QgZGVwbG95bWVudDogSURlcGxveW1lbnQgPSBhd2FpdCBtb2RUeXBlcy5yZWR1Y2UoYXN5bmMgKGFjY3VtUCwgbW9kVHlwZSkgPT4ge1xyXG4gICAgY29uc3QgYWNjdW0gPSBhd2FpdCBhY2N1bVA7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBtYW5pZmVzdDogdHlwZXMuSURlcGxveW1lbnRNYW5pZmVzdCA9IGF3YWl0IHV0aWwuZ2V0TWFuaWZlc3QoYXBpLCBtb2RUeXBlLCBHQU1FX0lEKTtcclxuICAgICAgYWNjdW1bbW9kVHlwZV0gPSBtYW5pZmVzdC5maWxlcztcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBnZXQgbWFuaWZlc3QnLCBlcnIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIHt9KTtcclxuXHJcbiAgcmV0dXJuIGRlcGxveW1lbnQ7XHJcbn1cclxuIl19