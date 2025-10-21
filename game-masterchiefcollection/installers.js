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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.testPlugAndPlayInstaller = testPlugAndPlayInstaller;
exports.installPlugAndPlay = installPlugAndPlay;
exports.testModConfigInstaller = testModConfigInstaller;
exports.installModConfig = installModConfig;
exports.testInstaller = testInstaller;
exports.install = install;
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
function installPlugAndPlay(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const modInfo = files.find(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO_JSON_FILE);
        const modInfoData = yield vortex_api_1.fs.readFileAsync(path_1.default.join(destinationPath, modInfo), { encoding: 'utf8' });
        const parsed = rjson.parse(modInfoData);
        let modConfigAttributes = [];
        modConfigAttributes.push({
            type: 'attribute',
            key: 'haloGames',
            value: [common_1.HALO_GAMES[parsed.Engine.toLowerCase()].internalId],
        });
        if (parsed.ModVersion !== undefined) {
            modConfigAttributes.push({
                type: 'attribute',
                key: 'version',
                value: `${parsed.ModVersion.Major || 0}.${parsed.ModVersion.Minor || 0}.${parsed.ModVersion.Patch || 0}`,
            });
        }
        if (((_a = parsed.Title) === null || _a === void 0 ? void 0 : _a.Neutral) !== undefined) {
            modConfigAttributes.push({
                type: 'attribute',
                key: 'customFileName',
                value: parsed.Title.Neutral,
            });
        }
        const infoSegments = modInfo.split(path_1.default.sep);
        const modFolderIndex = infoSegments.length >= 1 ? infoSegments.length - 1 : 0;
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
        instructions.push(...modConfigAttributes);
        return Promise.resolve({ instructions });
    });
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluc3RhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTQSw0REFHQztBQUVELGdEQTBDQztBQUVELHdEQWVDO0FBRUQsNENBeUNDO0FBRUQsc0NBU0M7QUFFRCwwQkE2QkM7QUE3SkQsZ0RBQXdCO0FBQ3hCLG9EQUFzQztBQUN0QywyQ0FBa0Q7QUFFbEQscUNBQW9JO0FBRXBJLGlDQUEyQztBQUUzQyxTQUFzQix3QkFBd0IsQ0FBQyxLQUFlLEVBQUUsTUFBYzs7UUFDNUUsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssMkJBQWtCLENBQUMsQ0FBQztRQUNwRyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxNQUFNLEtBQUssZ0JBQU8sQ0FBQyxJQUFJLGNBQWMsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNuRyxDQUFDO0NBQUE7QUFFRCxTQUFzQixrQkFBa0IsQ0FBQyxLQUFlLEVBQUUsZUFBdUI7OztRQUMvRSxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsS0FBSywyQkFBa0IsQ0FBQyxDQUFDO1FBQzdGLE1BQU0sV0FBVyxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3RHLE1BQU0sTUFBTSxHQUFl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LENBQUM7UUFDZixDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFlBQVksRUFBRSxDQUFDLENBQUM7SUFDM0MsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCAqIGFzIHJqc29uIGZyb20gJ3JlbGF4ZWQtanNvbic7XHJcbmltcG9ydCB7IGZzLCB0eXBlcywgbG9nLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBNT0RfQ09ORklHX0RFU1RfRUxFTUVOVCwgTU9EX0lORk9fSlNPTl9GSUxFLCBHQU1FX0lELCBNT0RfQ09ORklHX0ZJTEUsIEFTU0VNQkxZX0VYVCwgTUFQX0VYVCwgSEFMT19HQU1FUyB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgSU1vZENvbmZpZyB9IGZyb20gJy4vdHlwZXMnO1xyXG5pbXBvcnQgeyBpZGVudGlmeUhhbG9HYW1lcyB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdFBsdWdBbmRQbGF5SW5zdGFsbGVyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpIHtcclxuICBjb25zdCBoYXNNb2RJbmZvRmlsZSA9IGZpbGVzLnNvbWUoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPX0pTT05fRklMRSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgaGFzTW9kSW5mb0ZpbGUsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFBsdWdBbmRQbGF5KGZpbGVzOiBzdHJpbmdbXSwgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcpIHtcclxuICBjb25zdCBtb2RJbmZvID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gTU9EX0lORk9fSlNPTl9GSUxFKTtcclxuICBjb25zdCBtb2RJbmZvRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kSW5mbyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICBjb25zdCBwYXJzZWQ6IElNb2RDb25maWcgPSByanNvbi5wYXJzZShtb2RJbmZvRGF0YSkgYXMgSU1vZENvbmZpZztcclxuICBsZXQgbW9kQ29uZmlnQXR0cmlidXRlczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBbXTtcclxuICBtb2RDb25maWdBdHRyaWJ1dGVzLnB1c2goe1xyXG4gICAgdHlwZTogJ2F0dHJpYnV0ZScsXHJcbiAgICBrZXk6ICdoYWxvR2FtZXMnLFxyXG4gICAgdmFsdWU6IFtIQUxPX0dBTUVTW3BhcnNlZC5FbmdpbmUudG9Mb3dlckNhc2UoKV0uaW50ZXJuYWxJZF0sXHJcbiAgfSk7XHJcblxyXG4gIGlmIChwYXJzZWQuTW9kVmVyc2lvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICBtb2RDb25maWdBdHRyaWJ1dGVzLnB1c2goe1xyXG4gICAgICB0eXBlOiAnYXR0cmlidXRlJyxcclxuICAgICAga2V5OiAndmVyc2lvbicsXHJcbiAgICAgIHZhbHVlOiBgJHtwYXJzZWQuTW9kVmVyc2lvbi5NYWpvciB8fCAwfS4ke3BhcnNlZC5Nb2RWZXJzaW9uLk1pbm9yIHx8IDB9LiR7cGFyc2VkLk1vZFZlcnNpb24uUGF0Y2ggfHwgMH1gLFxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBpZiAocGFyc2VkLlRpdGxlPy5OZXV0cmFsICE9PSB1bmRlZmluZWQpIHtcclxuICAgIG1vZENvbmZpZ0F0dHJpYnV0ZXMucHVzaCh7XHJcbiAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAgICBrZXk6ICdjdXN0b21GaWxlTmFtZScsXHJcbiAgICAgIHZhbHVlOiBwYXJzZWQuVGl0bGUuTmV1dHJhbCxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5mb1NlZ21lbnRzID0gbW9kSW5mby5zcGxpdChwYXRoLnNlcCk7XHJcbiAgY29uc3QgbW9kRm9sZGVySW5kZXggPSBpbmZvU2VnbWVudHMubGVuZ3RoID49IDEgPyBpbmZvU2VnbWVudHMubGVuZ3RoIC0gMSA6IDA7XHJcbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmV4dG5hbWUocGF0aC5iYXNlbmFtZShmaWxlKSkgIT09ICcnKTtcclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gZmlsdGVyZWQubWFwKGZpbGUgPT4ge1xyXG4gICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKTtcclxuICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gc2VnbWVudHMuc2xpY2UobW9kRm9sZGVySW5kZXgpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICBzb3VyY2U6IGZpbGUsXHJcbiAgICAgIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbi5qb2luKHBhdGguc2VwKSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIGluc3RydWN0aW9ucy5wdXNoKC4uLm1vZENvbmZpZ0F0dHJpYnV0ZXMpO1xyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0ZXN0TW9kQ29uZmlnSW5zdGFsbGVyKGZpbGVzLCBnYW1lSWQpIHtcclxuICBjb25zdCBpc0Fzc2VtYmx5T25seU1vZCA9ICgpID0+IHtcclxuICAgIC8vIFRoZSBwcmVzZW5zZSBvZiBhbiAuYXNtcCBmaWxlIHdpdGhvdXQgYW55IC5tYXAgZmlsZXMgaXMgYSBjbGVhciBpbmRpY2F0aW9uXHJcbiAgICAvLyAgdGhhdCB0aGlzIG1vZCBjYW4gb25seSBiZSBpbnN0YWxsZWQgdXNpbmcgdGhlIEFzc2VtYmx5IHRvb2wgd2hpY2ggd2UndmVcclxuICAgIC8vICB5ZXQgdG8gaW50ZWdyYXRlIGludG8gVm9ydGV4LiBUaGlzIGluc3RhbGxlciB3aWxsIG5vdCBpbnN0YWxsIHRoZXNlIG1vZHMuXHJcbiAgICByZXR1cm4gKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkgPT09IEFTU0VNQkxZX0VYVCkgIT09IHVuZGVmaW5lZClcclxuICAgICAgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkgPT09IE1BUF9FWFQpID09PSB1bmRlZmluZWQpO1xyXG4gIH07XHJcbiAgcmV0dXJuIChnYW1lSWQgIT09IEdBTUVfSUQpXHJcbiAgID8gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSlcclxuICAgOiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgIHN1cHBvcnRlZDogKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSBNT0RfQ09ORklHX0ZJTEUpICE9PSB1bmRlZmluZWQpXHJcbiAgICAgICYmICFpc0Fzc2VtYmx5T25seU1vZCgpLFxyXG4gICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsTW9kQ29uZmlnKGZpbGVzOiBzdHJpbmdbXSwgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcpIHtcclxuICAvLyBGaW5kIHRoZSBtb2QgY29uZmlnIGZpbGUgYW5kIHVzZSBpdCB0byBidWlsZCB0aGUgaW5zdHJ1Y3Rpb25zLlxyXG4gIGNvbnN0IG1vZENvbmZpZ0ZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKSA9PT0gTU9EX0NPTkZJR19GSUxFKTtcclxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHtcclxuICAgIC8vIE5vIGRpcmVjdG9yaWVzLCBhc3NlbWJseSB0b29sIGZpbGVzLCByZWFkbWVzIG9yIG1vZCBjb25maWcgZmlsZXMuXHJcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApO1xyXG4gICAgY29uc3QgbGFzdEVsZW1lbnRFeHQgPSBwYXRoLmV4dG5hbWUoc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0pO1xyXG4gICAgcmV0dXJuIChtb2RDb25maWdGaWxlICE9PSBmaWxlKSAmJiBbJycsICcudHh0JywgQVNTRU1CTFlfRVhUXS5pbmRleE9mKGxhc3RFbGVtZW50RXh0KSA9PT0gLTE7XHJcbiAgfSk7XHJcbiAgY29uc3QgY29uZmlnRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgbW9kQ29uZmlnRmlsZSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcclxuICBsZXQgZGF0YTtcclxuICB0cnkge1xyXG4gICAgZGF0YSA9IHJqc29uLnBhcnNlKHV0aWwuZGVCT00oY29uZmlnRGF0YSkpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgbG9nKCdlcnJvcicsICdVbmFibGUgdG8gcGFyc2UgbW9kcGFja19jb25maWcuY2ZnJywgZXJyKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnSW52YWxpZCBtb2RwYWNrX2NvbmZpZy5jZmcgZmlsZScpKTtcclxuICB9XHJcblxyXG4gIGlmICghZGF0YS5lbnRyaWVzKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ21vZHBhY2tfY29uZmlnLmNmZyBmaWxlIGNvbnRhaW5zIG5vIGVudHJpZXMnKSlcclxuICB9XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbHRlcmVkLnJlZHVjZSgoYWNjdW0sIGZpbGUpID0+IHtcclxuICAgIGNvbnN0IG1hdGNoaW5nRW50cnkgPSBkYXRhLmVudHJpZXMuZmluZChlbnRyeSA9PlxyXG4gICAgICAoJ3NyYycgaW4gZW50cnkpICYmIChlbnRyeS5zcmMudG9Mb3dlckNhc2UoKSA9PT0gZmlsZS50b0xvd2VyQ2FzZSgpKSk7XHJcbiAgICBpZiAoISFtYXRjaGluZ0VudHJ5KSB7XHJcbiAgICAgIGNvbnN0IGRlc3RpbmF0aW9uID0gbWF0Y2hpbmdFbnRyeS5kZXN0LnN1YnN0cmluZyhNT0RfQ09ORklHX0RFU1RfRUxFTUVOVC5sZW5ndGgpO1xyXG4gICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uLFxyXG4gICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFRoaXMgbWF5IGp1c3QgYmUgYSBwb2ludGxlc3MgYWRkaXRpb24gYnkgdGhlIG1vZCBhdXRob3IgLSB3ZSdyZSBnb2luZyB0byBsb2dcclxuICAgICAgLy8gIHRoaXMgYW5kIGNvbnRpbnVlLlxyXG4gICAgICBsb2coJ3dhcm4nLCAnRmFpbGVkIHRvIGZpbmQgbWF0Y2hpbmcgbWFuaWZlc3QgZW50cnkgZm9yIGZpbGUgaW4gYXJjaGl2ZScsIGZpbGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKTtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGVzdEluc3RhbGxlcihmaWxlcywgZ2FtZUlkKSB7XHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG4gIH1cclxuICBjb25zdCBoYWxvR2FtZXMgPSBpZGVudGlmeUhhbG9HYW1lcyhmaWxlcyk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQ6IChoYWxvR2FtZXMubGVuZ3RoID4gMCksXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGwoZmlsZXM6IHN0cmluZ1tdLCBkZXN0aW5hdGlvblBhdGg6IHN0cmluZykge1xyXG4gIGNvbnN0IGhhbG9HYW1lcyA9ICBpZGVudGlmeUhhbG9HYW1lcyhmaWxlcyk7XHJcbiAgY29uc3QgaW50ZXJuYWxJZHMgPSBoYWxvR2FtZXMubWFwKGdhbWUgPT4gZ2FtZS5pbnRlcm5hbElkKTtcclxuICBjb25zdCBhdHRySW5zdHJ1Y3Rpb246IHR5cGVzLklJbnN0cnVjdGlvbiA9IHtcclxuICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxyXG4gICAga2V5OiAnaGFsb0dhbWVzJyxcclxuICAgIHZhbHVlOiBpbnRlcm5hbElkcyxcclxuICB9XHJcbiAgICBcclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gaGFsb0dhbWVzLnJlZHVjZSgoYWNjdW0sIGhhbG9HYW1lKSA9PiB7XHJcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHtcclxuICAgICAgY29uc3Qgc2VnbWVudHMgPSBmaWxlLnNwbGl0KHBhdGguc2VwKS5maWx0ZXIoc2VnID0+ICEhc2VnKTtcclxuICAgICAgcmV0dXJuIChwYXRoLmV4dG5hbWUoc2VnbWVudHNbc2VnbWVudHMubGVuZ3RoIC0gMV0pICE9PSAnJylcclxuICAgICAgICAmJiAoc2VnbWVudHMuaW5kZXhPZihoYWxvR2FtZS5tb2RzUGF0aCkgIT09IC0xKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGZpbHRlcmVkLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gZWxlbWVudC5zcGxpdChwYXRoLnNlcCkuZmlsdGVyKHNlZyA9PiAhIXNlZyk7XHJcbiAgICAgIGNvbnN0IHJvb3RJZHggPSBzZWdtZW50cy5pbmRleE9mKGhhbG9HYW1lLm1vZHNQYXRoKTtcclxuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBzZWdtZW50cy5zcGxpY2Uocm9vdElkeCkuam9pbihwYXRoLnNlcCk7XHJcbiAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGVsZW1lbnQsXHJcbiAgICAgICAgZGVzdGluYXRpb25cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbYXR0ckluc3RydWN0aW9uXSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufSJdfQ==