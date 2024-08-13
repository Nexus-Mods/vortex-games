"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.install = exports.testInstaller = exports.installModConfig = exports.testModConfigInstaller = exports.installPlugAndPlay = exports.testPlugAndPlayInstaller = void 0;
const path_1 = __importDefault(require("path"));
const rjson = __importStar(require("relaxed-json"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
function testPlugAndPlayInstaller(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const hasModInfoFile = files.some(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO_JSON_FILE);
        return Promise.resolve({ supported: (gameId === common_1.GAME_ID) && hasModInfoFile, requiredFiles: [] });
    });
}
exports.testPlugAndPlayInstaller = testPlugAndPlayInstaller;
function installPlugAndPlay(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const modInfo = files.find(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO_JSON_FILE);
        const modInfoData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(destinationPath, modInfo), { encoding: 'utf8' });
        const parsed = rjson.parse(modInfoData);
        const gameInstruction = {
            type: 'attribute',
            key: 'haloGames',
            value: [common_1.HALO_GAMES[parsed.Engine.toLowerCase()].internalId],
        };
        const infoSegments = modInfo.split(path_1.default.sep);
        const modFolderIndex = infoSegments.length >= 2 ? infoSegments.length - 2 : 0;
        const filtered = files.filter(file => path_1.default.extname(path_1.default.basename(file)) !== '');
        const instructions = filtered.map(file => {
            const segments = file.split(path_1.default.sep);
            const destination = segments.slice(modFolderIndex);
            return {
                type: 'copy',
                source: file,
                destination: destination.join(path_1.default.sep),
            };
        });
        instructions.push(gameInstruction);
        return Promise.resolve({ instructions });
    });
}
exports.installPlugAndPlay = installPlugAndPlay;
function testModConfigInstaller(files, gameId) {
    const isAssemblyOnlyMod = () => {
        return (files.find(file => path_1.default.extname(file) === common_1.ASSEMBLY_EXT) !== undefined)
            && (files.find(file => path_1.default.extname(file) === common_1.MAP_EXT) === undefined);
    };
    return (gameId !== common_1.GAME_ID)
        ? Promise.resolve({ supported: false, requiredFiles: [] })
        : Promise.resolve({
            supported: (files.find(file => path_1.default.basename(file) === common_1.MOD_CONFIG_FILE) !== undefined)
                && !isAssemblyOnlyMod(),
            requiredFiles: [],
        });
}
exports.testModConfigInstaller = testModConfigInstaller;
function installModConfig(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const modConfigFile = files.find(file => path_1.default.basename(file) === common_1.MOD_CONFIG_FILE);
        const filtered = files.filter(file => {
            const segments = file.split(path_1.default.sep);
            const lastElementExt = path_1.default.extname(segments[segments.length - 1]);
            return (modConfigFile !== file) && ['', '.txt', common_1.ASSEMBLY_EXT].indexOf(lastElementExt) === -1;
        });
        const configData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(destinationPath, modConfigFile), { encoding: 'utf8' });
        let data;
        try {
            data = rjson.parse(vortex_api_1.util.deBOM(configData));
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'Unable to parse modpack_config.cfg', err);
            return Promise.reject(new vortex_api_1.util.DataInvalid('Invalid modpack_config.cfg file'));
        }
        if (!data.entries) {
            return Promise.reject(new vortex_api_1.util.DataInvalid('modpack_config.cfg file contains no entries'));
        }
        const instructions = filtered.reduce((accum, file) => {
            const matchingEntry = data.entries.find(entry => ('src' in entry) && (entry.src.toLowerCase() === file.toLowerCase()));
            if (!!matchingEntry) {
                const destination = matchingEntry.dest.substring(common_1.MOD_CONFIG_DEST_ELEMENT.length);
                accum.push({
                    type: 'copy',
                    source: file,
                    destination,
                });
            }
            else {
                (0, vortex_api_1.log)('warn', 'Failed to find matching manifest entry for file in archive', file);
            }
            return accum;
        }, []);
        return Promise.resolve({ instructions });
    });
}
exports.installModConfig = installModConfig;
function testInstaller(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return Promise.resolve({ supported: false, requiredFiles: [] });
    }
    const haloGames = (0, util_1.identifyHaloGames)(files);
    return Promise.resolve({
        supported: (haloGames.length > 0),
        requiredFiles: [],
    });
}
exports.testInstaller = testInstaller;
function install(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const haloGames = (0, util_1.identifyHaloGames)(files);
        const internalIds = haloGames.map(game => game.internalId);
        const attrInstruction = {
            type: 'attribute',
            key: 'haloGames',
            value: internalIds,
        };
        const instructions = haloGames.reduce((accum, haloGame) => {
            const filtered = files.filter(file => {
                const segments = file.split(path_1.default.sep).filter(seg => !!seg);
                return (path_1.default.extname(segments[segments.length - 1]) !== '')
                    && (segments.indexOf(haloGame.modsPath) !== -1);
            });
            filtered.forEach(element => {
                const segments = element.split(path_1.default.sep).filter(seg => !!seg);
                const rootIdx = segments.indexOf(haloGame.modsPath);
                const destination = segments.splice(rootIdx).join(path_1.default.sep);
                accum.push({
                    type: 'copy',
                    source: element,
                    destination
                });
            });
            return accum;
        }, [attrInstruction]);
        return Promise.resolve({ instructions });
    });
}
exports.install = install;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluc3RhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIsb0RBQXNDO0FBQ3RDLDJDQUFrRDtBQUVsRCxxQ0FBb0k7QUFFcEksaUNBQTJDO0FBRTNDLFNBQXNCLHdCQUF3QixDQUFDLEtBQWUsRUFBRSxNQUFjOztRQUM1RSxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSywyQkFBa0IsQ0FBQyxDQUFDO1FBQ3BHLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLE1BQU0sS0FBSyxnQkFBTyxDQUFDLElBQUksY0FBYyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ25HLENBQUM7Q0FBQTtBQUhELDREQUdDO0FBRUQsU0FBc0Isa0JBQWtCLENBQUMsS0FBZSxFQUFFLGVBQXVCOztRQUMvRSxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSywyQkFBa0IsQ0FBQyxDQUFDO1FBQzdGLE1BQU0sV0FBVyxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3RHLE1BQU0sTUFBTSxHQUFlLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFlLENBQUM7UUFDbEUsTUFBTSxlQUFlLEdBQXVCO1lBQzFDLElBQUks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QU8sR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDcEQsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUM1RCxLQUFLLENBQUMsSUFBSSxDQUFDO29CQUNULElBQUksRUFBRSxNQUFNO29CQUNaLE1BQU0sRUFBRSxPQUFPO29CQUNmLFdBQVc7aUJBQ1osQ0FBQyxDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUM7WUFDSCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDdEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztJQUMzQyxDQUFDO0NBQUE7QUE3QkQsMEJBNkJDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCAqIGFzIHJqc29uIGZyb20gJ3JlbGF4ZWQtanNvbic7XHJcbmltcG9ydCB7IGZzLCB0eXBlcywgbG9nLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBNT0RfQ09ORklHX0RFU1RfRUxFTUVOVCwgTU9EX0lORk9fSlNPTl9GSUxFLCBHQU1FX0lELCBNT0RfQ09ORklHX0ZJTEUsIEFTU0VNQkxZX0VYVCwgTUFQX0VYVCwgSEFMT19HQU1FUyB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSU1vZENvbmZpZyB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBpZGVudGlmeUhhbG9HYW1lcyB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdFBsdWdBbmRQbGF5SW5zdGFsbGVyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpIHtcclxuICBjb25zdCBoYXNNb2RJbmZvRmlsZSA9IGZpbGVzLnNvbWUoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPX0pTT05fRklMRSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgaGFzTW9kSW5mb0ZpbGUsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFBsdWdBbmRQbGF5KGZpbGVzOiBzdHJpbmdbXSwgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcpIHtcclxuICBjb25zdCBtb2RJbmZvID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0lORk9fSlNPTl9GSUxFKTtcclxuICBjb25zdCBtb2RJbmZvRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kSW5mbyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICBjb25zdCBwYXJzZWQ6IElNb2RDb25maWcgPSByanNvbi5wYXJzZShtb2RJbmZvRGF0YSkgYXMgSU1vZENvbmZpZztcclxuICBjb25zdCBnYW1lSW5zdHJ1Y3Rpb246IHR5cGVzLklJbnN0cnVjdGlvbiA9IHtcclxuICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAga2V5OiAnaGFsb0dhbWVzJyxcclxuICAgIHZhbHVlOiBbSEFMT19HQU1FU1twYXJzZWQuRW5naW5lLnRvTG93ZXJDYXNlKCldLmludGVybmFsSWRdLFxyXG4gIH1cclxuICBjb25zdCBpbmZvU2VnbWVudHMgPSBtb2RJbmZvLnNwbGl0KHBhdGguc2VwKTtcclxuICBjb25zdCBtb2RGb2xkZXJJbmRleCA9IGluZm9TZWdtZW50cy5sZW5ndGggPj0gMiA/IGluZm9TZWdtZW50cy5sZW5ndGggLSAyIDogMDtcclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShwYXRoLmJhc2VuYW1lKGZpbGUpKSAhPT0gJycpO1xyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgY29uc3QgZGVzdGluYXRpb24gPSBzZWdtZW50cy5zbGljZShtb2RGb2xkZXJJbmRleCk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uLmpvaW4ocGF0aC5zZXApLFxyXG4gICAgfTtcclxuICB9KTtcclxuXHJcbiAgaW5zdHJ1Y3Rpb25zLnB1c2goZ2FtZUluc3RydWN0aW9uKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGVzdE1vZENvbmZpZ0luc3RhbGxlcihmaWxlcywgZ2FtZUlkKSB7XHJcbiAgY29uc3QgaXNBc3NlbWJseU9ubHlNb2QgPSAoKSA9PiB7XHJcbiAgICAvLyBUaGUgcHJlc2Vuc2Ugb2YgYW4gLmFzbXAgZmlsZSB3aXRob3V0IGFueSAubWFwIGZpbGVzIGlzIGEgY2xlYXIgaW5kaWNhdGlvblxyXG4gICAgLy8gIHRoYXQgdGhpcyBtb2QgY2FuIG9ubHkgYmUgaW5zdGFsbGVkIHVzaW5nIHRoZSBBc3NlbWJseSB0b29sIHdoaWNoIHdlJ3ZlXHJcbiAgICAvLyAgeWV0IHRvIGludGVncmF0ZSBpbnRvIFZvcnRleC4gVGhpcyBpbnN0YWxsZXIgd2lsbCBub3QgaW5zdGFsbCB0aGVzZSBtb2RzLlxyXG4gICAgcmV0dXJuIChmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpID09PSBBU1NFTUJMWV9FWFQpICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICYmIChmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpID09PSBNQVBfRVhUKSA9PT0gdW5kZWZpbmVkKTtcclxuICB9O1xyXG4gIHJldHVybiAoZ2FtZUlkICE9PSBHQU1FX0lEKVxyXG4gICA/IFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pXHJcbiAgIDogUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICBzdXBwb3J0ZWQ6IChmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKSA9PT0gTU9EX0NPTkZJR19GSUxFKSAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAmJiAhaXNBc3NlbWJseU9ubHlNb2QoKSxcclxuICAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICAgIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zdGFsbE1vZENvbmZpZyhmaWxlczogc3RyaW5nW10sIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nKSB7XHJcbiAgLy8gRmluZCB0aGUgbW9kIGNvbmZpZyBmaWxlIGFuZCB1c2UgaXQgdG8gYnVpbGQgdGhlIGluc3RydWN0aW9ucy5cclxuICBjb25zdCBtb2RDb25maWdGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IE1PRF9DT05GSUdfRklMRSk7XHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICAvLyBObyBkaXJlY3RvcmllcywgYXNzZW1ibHkgdG9vbCBmaWxlcywgcmVhZG1lcyBvciBtb2QgY29uZmlnIGZpbGVzLlxyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIGNvbnN0IGxhc3RFbGVtZW50RXh0ID0gcGF0aC5leHRuYW1lKHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdKTtcclxuICAgIHJldHVybiAobW9kQ29uZmlnRmlsZSAhPT0gZmlsZSkgJiYgWycnLCAnLnR4dCcsIEFTU0VNQkxZX0VYVF0uaW5kZXhPZihsYXN0RWxlbWVudEV4dCkgPT09IC0xO1xyXG4gIH0pO1xyXG4gIGNvbnN0IGNvbmZpZ0RhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1vZENvbmZpZ0ZpbGUpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XHJcbiAgbGV0IGRhdGE7XHJcbiAgdHJ5IHtcclxuICAgIGRhdGEgPSByanNvbi5wYXJzZSh1dGlsLmRlQk9NKGNvbmZpZ0RhdGEpKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnVW5hYmxlIHRvIHBhcnNlIG1vZHBhY2tfY29uZmlnLmNmZycsIGVycik7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ludmFsaWQgbW9kcGFja19jb25maWcuY2ZnIGZpbGUnKSk7XHJcbiAgfVxyXG5cclxuICBpZiAoIWRhdGEuZW50cmllcykge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdtb2RwYWNrX2NvbmZpZy5jZmcgZmlsZSBjb250YWlucyBubyBlbnRyaWVzJykpXHJcbiAgfVxyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5yZWR1Y2UoKGFjY3VtLCBmaWxlKSA9PiB7XHJcbiAgICBjb25zdCBtYXRjaGluZ0VudHJ5ID0gZGF0YS5lbnRyaWVzLmZpbmQoZW50cnkgPT5cclxuICAgICAgKCdzcmMnIGluIGVudHJ5KSAmJiAoZW50cnkuc3JjLnRvTG93ZXJDYXNlKCkgPT09IGZpbGUudG9Mb3dlckNhc2UoKSkpO1xyXG4gICAgaWYgKCEhbWF0Y2hpbmdFbnRyeSkge1xyXG4gICAgICBjb25zdCBkZXN0aW5hdGlvbiA9IG1hdGNoaW5nRW50cnkuZGVzdC5zdWJzdHJpbmcoTU9EX0NPTkZJR19ERVNUX0VMRU1FTlQubGVuZ3RoKTtcclxuICAgICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZSxcclxuICAgICAgICBkZXN0aW5hdGlvbixcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBUaGlzIG1heSBqdXN0IGJlIGEgcG9pbnRsZXNzIGFkZGl0aW9uIGJ5IHRoZSBtb2QgYXV0aG9yIC0gd2UncmUgZ29pbmcgdG8gbG9nXHJcbiAgICAgIC8vICB0aGlzIGFuZCBjb250aW51ZS5cclxuICAgICAgbG9nKCd3YXJuJywgJ0ZhaWxlZCB0byBmaW5kIG1hdGNoaW5nIG1hbmlmZXN0IGVudHJ5IGZvciBmaWxlIGluIGFyY2hpdmUnLCBmaWxlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RJbnN0YWxsZXIoZmlsZXMsIGdhbWVJZCkge1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxuICB9XHJcbiAgY29uc3QgaGFsb0dhbWVzID0gaWRlbnRpZnlIYWxvR2FtZXMoZmlsZXMpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkOiAoaGFsb0dhbWVzLmxlbmd0aCA+IDApLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsKGZpbGVzOiBzdHJpbmdbXSwgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcpIHtcclxuICBjb25zdCBoYWxvR2FtZXMgPSAgaWRlbnRpZnlIYWxvR2FtZXMoZmlsZXMpO1xyXG4gIGNvbnN0IGludGVybmFsSWRzID0gaGFsb0dhbWVzLm1hcChnYW1lID0+IGdhbWUuaW50ZXJuYWxJZCk7XHJcbiAgY29uc3QgYXR0ckluc3RydWN0aW9uOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7XHJcbiAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgIGtleTogJ2hhbG9HYW1lcycsXHJcbiAgICB2YWx1ZTogaW50ZXJuYWxJZHMsXHJcbiAgfVxyXG4gICAgXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGhhbG9HYW1lcy5yZWR1Y2UoKGFjY3VtLCBoYWxvR2FtZSkgPT4ge1xyXG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiB7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XHJcbiAgICAgIHJldHVybiAocGF0aC5leHRuYW1lKHNlZ21lbnRzW3NlZ21lbnRzLmxlbmd0aCAtIDFdKSAhPT0gJycpXHJcbiAgICAgICAgJiYgKHNlZ21lbnRzLmluZGV4T2YoaGFsb0dhbWUubW9kc1BhdGgpICE9PSAtMSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBmaWx0ZXJlZC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICBjb25zdCBzZWdtZW50cyA9IGVsZW1lbnQuc3BsaXQocGF0aC5zZXApLmZpbHRlcihzZWcgPT4gISFzZWcpO1xyXG4gICAgICBjb25zdCByb290SWR4ID0gc2VnbWVudHMuaW5kZXhPZihoYWxvR2FtZS5tb2RzUGF0aCk7XHJcbiAgICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gc2VnbWVudHMuc3BsaWNlKHJvb3RJZHgpLmpvaW4ocGF0aC5zZXApO1xyXG4gICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBlbGVtZW50LFxyXG4gICAgICAgIGRlc3RpbmF0aW9uXHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwgW2F0dHJJbnN0cnVjdGlvbl0pO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn0iXX0=