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
exports.testMissingDependencies = void 0;
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
function testMissingDependencies(api, depManager) {
    return __awaiter(this, void 0, void 0, function* () {
        const t = api.translate;
        const state = api.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        if (gameMode !== common_1.GAME_ID) {
            return undefined;
        }
        yield depManager.scanManifests(true);
        let missingDependencies = [];
        try {
            missingDependencies = depManager.findMissingDependencies();
            if (missingDependencies.length === 0) {
                return Promise.resolve(undefined);
            }
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'Error while checking for missing dependencies', err);
            return Promise.resolve(undefined);
        }
        return Promise.resolve({
            description: {
                short: 'Some Stardew Valley mods are missing dependencies',
                long: t('Some of your Stardew Valley mods have unfulfilled dependencies - this '
                    + 'may cause odd in-game behaviour, or may cause the game to fail to start.\n\n'
                    + 'You are missing the following dependencies[br][/br][br][/br]: {{deps}}', {
                    replace: {
                        deps: missingDependencies.map(dep => dep.UniqueID).join('[br][/br]'),
                    },
                }),
            },
            severity: 'warning',
        });
    });
}
exports.testMissingDependencies = testMissingDependencies;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBbUQ7QUFFbkQscUNBQW1DO0FBSW5DLFNBQXNCLHVCQUF1QixDQUN6QyxHQUF3QixFQUN4QixVQUE2Qjs7UUFFL0IsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN4QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDN0IsTUFBTSxRQUFRLEdBQUcsc0JBQVMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0MsSUFBSSxRQUFRLEtBQUssZ0JBQU8sRUFBRTtZQUN4QixPQUFPLFNBQVMsQ0FBQztTQUNsQjtRQUVELE1BQU0sVUFBVSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxJQUFJLG1CQUFtQixHQUFxQixFQUFFLENBQUM7UUFDL0MsSUFBSTtZQUNGLG1CQUFtQixHQUFHLFVBQVUsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzNELElBQUksbUJBQW1CLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDcEMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ25DO1NBQ0Y7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsK0NBQStDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDbkUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBRUQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ3JCLFdBQVcsRUFBRTtnQkFDWCxLQUFLLEVBQUUsbURBQW1EO2dCQUMxRCxJQUFJLEVBQUUsQ0FBQyxDQUFDLHdFQUF3RTtzQkFDeEUsOEVBQThFO3NCQUM5RSx3RUFBd0UsRUFBRTtvQkFDaEYsT0FBTyxFQUFFO3dCQUNQLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztxQkFDckU7aUJBQ0YsQ0FBQzthQUNIO1lBQ0QsUUFBUSxFQUFFLFNBQWtDO1NBQzdDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FBQTtBQXBDRCwwREFvQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBsb2csIHR5cGVzLCBzZWxlY3RvcnMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCBEZXBlbmRlbmN5TWFuYWdlciBmcm9tICcuL2RlcGVuZGVuY3lNYW5hZ2VyJztcclxuaW1wb3J0IHsgSVNEVkRlcGVuZGVuY3kgfSBmcm9tICcuL3R5cGVzJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0TWlzc2luZ0RlcGVuZGVuY2llcyhcclxuICAgIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcclxuICAgIGRlcE1hbmFnZXI6IERlcGVuZGVuY3lNYW5hZ2VyKVxyXG4gICAgICA6IFByb21pc2U8dHlwZXMuSVRlc3RSZXN1bHQ+IHtcclxuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcclxuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xyXG4gIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XHJcbiAgaWYgKGdhbWVNb2RlICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgYXdhaXQgZGVwTWFuYWdlci5zY2FuTWFuaWZlc3RzKHRydWUpO1xyXG4gIGxldCBtaXNzaW5nRGVwZW5kZW5jaWVzOiBJU0RWRGVwZW5kZW5jeVtdID0gW107XHJcbiAgdHJ5IHtcclxuICAgIG1pc3NpbmdEZXBlbmRlbmNpZXMgPSBkZXBNYW5hZ2VyLmZpbmRNaXNzaW5nRGVwZW5kZW5jaWVzKCk7XHJcbiAgICBpZiAobWlzc2luZ0RlcGVuZGVuY2llcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgbG9nKCdlcnJvcicsICdFcnJvciB3aGlsZSBjaGVja2luZyBmb3IgbWlzc2luZyBkZXBlbmRlbmNpZXMnLCBlcnIpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBkZXNjcmlwdGlvbjoge1xyXG4gICAgICBzaG9ydDogJ1NvbWUgU3RhcmRldyBWYWxsZXkgbW9kcyBhcmUgbWlzc2luZyBkZXBlbmRlbmNpZXMnLFxyXG4gICAgICBsb25nOiB0KCdTb21lIG9mIHlvdXIgU3RhcmRldyBWYWxsZXkgbW9kcyBoYXZlIHVuZnVsZmlsbGVkIGRlcGVuZGVuY2llcyAtIHRoaXMgJ1xyXG4gICAgICAgICAgICArICdtYXkgY2F1c2Ugb2RkIGluLWdhbWUgYmVoYXZpb3VyLCBvciBtYXkgY2F1c2UgdGhlIGdhbWUgdG8gZmFpbCB0byBzdGFydC5cXG5cXG4nXHJcbiAgICAgICAgICAgICsgJ1lvdSBhcmUgbWlzc2luZyB0aGUgZm9sbG93aW5nIGRlcGVuZGVuY2llc1ticl1bL2JyXVticl1bL2JyXToge3tkZXBzfX0nLCB7XHJcbiAgICAgICAgcmVwbGFjZToge1xyXG4gICAgICAgICAgZGVwczogbWlzc2luZ0RlcGVuZGVuY2llcy5tYXAoZGVwID0+IGRlcC5VbmlxdWVJRCkuam9pbignW2JyXVsvYnJdJyksXHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgICB9LFxyXG4gICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyBhcyB0eXBlcy5Qcm9ibGVtU2V2ZXJpdHksXHJcbiAgfSk7XHJcbn0iXX0=