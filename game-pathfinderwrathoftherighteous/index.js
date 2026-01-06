var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const path = require('path');
const { fs, types, util } = require('vortex-api');
const GAME_ID = 'pathfinderwrathoftherighteous';
const NAME = 'Pathfinder: Wrath\tof the Righteous';
const STEAM_ID = '1184370';
const GOG_ID = '1207187357';
function findGame() {
    return util.GameStoreHelper.findByAppId([STEAM_ID, GOG_ID])
        .then(game => game.gamePath);
}
function setup(discovery) {
    return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'));
}
function resolveGameVersion(discoveryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const versionFilepath = path.join(discoveryPath, 'Wrath_Data', 'StreamingAssets', 'Version.info');
        try {
            const data = yield fs.readFileAsync(versionFilepath, { encoding: 'utf8' });
            const segments = data.split(' ');
            return (segments[3])
                ? Promise.resolve(segments[3])
                : Promise.reject(new util.DataInvalid('Failed to resolve version'));
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function main(context) {
    context.requireExtension('modtype-umm');
    context.registerGame({
        id: GAME_ID,
        name: NAME,
        logo: 'gameart.jpg',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => 'Mods',
        executable: () => 'Wrath.exe',
        getGameVersion: resolveGameVersion,
        requiredFiles: ['Wrath.exe'],
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
        },
        setup,
    });
    context.once(() => {
        if (context.api.ext.ummAddGame !== undefined) {
            context.api.ext.ummAddGame({
                gameId: GAME_ID,
                autoDownloadUMM: true,
            });
        }
    });
    return true;
}
module.exports = {
    default: main
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsTUFBTSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRWxELE1BQU0sT0FBTyxHQUFHLCtCQUErQixDQUFDO0FBQ2hELE1BQU0sSUFBSSxHQUFHLHFDQUFxQyxDQUFDO0FBQ25ELE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUMzQixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFFNUIsU0FBUyxRQUFRO0lBQ2YsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUN4RCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUVELFNBQVMsS0FBSyxDQUFDLFNBQVM7SUFDdEIsT0FBTyxFQUFFLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQUVELFNBQWUsa0JBQWtCLENBQUMsYUFBcUI7O1FBQ3JELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNsRyxJQUFJLENBQUM7WUFDSCxNQUFNLElBQUksR0FBRyxNQUFNLEVBQUUsQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDM0UsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsQixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsQ0FBQztJQUNILENBQUM7Q0FBQTtBQUVELFNBQVMsSUFBSSxDQUFDLE9BQU87SUFDbkIsT0FBTyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sQ0FBQyxZQUFZLENBQ2xCO1FBQ0UsRUFBRSxFQUFFLE9BQU87UUFDWCxJQUFJLEVBQUUsSUFBSTtRQUNWLElBQUksRUFBRSxhQUFhO1FBQ25CLFNBQVMsRUFBRSxJQUFJO1FBQ2YsU0FBUyxFQUFFLFFBQVE7UUFDbkIsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU07UUFDMUIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLFdBQVc7UUFDN0IsY0FBYyxFQUFFLGtCQUFrQjtRQUNsQyxhQUFhLEVBQUUsQ0FBQyxXQUFXLENBQUM7UUFDNUIsV0FBVyxFQUFFO1lBQ1gsVUFBVSxFQUFFLFFBQVE7U0FDckI7UUFDRCxPQUFPLEVBQ1A7WUFDRSxVQUFVLEVBQUUsQ0FBQyxRQUFRO1NBQ3RCO1FBQ0QsS0FBSztLQUNOLENBQUMsQ0FBQztJQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ2hCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztnQkFDekIsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsZUFBZSxFQUFFLElBQUk7YUFDdEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNiLE9BQU8sRUFBRSxJQUFJO0NBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xyXG5jb25zdCB7IGZzLCB0eXBlcywgdXRpbCB9ID0gcmVxdWlyZSgndm9ydGV4LWFwaScpO1xyXG5cclxuY29uc3QgR0FNRV9JRCA9ICdwYXRoZmluZGVyd3JhdGhvZnRoZXJpZ2h0ZW91cyc7XHJcbmNvbnN0IE5BTUUgPSAnUGF0aGZpbmRlcjogV3JhdGhcXHRvZiB0aGUgUmlnaHRlb3VzJztcclxuY29uc3QgU1RFQU1fSUQgPSAnMTE4NDM3MCc7XHJcbmNvbnN0IEdPR19JRCA9ICcxMjA3MTg3MzU3JztcclxuXHJcbmZ1bmN0aW9uIGZpbmRHYW1lKCkge1xyXG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbU1RFQU1fSUQsIEdPR19JRF0pXHJcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXR1cChkaXNjb3ZlcnkpIHtcclxuICByZXR1cm4gZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsICdNb2RzJykpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlR2FtZVZlcnNpb24oZGlzY292ZXJ5UGF0aDogc3RyaW5nKSB7XHJcbiAgY29uc3QgdmVyc2lvbkZpbGVwYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsICdXcmF0aF9EYXRhJywgJ1N0cmVhbWluZ0Fzc2V0cycsICdWZXJzaW9uLmluZm8nKTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmModmVyc2lvbkZpbGVwYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGRhdGEuc3BsaXQoJyAnKTtcclxuICAgIHJldHVybiAoc2VnbWVudHNbM10pIFxyXG4gICAgICA/IFByb21pc2UucmVzb2x2ZShzZWdtZW50c1szXSlcclxuICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIHJlc29sdmUgdmVyc2lvbicpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gbWFpbihjb250ZXh0KSB7XHJcbiAgY29udGV4dC5yZXF1aXJlRXh0ZW5zaW9uKCdtb2R0eXBlLXVtbScpO1xyXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKFxyXG4gICAge1xyXG4gICAgICBpZDogR0FNRV9JRCxcclxuICAgICAgbmFtZTogTkFNRSxcclxuICAgICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcclxuICAgICAgbWVyZ2VNb2RzOiB0cnVlLFxyXG4gICAgICBxdWVyeVBhdGg6IGZpbmRHYW1lLFxyXG4gICAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdNb2RzJyxcclxuICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ1dyYXRoLmV4ZScsXHJcbiAgICAgIGdldEdhbWVWZXJzaW9uOiByZXNvbHZlR2FtZVZlcnNpb24sXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFsnV3JhdGguZXhlJ10sXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXHJcbiAgICAgIH0sIFxyXG4gICAgICBkZXRhaWxzOlxyXG4gICAgICB7XHJcbiAgICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxyXG4gICAgICB9LFxyXG4gICAgICBzZXR1cCxcclxuICAgIH0pO1xyXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XHJcbiAgICBpZiAoY29udGV4dC5hcGkuZXh0LnVtbUFkZEdhbWUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb250ZXh0LmFwaS5leHQudW1tQWRkR2FtZSh7XHJcbiAgICAgICAgZ2FtZUlkOiBHQU1FX0lELFxyXG4gICAgICAgIGF1dG9Eb3dubG9hZFVNTTogdHJ1ZSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSlcclxuXHJcbiAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZGVmYXVsdDogbWFpblxyXG59O1xyXG4iXX0=