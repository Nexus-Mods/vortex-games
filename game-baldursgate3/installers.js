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
    return Promise.resolve({
        supported: paks.length === 0,
        requiredFiles: [],
    });
}
exports.testReplacer = testReplacer;
function installReplacer(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const directories = Array.from(new Set(files.map(file => path.dirname(file).toUpperCase())));
        let dataPath = directories.find(dir => path.basename(dir) === 'DATA');
        if (dataPath === undefined) {
            const genOrPublic = directories
                .find(dir => ['PUBLIC', 'GENERATED'].includes(path.basename(dir)));
            if (genOrPublic !== undefined) {
                dataPath = path.dirname(genOrPublic);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluc3RhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw4REFBcUM7QUFDckMsMkNBQTZCO0FBQzdCLCtDQUFpQztBQUdqQyxxQ0FBZ0Q7QUFDaEQsaUNBQWtDO0FBRWxDLFNBQXNCLFNBQVMsQ0FBQyxLQUFlLEVBQUUsTUFBYzs7UUFDN0QsSUFBSSxNQUFNLEtBQUssZ0JBQU8sRUFBRTtZQUN0QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ2pFO1FBQ0QsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLG9CQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTlGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNyQixTQUFTLEVBQUUsWUFBWSxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQ25DLGFBQWEsRUFBRSxFQUFFO1NBQ2xCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FBQTtBQVZELDhCQVVDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLEtBQWUsRUFBRSxNQUFjOztRQUVoRSxNQUFNLFlBQVksR0FBRyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBRTdELElBQUksTUFBTSxLQUFLLGdCQUFPLEVBQUU7WUFFdEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUks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QztZQUNqRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQTBCLEVBQUUsUUFBZ0IsRUFBRSxFQUFFO2dCQUM5RCxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUMvQixPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFDRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzdCLElBQUksQ0FBQyxJQUFJLENBQUM7d0JBQ1IsSUFBSSxFQUFFLE1BQU07d0JBQ1osTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLFdBQVcsRUFBRSxPQUFPO3FCQUNyQixDQUFDLENBQUM7aUJBQ0o7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ04sQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFnQixFQUFzQixFQUFFLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxFQUFFLE1BQU07Z0JBQ1osTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFdBQVcsRUFBRSxRQUFRO2FBQ3RCLENBQUMsQ0FBQyxDQUFDO1FBRVIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ3JCLFlBQVk7U0FDYixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQUE7QUFuQ0QsMENBbUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cclxuaW1wb3J0IGdldFZlcnNpb24gZnJvbSAnZXhlLXZlcnNpb24nO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IExTTElCX0ZJTEVTLCBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgeyBsb2dEZWJ1ZyB9IGZyb20gJy4vdXRpbCc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdExTTGliKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbiAgfVxyXG4gIGNvbnN0IG1hdGNoZWRGaWxlcyA9IGZpbGVzLmZpbHRlcihmaWxlID0+IExTTElCX0ZJTEVTLmhhcyhwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkpKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBzdXBwb3J0ZWQ6IG1hdGNoZWRGaWxlcy5sZW5ndGggPj0gMixcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdE1vZEZpeGVyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcclxuXHJcbiAgY29uc3Qgbm90U3VwcG9ydGVkID0geyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9O1xyXG5cclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICAvLyBkaWZmZXJlbnQgZ2FtZS5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGxvd2VyZWQgPSBmaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkpO1xyXG4gIC8vY29uc3QgYmluRm9sZGVyID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignYmluJykgIT09IC0xKTtcclxuXHJcbiAgY29uc3QgaGFzTW9kRml4ZXJQYWsgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSAnbW9kZml4ZXIucGFrJykgIT09IHVuZGVmaW5lZDtcclxuXHJcbiAgaWYgKCFoYXNNb2RGaXhlclBhaykge1xyXG4gICAgLy8gdGhlcmUncyBubyBtb2RmaXhlci5wYWsgZm9sZGVyLlxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgIHN1cHBvcnRlZDogdHJ1ZSxcclxuICAgICAgcmVxdWlyZWRGaWxlczogW11cclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RFbmdpbmVJbmplY3RvcihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcblxyXG4gIGNvbnN0IG5vdFN1cHBvcnRlZCA9IHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfTtcclxuXHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgLy8gZGlmZmVyZW50IGdhbWUuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBsb3dlcmVkID0gZmlsZXMubWFwKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpKTtcclxuICAvL2NvbnN0IGJpbkZvbGRlciA9IGxvd2VyZWQuZmluZChmaWxlID0+IGZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ2JpbicpICE9PSAtMSk7XHJcblxyXG4gIGNvbnN0IGhhc0JpbkZvbGRlciA9IGxvd2VyZWQuZmluZChmaWxlID0+IGZpbGUuaW5kZXhPZignYmluJyArIHBhdGguc2VwKSAhPT0gLTEpICE9PSB1bmRlZmluZWQ7XHJcblxyXG4gIGlmICghaGFzQmluRm9sZGVyKSB7XHJcbiAgICAvLyB0aGVyZSdzIG5vIGJpbiBmb2xkZXIuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5vdFN1cHBvcnRlZCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgc3VwcG9ydGVkOiB0cnVlLFxyXG4gICAgICByZXF1aXJlZEZpbGVzOiBbXVxyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zdGFsbEJHM1NFKGZpbGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBcclxuICBsb2dEZWJ1ZygnaW5zdGFsbEJHM1NFIGZpbGVzOicsIGZpbGVzKTtcclxuXHJcbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXHJcbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgIT09ICcnICYmICFmLmVuZHNXaXRoKHBhdGguc2VwKSk7XHJcblxyXG4gIC8vIEZpbHRlciBvbmx5IGRsbCBmaWxlcy5cclxuICBmaWxlcyA9IGZpbGVzLmZpbHRlcihmID0+IHBhdGguZXh0bmFtZShmKSA9PT0gJy5kbGwnKTtcclxuXHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbGVzLnJlZHVjZSgoYWNjdW06IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7ICAgIFxyXG4gICAgICBhY2N1bS5wdXNoKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksXHJcbiAgICAgIH0pOyAgICBcclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbXSk7XHJcblxyXG4gIGxvZ0RlYnVnKCdpbnN0YWxsQkczU0UgaW5zdHJ1Y3Rpb25zOicsIGluc3RydWN0aW9ucyk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn0gXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zdGFsbE1vZEZpeGVyKGZpbGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBcclxuICBsb2dEZWJ1ZygnaW5zdGFsbE1vZEZpeGVyIGZpbGVzOicsIGZpbGVzKTtcclxuXHJcbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXHJcbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgIT09ICcnICYmICFmLmVuZHNXaXRoKHBhdGguc2VwKSk7XHJcblxyXG4gIC8vIEZpbHRlciBvbmx5IHBhayBmaWxlcy5cclxuICBmaWxlcyA9IGZpbGVzLmZpbHRlcihmID0+IHBhdGguZXh0bmFtZShmKSA9PT0gJy5wYWsnKTtcclxuXHJcbiAgY29uc3QgbW9kRml4ZXJBdHRyaWJ1dGU6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ2F0dHJpYnV0ZScsIGtleTogJ21vZEZpeGVyJywgdmFsdWU6IHRydWUgfVxyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gZmlsZXMucmVkdWNlKChhY2N1bTogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHsgICAgXHJcbiAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSxcclxuICAgICAgfSk7ICAgIFxyXG4gICAgcmV0dXJuIGFjY3VtO1xyXG4gIH0sIFsgbW9kRml4ZXJBdHRyaWJ1dGUgXSk7XHJcblxyXG4gIGxvZ0RlYnVnKCdpbnN0YWxsTW9kRml4ZXIgaW5zdHJ1Y3Rpb25zOicsIGluc3RydWN0aW9ucyk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XHJcbn0gXHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zdGFsbEVuZ2luZUluamVjdG9yKGZpbGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBcclxuICBsb2dEZWJ1ZygnaW5zdGFsbEVuZ2luZUluamVjdG9yIGZpbGVzOicsIGZpbGVzKTtcclxuXHJcbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXHJcbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgIT09ICcnICYmICFmLmVuZHNXaXRoKHBhdGguc2VwKSk7XHJcblxyXG4gIGNvbnN0IG1vZHR5cGVBdHRyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdzZXRtb2R0eXBlJywgdmFsdWU6ICdkaW5wdXQnIH0gXHJcblxyXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWxlcy5yZWR1Y2UoKGFjY3VtOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgXHJcbiAgICAvLyBzZWUgaWYgd2UgaGF2ZSBhIGJpbiBmb2xkZXJcclxuICAgIC8vIHRoZW4gd2UgbmVlZCB0byB1c2UgdGhhdCBhcyBhIG5ldyByb290IGluY2FzZSB0aGUgL2JpbiBpcyBuZXN0ZWRcclxuXHJcbiAgICBjb25zdCBiaW5JbmRleCA9IGZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignYmluJyArIHBhdGguc2VwKTtcclxuXHJcbiAgICBpZiAoYmluSW5kZXggIT09IC0xKSB7XHJcblxyXG4gICAgICBsb2dEZWJ1ZyhmaWxlUGF0aC5zdWJzdHJpbmcoYmluSW5kZXgpKTtcclxuXHJcbiAgICAgIGFjY3VtLnB1c2goe1xyXG4gICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgIGRlc3RpbmF0aW9uOiBmaWxlUGF0aC5zdWJzdHJpbmcoYmluSW5kZXgpLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBhY2N1bTtcclxuICB9LCBbIG1vZHR5cGVBdHRyIF0pO1xyXG5cclxuICBsb2dEZWJ1ZygnaW5zdGFsbEVuZ2luZUluamVjdG9yIGluc3RydWN0aW9uczonLCBpbnN0cnVjdGlvbnMpO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zdGFsbExTTGliKGZpbGVzOiBzdHJpbmdbXSwgZGVzdGluYXRpb25QYXRoOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XHJcbiAgY29uc3QgZXhlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZS50b0xvd2VyQ2FzZSgpKSA9PT0gJ2RpdmluZS5leGUnKTtcclxuICBjb25zdCBleGVQYXRoID0gcGF0aC5qb2luKGRlc3RpbmF0aW9uUGF0aCwgZXhlKTtcclxuICBsZXQgdmVyOiBzdHJpbmcgPSBhd2FpdCBnZXRWZXJzaW9uKGV4ZVBhdGgpO1xyXG4gIHZlciA9IHZlci5zcGxpdCgnLicpLnNsaWNlKDAsIDMpLmpvaW4oJy4nKTtcclxuXHJcbiAgLy8gVW5mb3J0dW5hdGVseSB0aGUgTFNMaWIgZGV2ZWxvcGVyIGlzIG5vdCBjb25zaXN0ZW50IHdoZW4gY2hhbmdpbmdcclxuICAvLyAgZmlsZSB2ZXJzaW9ucyAtIHRoZSBleGVjdXRhYmxlIGF0dHJpYnV0ZSBtaWdodCBoYXZlIGFuIG9sZGVyIHZlcnNpb25cclxuICAvLyAgdmFsdWUgdGhhbiB0aGUgb25lIHNwZWNpZmllZCBieSB0aGUgZmlsZW5hbWUgLSB3ZSdyZSBnb2luZyB0byB1c2VcclxuICAvLyAgdGhlIGZpbGVuYW1lIGFzIHRoZSBwb2ludCBvZiB0cnV0aCAqdWdoKlxyXG4gIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShkZXN0aW5hdGlvblBhdGgsIHBhdGguZXh0bmFtZShkZXN0aW5hdGlvblBhdGgpKTtcclxuICBjb25zdCBpZHggPSBmaWxlTmFtZS5pbmRleE9mKCctdicpO1xyXG4gIGNvbnN0IGZpbGVOYW1lVmVyID0gZmlsZU5hbWUuc2xpY2UoaWR4ICsgMik7XHJcbiAgaWYgKHNlbXZlci52YWxpZChmaWxlTmFtZVZlcikgJiYgdmVyICE9PSBmaWxlTmFtZVZlcikge1xyXG4gICAgdmVyID0gZmlsZU5hbWVWZXI7XHJcbiAgfVxyXG4gIGNvbnN0IHZlcnNpb25BdHRyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdhdHRyaWJ1dGUnLCBrZXk6ICd2ZXJzaW9uJywgdmFsdWU6IHZlciB9O1xyXG4gIGNvbnN0IG1vZHR5cGVBdHRyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdzZXRtb2R0eXBlJywgdmFsdWU6ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnIH07XHJcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9XHJcbiAgICBmaWxlcy5yZWR1Y2UoKGFjY3VtOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xyXG4gICAgICBpZiAoZmlsZVBhdGgudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIC5zcGxpdChwYXRoLnNlcClcclxuICAgICAgICAuaW5kZXhPZigndG9vbHMnKSAhPT0gLTFcclxuICAgICAgICAmJiAhZmlsZVBhdGguZW5kc1dpdGgocGF0aC5zZXApKSB7XHJcbiAgICAgICAgYWNjdW0ucHVzaCh7XHJcbiAgICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxyXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbigndG9vbHMnLCBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSksXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwgW21vZHR5cGVBdHRyLCB2ZXJzaW9uQXR0cl0pO1xyXG5cclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdEJHM1NFKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcclxuICBcclxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBoYXNEV3JpdGVEbGwgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSAnZHdyaXRlLmRsbCcpICE9PSB1bmRlZmluZWQ7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkOiBoYXNEV3JpdGVEbGwsXHJcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RSZXBsYWNlcihmaWxlczogc3RyaW5nW10sIGdhbWVJZDogc3RyaW5nKTogUHJvbWlzZTx0eXBlcy5JU3VwcG9ydGVkUmVzdWx0PiB7XHJcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xyXG4gIH1cclxuICBjb25zdCBwYWtzID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICcucGFrJyk7XHJcblxyXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgc3VwcG9ydGVkOiBwYWtzLmxlbmd0aCA9PT0gMCxcclxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFJlcGxhY2VyKGZpbGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcclxuICBjb25zdCBkaXJlY3RvcmllcyA9IEFycmF5LmZyb20obmV3IFNldChmaWxlcy5tYXAoZmlsZSA9PiBwYXRoLmRpcm5hbWUoZmlsZSkudG9VcHBlckNhc2UoKSkpKTtcclxuICBsZXQgZGF0YVBhdGg6IHN0cmluZyA9IGRpcmVjdG9yaWVzLmZpbmQoZGlyID0+IHBhdGguYmFzZW5hbWUoZGlyKSA9PT0gJ0RBVEEnKTtcclxuICBpZiAoZGF0YVBhdGggPT09IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc3QgZ2VuT3JQdWJsaWMgPSBkaXJlY3Rvcmllc1xyXG4gICAgICAuZmluZChkaXIgPT4gWydQVUJMSUMnLCAnR0VORVJBVEVEJ10uaW5jbHVkZXMocGF0aC5iYXNlbmFtZShkaXIpKSk7XHJcbiAgICBpZiAoZ2VuT3JQdWJsaWMgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBkYXRhUGF0aCA9IHBhdGguZGlybmFtZShnZW5PclB1YmxpYyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gKGRhdGFQYXRoICE9PSB1bmRlZmluZWQpXHJcbiAgICA/IGZpbGVzLnJlZHVjZSgocHJldjogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcclxuICAgICAgaWYgKGZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSkge1xyXG4gICAgICAgIHJldHVybiBwcmV2O1xyXG4gICAgICB9XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGRhdGFQYXRoLCBmaWxlUGF0aCk7XHJcbiAgICAgIGlmICghcmVsUGF0aC5zdGFydHNXaXRoKCcuLicpKSB7XHJcbiAgICAgICAgcHJldi5wdXNoKHtcclxuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcclxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXHJcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcmVsUGF0aCxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcHJldjtcclxuICAgIH0sIFtdKVxyXG4gICAgOiBmaWxlcy5tYXAoKGZpbGVQYXRoOiBzdHJpbmcpOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPT4gKHtcclxuICAgICAgICB0eXBlOiAnY29weScsXHJcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcclxuICAgICAgICBkZXN0aW5hdGlvbjogZmlsZVBhdGgsXHJcbiAgICAgIH0pKTtcclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICBpbnN0cnVjdGlvbnMsXHJcbiAgfSk7XHJcbn1cclxuXHJcbiJdfQ==