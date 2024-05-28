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
exports.installReplacer = exports.testReplacer = exports.testBG3SE = exports.installLSLib = exports.installEngineInjector = exports.installModFixer = exports.installBG3SE = exports.testEngineInjector = exports.testModFixer = exports.testLSLib = void 0;
const exe_version_1 = __importDefault(require("exe-version"));
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const common_1 = require("./common");
const util_1 = require("./util");
function testLSLib(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (gameId !== common_1.GAME_ID) {
            return Promise.resolve({ supported: false, requiredFiles: [] });
        }
        const matchedFiles = files.filter(file => common_1.LSLIB_FILES.has(path.basename(file).toLowerCase()));
        return Promise.resolve({
            supported: matchedFiles.length >= 2,
            requiredFiles: [],
        });
    });
}
exports.testLSLib = testLSLib;
function testModFixer(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const notSupported = { supported: false, requiredFiles: [] };
        if (gameId !== common_1.GAME_ID) {
            return Promise.resolve(notSupported);
        }
        const lowered = files.map(file => file.toLowerCase());
        const hasModFixerPak = lowered.find(file => path.basename(file) === 'modfixer.pak') !== undefined;
        if (!hasModFixerPak) {
            return Promise.resolve(notSupported);
        }
        return Promise.resolve({
            supported: true,
            requiredFiles: []
        });
    });
}
exports.testModFixer = testModFixer;
function testEngineInjector(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const notSupported = { supported: false, requiredFiles: [] };
        if (gameId !== common_1.GAME_ID) {
            return Promise.resolve(notSupported);
        }
        const lowered = files.map(file => file.toLowerCase());
        const hasBinFolder = lowered.find(file => file.indexOf('bin' + path.sep) !== -1) !== undefined;
        if (!hasBinFolder) {
            return Promise.resolve(notSupported);
        }
        return Promise.resolve({
            supported: true,
            requiredFiles: []
        });
    });
}
exports.testEngineInjector = testEngineInjector;
function installBG3SE(files) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, util_1.logDebug)('installBG3SE files:', files);
        files = files.filter(f => path.extname(f) !== '' && !f.endsWith(path.sep));
        files = files.filter(f => path.extname(f) === '.dll');
        const instructions = files.reduce((accum, filePath) => {
            accum.push({
                type: 'copy',
                source: filePath,
                destination: path.basename(filePath),
            });
            return accum;
        }, []);
        (0, util_1.logDebug)('installBG3SE instructions:', instructions);
        return Promise.resolve({ instructions });
    });
}
exports.installBG3SE = installBG3SE;
function installModFixer(files) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, util_1.logDebug)('installModFixer files:', files);
        files = files.filter(f => path.extname(f) !== '' && !f.endsWith(path.sep));
        files = files.filter(f => path.extname(f) === '.pak');
        const modFixerAttribute = { type: 'attribute', key: 'modFixer', value: true };
        const instructions = files.reduce((accum, filePath) => {
            accum.push({
                type: 'copy',
                source: filePath,
                destination: path.basename(filePath),
            });
            return accum;
        }, [modFixerAttribute]);
        (0, util_1.logDebug)('installModFixer instructions:', instructions);
        return Promise.resolve({ instructions });
    });
}
exports.installModFixer = installModFixer;
function installEngineInjector(files) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, util_1.logDebug)('installEngineInjector files:', files);
        files = files.filter(f => path.extname(f) !== '' && !f.endsWith(path.sep));
        const modtypeAttr = { type: 'setmodtype', value: 'dinput' };
        const instructions = files.reduce((accum, filePath) => {
            const binIndex = filePath.toLowerCase().indexOf('bin' + path.sep);
            if (binIndex !== -1) {
                (0, util_1.logDebug)(filePath.substring(binIndex));
                accum.push({
                    type: 'copy',
                    source: filePath,
                    destination: filePath.substring(binIndex),
                });
            }
            return accum;
        }, [modtypeAttr]);
        (0, util_1.logDebug)('installEngineInjector instructions:', instructions);
        return Promise.resolve({ instructions });
    });
}
exports.installEngineInjector = installEngineInjector;
function installLSLib(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const exe = files.find(file => path.basename(file.toLowerCase()) === 'divine.exe');
        const exePath = path.join(destinationPath, exe);
        let ver = yield (0, exe_version_1.default)(exePath);
        ver = ver.split('.').slice(0, 3).join('.');
        const fileName = path.basename(destinationPath, path.extname(destinationPath));
        const idx = fileName.indexOf('-v');
        const fileNameVer = fileName.slice(idx + 2);
        if (semver.valid(fileNameVer) && ver !== fileNameVer) {
            ver = fileNameVer;
        }
        const versionAttr = { type: 'attribute', key: 'version', value: ver };
        const modtypeAttr = { type: 'setmodtype', value: 'bg3-lslib-divine-tool' };
        const instructions = files.reduce((accum, filePath) => {
            if (filePath.toLowerCase()
                .split(path.sep)
                .indexOf('tools') !== -1
                && !filePath.endsWith(path.sep)) {
                accum.push({
                    type: 'copy',
                    source: filePath,
                    destination: path.join('tools', path.basename(filePath)),
                });
            }
            return accum;
        }, [modtypeAttr, versionAttr]);
        return Promise.resolve({ instructions });
    });
}
exports.installLSLib = installLSLib;
function testBG3SE(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (gameId !== common_1.GAME_ID) {
            return Promise.resolve({ supported: false, requiredFiles: [] });
        }
        const hasDWriteDll = files.find(file => path.basename(file).toLowerCase() === 'dwrite.dll') !== undefined;
        return Promise.resolve({
            supported: hasDWriteDll,
            requiredFiles: [],
        });
    });
}
exports.testBG3SE = testBG3SE;
function testReplacer(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return Promise.resolve({ supported: false, requiredFiles: [] });
    }
    const paks = files.filter(file => path.extname(file).toLowerCase() === '.pak');
    const hasGenOrPublicFolder = ['generated', 'public'].some(segment => files.find(file => file.toLowerCase().indexOf(segment + path.sep) !== -1) !== undefined);
    return Promise.resolve({
        supported: hasGenOrPublicFolder || paks.length === 0,
        requiredFiles: [],
    });
}
exports.testReplacer = testReplacer;
function installReplacer(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const directories = Array.from(new Set(files.map(file => path.dirname(file).toUpperCase())));
        let dataPath = undefined;
        const genOrPublic = directories
            .find(dir => ['PUBLIC', 'GENERATED'].includes(path.basename(dir)));
        if (genOrPublic !== undefined) {
            dataPath = path.dirname(genOrPublic);
        }
        if (dataPath === undefined) {
            dataPath = directories.find(dir => path.basename(dir) === 'DATA');
        }
        const instructions = (dataPath !== undefined)
            ? files.reduce((prev, filePath) => {
                if (filePath.endsWith(path.sep)) {
                    return prev;
                }
                const relPath = path.relative(dataPath, filePath);
                if (!relPath.startsWith('..')) {
                    prev.push({
                        type: 'copy',
                        source: filePath,
                        destination: relPath,
                    });
                }
                return prev;
            }, [])
            : files.map((filePath) => ({
                type: 'copy',
                source: filePath,
                destination: filePath,
            }));
        return Promise.resolve({
            instructions,
        });
    });
}
exports.installReplacer = installReplacer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluc3RhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw4REFBcUM7QUFDckMsMkNBQTZCO0FBQzdCLCtDQUFpQztBQUdqQyxxQ0FBZ0Q7QUFDaEQsaUNBQWtDO0FBRWxDLFNBQXNCLFNBQVMsQ0FBQyxLQUFlLEVBQUUsTUFBYzs7UUFDN0QsSUFBSSxNQUFNLEtBQUssZ0JBQU8sRUFBRTtZQUN0QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ2pFO1FBQ0QsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLG9CQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTlGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNyQixTQUFTLEVBQUUsWUFBWSxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQ25DLGFBQWEsRUFBRSxFQUFFO1NBQ2xCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FBQTtBQVZELDhCQVVDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLEtBQWUsRUFBRSxNQUFjOztRQUVoRSxNQUFNLFlBQVksR0FBRyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBRTdELElBQUksTUFBTSxLQUFLLGdCQUFPLEVBQUU7WUFFdEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUks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QyxDQUFDO0lBQ0wsQ0FBQztDQUFBO0FBcENELDBDQW9DQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBnZXRWZXJzaW9uIGZyb20gJ2V4ZS12ZXJzaW9uJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcbmltcG9ydCB7IHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBMU0xJQl9GSUxFUywgR0FNRV9JRCB9IGZyb20gJy4vY29tbW9uJztcclxuaW1wb3J0IHsgbG9nRGVidWcgfSBmcm9tICcuL3V0aWwnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RMU0xpYihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG4gIH1cclxuICBjb25zdCBtYXRjaGVkRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBMU0xJQl9GSUxFUy5oYXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkOiBtYXRjaGVkRmlsZXMubGVuZ3RoID49IDIsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RNb2RGaXhlcihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcblxyXG4gIGNvbnN0IG5vdFN1cHBvcnRlZCA9IHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfTtcclxuXHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gZGlmZmVyZW50IGdhbWUuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb3dlcmVkID0gZmlsZXMubWFwKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpKTtcclxuICAvL2NvbnN0IGJpbkZvbGRlciA9IGxvd2VyZWQuZmluZChmaWxlID0+IGZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ2JpbicpICE9PSAtMSk7XHJcblxyXG4gIGNvbnN0IGhhc01vZEZpeGVyUGFrID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKSA9PT0gJ21vZGZpeGVyLnBhaycpICE9PSB1bmRlZmluZWQ7XHJcblxyXG4gIGlmICghaGFzTW9kRml4ZXJQYWspIHtcclxuICAgIC8vIHRoZXJlJ3Mgbm8gbW9kZml4ZXIucGFrIGZvbGRlci5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICBzdXBwb3J0ZWQ6IHRydWUsXHJcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtdXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0RW5naW5lSW5qZWN0b3IoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xyXG5cclxuICBjb25zdCBub3RTdXBwb3J0ZWQgPSB7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH07XHJcblxyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIC8vIGRpZmZlcmVudCBnYW1lLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgbG93ZXJlZCA9IGZpbGVzLm1hcChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKSk7XHJcbiAgLy9jb25zdCBiaW5Gb2xkZXIgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLnNwbGl0KHBhdGguc2VwKS5pbmRleE9mKCdiaW4nKSAhPT0gLTEpO1xyXG5cclxuICBjb25zdCBoYXNCaW5Gb2xkZXIgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLmluZGV4T2YoJ2JpbicgKyBwYXRoLnNlcCkgIT09IC0xKSAhPT0gdW5kZWZpbmVkO1xyXG5cclxuICBpZiAoIWhhc0JpbkZvbGRlcikge1xyXG4gICAgLy8gdGhlcmUncyBubyBiaW4gZm9sZGVyLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgIHN1cHBvcnRlZDogdHJ1ZSxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW11cclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGxCRzNTRShmaWxlczogc3RyaW5nW10pOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgXHJcbiAgbG9nRGVidWcoJ2luc3RhbGxCRzNTRSBmaWxlczonLCBmaWxlcyk7XHJcblxyXG4gIC8vIEZpbHRlciBvdXQgZm9sZGVycyBhcyB0aGlzIGJyZWFrcyB0aGUgaW5zdGFsbGVyLlxyXG4gIGZpbGVzID0gZmlsZXMuZmlsdGVyKGYgPT4gcGF0aC5leHRuYW1lKGYpICE9PSAnJyAmJiAhZi5lbmRzV2l0aChwYXRoLnNlcCkpO1xyXG5cclxuICAvLyBGaWx0ZXIgb25seSBkbGwgZmlsZXMuXHJcbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgPT09ICcuZGxsJyk7XHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWxlcy5yZWR1Y2UoKGFjY3VtOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4geyAgICBcclxuICAgICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgZGVzdGluYXRpb246IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLFxyXG4gICAgICB9KTsgICAgXHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwgW10pO1xyXG5cclxuICBsb2dEZWJ1ZygnaW5zdGFsbEJHM1NFIGluc3RydWN0aW9uczonLCBpbnN0cnVjdGlvbnMpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59IFxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGxNb2RGaXhlcihmaWxlczogc3RyaW5nW10pOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgXHJcbiAgbG9nRGVidWcoJ2luc3RhbGxNb2RGaXhlciBmaWxlczonLCBmaWxlcyk7XHJcblxyXG4gIC8vIEZpbHRlciBvdXQgZm9sZGVycyBhcyB0aGlzIGJyZWFrcyB0aGUgaW5zdGFsbGVyLlxyXG4gIGZpbGVzID0gZmlsZXMuZmlsdGVyKGYgPT4gcGF0aC5leHRuYW1lKGYpICE9PSAnJyAmJiAhZi5lbmRzV2l0aChwYXRoLnNlcCkpO1xyXG5cclxuICAvLyBGaWx0ZXIgb25seSBwYWsgZmlsZXMuXHJcbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgPT09ICcucGFrJyk7XHJcblxyXG4gIGNvbnN0IG1vZEZpeGVyQXR0cmlidXRlOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdhdHRyaWJ1dGUnLCBrZXk6ICdtb2RGaXhlcicsIHZhbHVlOiB0cnVlIH1cclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbGVzLnJlZHVjZSgoYWNjdW06IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7ICAgIFxyXG4gICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksXHJcbiAgICAgIH0pOyAgICBcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbIG1vZEZpeGVyQXR0cmlidXRlIF0pO1xyXG5cclxuICBsb2dEZWJ1ZygnaW5zdGFsbE1vZEZpeGVyIGluc3RydWN0aW9uczonLCBpbnN0cnVjdGlvbnMpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59IFxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGxFbmdpbmVJbmplY3RvcihmaWxlczogc3RyaW5nW10pOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgXHJcbiAgbG9nRGVidWcoJ2luc3RhbGxFbmdpbmVJbmplY3RvciBmaWxlczonLCBmaWxlcyk7XHJcblxyXG4gIC8vIEZpbHRlciBvdXQgZm9sZGVycyBhcyB0aGlzIGJyZWFrcyB0aGUgaW5zdGFsbGVyLlxyXG4gIGZpbGVzID0gZmlsZXMuZmlsdGVyKGYgPT4gcGF0aC5leHRuYW1lKGYpICE9PSAnJyAmJiAhZi5lbmRzV2l0aChwYXRoLnNlcCkpO1xyXG5cclxuICBjb25zdCBtb2R0eXBlQXR0cjogdHlwZXMuSUluc3RydWN0aW9uID0geyB0eXBlOiAnc2V0bW9kdHlwZScsIHZhbHVlOiAnZGlucHV0JyB9IFxyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gZmlsZXMucmVkdWNlKChhY2N1bTogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcclxuICAgIFxyXG4gICAgLy8gc2VlIGlmIHdlIGhhdmUgYSBiaW4gZm9sZGVyXHJcbiAgICAvLyB0aGVuIHdlIG5lZWQgdG8gdXNlIHRoYXQgYXMgYSBuZXcgcm9vdCBpbmNhc2UgdGhlIC9iaW4gaXMgbmVzdGVkXHJcblxyXG4gICAgY29uc3QgYmluSW5kZXggPSBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2JpbicgKyBwYXRoLnNlcCk7XHJcblxyXG4gICAgaWYgKGJpbkluZGV4ICE9PSAtMSkge1xyXG5cclxuICAgICAgbG9nRGVidWcoZmlsZVBhdGguc3Vic3RyaW5nKGJpbkluZGV4KSk7XHJcblxyXG4gICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICBkZXN0aW5hdGlvbjogZmlsZVBhdGguc3Vic3RyaW5nKGJpbkluZGV4KSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjdW07XHJcbiAgfSwgWyBtb2R0eXBlQXR0ciBdKTtcclxuXHJcbiAgbG9nRGVidWcoJ2luc3RhbGxFbmdpbmVJbmplY3RvciBpbnN0cnVjdGlvbnM6JywgaW5zdHJ1Y3Rpb25zKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGxMU0xpYihmaWxlczogc3RyaW5nW10sIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xyXG4gIGNvbnN0IGV4ZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUudG9Mb3dlckNhc2UoKSkgPT09ICdkaXZpbmUuZXhlJyk7XHJcbiAgY29uc3QgZXhlUGF0aCA9IHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIGV4ZSk7XHJcbiAgbGV0IHZlcjogc3RyaW5nID0gYXdhaXQgZ2V0VmVyc2lvbihleGVQYXRoKTtcclxuICB2ZXIgPSB2ZXIuc3BsaXQoJy4nKS5zbGljZSgwLCAzKS5qb2luKCcuJyk7XHJcblxyXG4gIC8vIFVuZm9ydHVuYXRlbHkgdGhlIExTTGliIGRldmVsb3BlciBpcyBub3QgY29uc2lzdGVudCB3aGVuIGNoYW5naW5nXHJcbiAgLy8gIGZpbGUgdmVyc2lvbnMgLSB0aGUgZXhlY3V0YWJsZSBhdHRyaWJ1dGUgbWlnaHQgaGF2ZSBhbiBvbGRlciB2ZXJzaW9uXHJcbiAgLy8gIHZhbHVlIHRoYW4gdGhlIG9uZSBzcGVjaWZpZWQgYnkgdGhlIGZpbGVuYW1lIC0gd2UncmUgZ29pbmcgdG8gdXNlXHJcbiAgLy8gIHRoZSBmaWxlbmFtZSBhcyB0aGUgcG9pbnQgb2YgdHJ1dGggKnVnaCpcclxuICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZGVzdGluYXRpb25QYXRoLCBwYXRoLmV4dG5hbWUoZGVzdGluYXRpb25QYXRoKSk7XHJcbiAgY29uc3QgaWR4ID0gZmlsZU5hbWUuaW5kZXhPZignLXYnKTtcclxuICBjb25zdCBmaWxlTmFtZVZlciA9IGZpbGVOYW1lLnNsaWNlKGlkeCArIDIpO1xyXG4gIGlmIChzZW12ZXIudmFsaWQoZmlsZU5hbWVWZXIpICYmIHZlciAhPT0gZmlsZU5hbWVWZXIpIHtcclxuICAgIHZlciA9IGZpbGVOYW1lVmVyO1xyXG4gIH1cclxuICBjb25zdCB2ZXJzaW9uQXR0cjogdHlwZXMuSUluc3RydWN0aW9uID0geyB0eXBlOiAnYXR0cmlidXRlJywga2V5OiAndmVyc2lvbicsIHZhbHVlOiB2ZXIgfTtcclxuICBjb25zdCBtb2R0eXBlQXR0cjogdHlwZXMuSUluc3RydWN0aW9uID0geyB0eXBlOiAnc2V0bW9kdHlwZScsIHZhbHVlOiAnYmczLWxzbGliLWRpdmluZS10b29sJyB9O1xyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPVxyXG4gICAgZmlsZXMucmVkdWNlKChhY2N1bTogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGZpbGVQYXRoLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAuc3BsaXQocGF0aC5zZXApXHJcbiAgICAgICAgLmluZGV4T2YoJ3Rvb2xzJykgIT09IC0xXHJcbiAgICAgICAgJiYgIWZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSkge1xyXG4gICAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oJ3Rvb2xzJywgcGF0aC5iYXNlbmFtZShmaWxlUGF0aCkpLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFttb2R0eXBlQXR0ciwgdmVyc2lvbkF0dHJdKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RCRzNTRShmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcbiAgXHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaGFzRFdyaXRlRGxsID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gJ2R3cml0ZS5kbGwnKSAhPT0gdW5kZWZpbmVkO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgIHN1cHBvcnRlZDogaGFzRFdyaXRlRGxsLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0ZXN0UmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xyXG4gIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcclxuICB9XHJcbiAgY29uc3QgcGFrcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpO1xyXG4gIC8vIGRvIHdlIGhhdmUgYSBwdWJsaWMgb3IgZ2VuZXJhdGVkIGZvbGRlcj9cclxuICBjb25zdCBoYXNHZW5PclB1YmxpY0ZvbGRlcjogYm9vbGVhbiA9IFsnZ2VuZXJhdGVkJywgJ3B1YmxpYyddLnNvbWUoc2VnbWVudCA9PlxyXG4gICAgZmlsZXMuZmluZChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKHNlZ21lbnQgKyBwYXRoLnNlcCkgIT09IC0xKSAhPT0gdW5kZWZpbmVkKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQ6IGhhc0dlbk9yUHVibGljRm9sZGVyIHx8IHBha3MubGVuZ3RoID09PSAwLFxyXG4gICAgcmVxdWlyZWRGaWxlczogW10sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsUmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xyXG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gQXJyYXkuZnJvbShuZXcgU2V0KGZpbGVzLm1hcChmaWxlID0+IHBhdGguZGlybmFtZShmaWxlKS50b1VwcGVyQ2FzZSgpKSkpO1xyXG4gIGxldCBkYXRhUGF0aCA9IHVuZGVmaW5lZDtcclxuICBjb25zdCBnZW5PclB1YmxpYyA9IGRpcmVjdG9yaWVzXHJcbiAgICAuZmluZChkaXIgPT4gWydQVUJMSUMnLCAnR0VORVJBVEVEJ10uaW5jbHVkZXMocGF0aC5iYXNlbmFtZShkaXIpKSk7XHJcbiAgaWYgKGdlbk9yUHVibGljICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGRhdGFQYXRoID0gcGF0aC5kaXJuYW1lKGdlbk9yUHVibGljKTtcclxuICB9XHJcbiAgaWYgKGRhdGFQYXRoID09PSB1bmRlZmluZWQpIHtcclxuICAgIGRhdGFQYXRoID0gZGlyZWN0b3JpZXMuZmluZChkaXIgPT4gcGF0aC5iYXNlbmFtZShkaXIpID09PSAnREFUQScpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IChkYXRhUGF0aCAhPT0gdW5kZWZpbmVkKVxyXG4gICAgPyBmaWxlcy5yZWR1Y2UoKHByZXY6IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChmaWxlUGF0aC5lbmRzV2l0aChwYXRoLnNlcCkpIHtcclxuICAgICAgICByZXR1cm4gcHJldjtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShkYXRhUGF0aCwgZmlsZVBhdGgpO1xyXG4gICAgICBpZiAoIXJlbFBhdGguc3RhcnRzV2l0aCgnLi4nKSkge1xyXG4gICAgICAgIHByZXYucHVzaCh7XHJcbiAgICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHJlbFBhdGgsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHByZXY7XHJcbiAgICB9LCBbXSlcclxuICAgIDogZmlsZXMubWFwKChmaWxlUGF0aDogc3RyaW5nKTogdHlwZXMuSUluc3RydWN0aW9uID0+ICh7XHJcbiAgICAgICAgdHlwZTogJ2NvcHknLFxyXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgZGVzdGluYXRpb246IGZpbGVQYXRoLFxyXG4gICAgICB9KSk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgaW5zdHJ1Y3Rpb25zLFxyXG4gIH0pO1xyXG59XHJcblxyXG4iXX0=