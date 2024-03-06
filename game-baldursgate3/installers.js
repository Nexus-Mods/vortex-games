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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluc3RhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw4REFBcUM7QUFDckMsMkNBQTZCO0FBQzdCLCtDQUFpQztBQUdqQyxxQ0FBZ0Q7QUFDaEQsaUNBQWtDO0FBRWxDLFNBQXNCLFNBQVMsQ0FBQyxLQUFlLEVBQUUsTUFBYzs7UUFDN0QsSUFBSSxNQUFNLEtBQUssZ0JBQU8sRUFBRTtZQUN0QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ2pFO1FBQ0QsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLG9CQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTlGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNyQixTQUFTLEVBQUUsWUFBWSxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQ25DLGFBQWEsRUFBRSxFQUFFO1NBQ2xCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FBQTtBQVZELDhCQVVDO0FBRUQsU0FBc0IsWUFBWSxDQUFDLEtBQWUsRUFBRSxNQUFjOztRQUVoRSxNQUFNLFlBQVksR0FBRyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBRTdELElBQUksTUFBTSxLQUFLLGdCQUFPLEVBQUU7WUFFdEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUks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QztZQUNqRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQTBCLEVBQUUsUUFBZ0IsRUFBRSxFQUFFO2dCQUM5RCxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUMvQixPQUFPLElBQUksQ0FBQztpQkFDYjtnQkFDRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDbEQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQzdCLElBQUksQ0FBQyxJQUFJLENBQUM7d0JBQ1IsSUFBSSxFQUFFLE1BQU07d0JBQ1osTUFBTSxFQUFFLFFBQVE7d0JBQ2hCLFdBQVcsRUFBRSxPQUFPO3FCQUNyQixDQUFDLENBQUM7aUJBQ0o7Z0JBQ0QsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ04sQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFnQixFQUFzQixFQUFFLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxFQUFFLE1BQU07Z0JBQ1osTUFBTSxFQUFFLFFBQVE7Z0JBQ2hCLFdBQVcsRUFBRSxRQUFRO2FBQ3RCLENBQUMsQ0FBQyxDQUFDO1FBRVIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ3JCLFlBQVk7U0FDYixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQUE7QUFuQ0QsMENBbUNDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBnZXRWZXJzaW9uIGZyb20gJ2V4ZS12ZXJzaW9uJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IExTTElCX0ZJTEVTLCBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgbG9nRGVidWcgfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdExTTGliKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbiAgfVxuICBjb25zdCBtYXRjaGVkRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBMU0xJQl9GSUxFUy5oYXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKSk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkOiBtYXRjaGVkRmlsZXMubGVuZ3RoID49IDIsXG4gICAgcmVxdWlyZWRGaWxlczogW10sXG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdE1vZEZpeGVyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcblxuICBjb25zdCBub3RTdXBwb3J0ZWQgPSB7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH07XG5cbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIC8vIGRpZmZlcmVudCBnYW1lLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcbiAgfVxuXG4gIGNvbnN0IGxvd2VyZWQgPSBmaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkpO1xuICAvL2NvbnN0IGJpbkZvbGRlciA9IGxvd2VyZWQuZmluZChmaWxlID0+IGZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ2JpbicpICE9PSAtMSk7XG5cbiAgY29uc3QgaGFzTW9kRml4ZXJQYWsgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSAnbW9kZml4ZXIucGFrJykgIT09IHVuZGVmaW5lZDtcblxuICBpZiAoIWhhc01vZEZpeGVyUGFrKSB7XG4gICAgLy8gdGhlcmUncyBubyBtb2RmaXhlci5wYWsgZm9sZGVyLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcbiAgfVxuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgc3VwcG9ydGVkOiB0cnVlLFxuICAgICAgcmVxdWlyZWRGaWxlczogW11cbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0RW5naW5lSW5qZWN0b3IoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xuXG4gIGNvbnN0IG5vdFN1cHBvcnRlZCA9IHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfTtcblxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgLy8gZGlmZmVyZW50IGdhbWUuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xuICB9XG5cbiAgY29uc3QgbG93ZXJlZCA9IGZpbGVzLm1hcChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKSk7XG4gIC8vY29uc3QgYmluRm9sZGVyID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignYmluJykgIT09IC0xKTtcblxuICBjb25zdCBoYXNCaW5Gb2xkZXIgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLmluZGV4T2YoJ2JpbicgKyBwYXRoLnNlcCkgIT09IC0xKSAhPT0gdW5kZWZpbmVkO1xuXG4gIGlmICghaGFzQmluRm9sZGVyKSB7XG4gICAgLy8gdGhlcmUncyBubyBiaW4gZm9sZGVyLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcbiAgfVxuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgc3VwcG9ydGVkOiB0cnVlLFxuICAgICAgcmVxdWlyZWRGaWxlczogW11cbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsQkczU0UoZmlsZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xuICBcbiAgbG9nRGVidWcoJ2luc3RhbGxCRzNTRSBmaWxlczonLCBmaWxlcyk7XG5cbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXG4gIGZpbGVzID0gZmlsZXMuZmlsdGVyKGYgPT4gcGF0aC5leHRuYW1lKGYpICE9PSAnJyAmJiAhZi5lbmRzV2l0aChwYXRoLnNlcCkpO1xuXG4gIC8vIEZpbHRlciBvbmx5IGRsbCBmaWxlcy5cbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgPT09ICcuZGxsJyk7XG5cbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbGVzLnJlZHVjZSgoYWNjdW06IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7ICAgIFxuICAgICAgYWNjdW0ucHVzaCh7XG4gICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcbiAgICAgICAgZGVzdGluYXRpb246IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLFxuICAgICAgfSk7ICAgIFxuICAgIHJldHVybiBhY2N1bTtcbiAgfSwgW10pO1xuXG4gIGxvZ0RlYnVnKCdpbnN0YWxsQkczU0UgaW5zdHJ1Y3Rpb25zOicsIGluc3RydWN0aW9ucyk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn0gXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsTW9kRml4ZXIoZmlsZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xuICBcbiAgbG9nRGVidWcoJ2luc3RhbGxNb2RGaXhlciBmaWxlczonLCBmaWxlcyk7XG5cbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXG4gIGZpbGVzID0gZmlsZXMuZmlsdGVyKGYgPT4gcGF0aC5leHRuYW1lKGYpICE9PSAnJyAmJiAhZi5lbmRzV2l0aChwYXRoLnNlcCkpO1xuXG4gIC8vIEZpbHRlciBvbmx5IHBhayBmaWxlcy5cbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgPT09ICcucGFrJyk7XG5cbiAgY29uc3QgbW9kRml4ZXJBdHRyaWJ1dGU6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ2F0dHJpYnV0ZScsIGtleTogJ21vZEZpeGVyJywgdmFsdWU6IHRydWUgfVxuXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWxlcy5yZWR1Y2UoKGFjY3VtOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4geyAgICBcbiAgICAgIGFjY3VtLnB1c2goe1xuICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSxcbiAgICAgIH0pOyAgICBcbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIFsgbW9kRml4ZXJBdHRyaWJ1dGUgXSk7XG5cbiAgbG9nRGVidWcoJ2luc3RhbGxNb2RGaXhlciBpbnN0cnVjdGlvbnM6JywgaW5zdHJ1Y3Rpb25zKTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xufSBcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGxFbmdpbmVJbmplY3RvcihmaWxlczogc3RyaW5nW10pOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIFxuICBsb2dEZWJ1ZygnaW5zdGFsbEVuZ2luZUluamVjdG9yIGZpbGVzOicsIGZpbGVzKTtcblxuICAvLyBGaWx0ZXIgb3V0IGZvbGRlcnMgYXMgdGhpcyBicmVha3MgdGhlIGluc3RhbGxlci5cbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgIT09ICcnICYmICFmLmVuZHNXaXRoKHBhdGguc2VwKSk7XG5cbiAgY29uc3QgbW9kdHlwZUF0dHI6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ3NldG1vZHR5cGUnLCB2YWx1ZTogJ2RpbnB1dCcgfSBcblxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gZmlsZXMucmVkdWNlKChhY2N1bTogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICBcbiAgICAvLyBzZWUgaWYgd2UgaGF2ZSBhIGJpbiBmb2xkZXJcbiAgICAvLyB0aGVuIHdlIG5lZWQgdG8gdXNlIHRoYXQgYXMgYSBuZXcgcm9vdCBpbmNhc2UgdGhlIC9iaW4gaXMgbmVzdGVkXG5cbiAgICBjb25zdCBiaW5JbmRleCA9IGZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignYmluJyArIHBhdGguc2VwKTtcblxuICAgIGlmIChiaW5JbmRleCAhPT0gLTEpIHtcblxuICAgICAgbG9nRGVidWcoZmlsZVBhdGguc3Vic3RyaW5nKGJpbkluZGV4KSk7XG5cbiAgICAgIGFjY3VtLnB1c2goe1xuICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgIGRlc3RpbmF0aW9uOiBmaWxlUGF0aC5zdWJzdHJpbmcoYmluSW5kZXgpLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBhY2N1bTtcbiAgfSwgWyBtb2R0eXBlQXR0ciBdKTtcblxuICBsb2dEZWJ1ZygnaW5zdGFsbEVuZ2luZUluamVjdG9yIGluc3RydWN0aW9uczonLCBpbnN0cnVjdGlvbnMpO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsTFNMaWIoZmlsZXM6IHN0cmluZ1tdLCBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcbiAgY29uc3QgZXhlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZS50b0xvd2VyQ2FzZSgpKSA9PT0gJ2RpdmluZS5leGUnKTtcbiAgY29uc3QgZXhlUGF0aCA9IHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIGV4ZSk7XG4gIGxldCB2ZXI6IHN0cmluZyA9IGF3YWl0IGdldFZlcnNpb24oZXhlUGF0aCk7XG4gIHZlciA9IHZlci5zcGxpdCgnLicpLnNsaWNlKDAsIDMpLmpvaW4oJy4nKTtcblxuICAvLyBVbmZvcnR1bmF0ZWx5IHRoZSBMU0xpYiBkZXZlbG9wZXIgaXMgbm90IGNvbnNpc3RlbnQgd2hlbiBjaGFuZ2luZ1xuICAvLyAgZmlsZSB2ZXJzaW9ucyAtIHRoZSBleGVjdXRhYmxlIGF0dHJpYnV0ZSBtaWdodCBoYXZlIGFuIG9sZGVyIHZlcnNpb25cbiAgLy8gIHZhbHVlIHRoYW4gdGhlIG9uZSBzcGVjaWZpZWQgYnkgdGhlIGZpbGVuYW1lIC0gd2UncmUgZ29pbmcgdG8gdXNlXG4gIC8vICB0aGUgZmlsZW5hbWUgYXMgdGhlIHBvaW50IG9mIHRydXRoICp1Z2gqXG4gIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShkZXN0aW5hdGlvblBhdGgsIHBhdGguZXh0bmFtZShkZXN0aW5hdGlvblBhdGgpKTtcbiAgY29uc3QgaWR4ID0gZmlsZU5hbWUuaW5kZXhPZignLXYnKTtcbiAgY29uc3QgZmlsZU5hbWVWZXIgPSBmaWxlTmFtZS5zbGljZShpZHggKyAyKTtcbiAgaWYgKHNlbXZlci52YWxpZChmaWxlTmFtZVZlcikgJiYgdmVyICE9PSBmaWxlTmFtZVZlcikge1xuICAgIHZlciA9IGZpbGVOYW1lVmVyO1xuICB9XG4gIGNvbnN0IHZlcnNpb25BdHRyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdhdHRyaWJ1dGUnLCBrZXk6ICd2ZXJzaW9uJywgdmFsdWU6IHZlciB9O1xuICBjb25zdCBtb2R0eXBlQXR0cjogdHlwZXMuSUluc3RydWN0aW9uID0geyB0eXBlOiAnc2V0bW9kdHlwZScsIHZhbHVlOiAnYmczLWxzbGliLWRpdmluZS10b29sJyB9O1xuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID1cbiAgICBmaWxlcy5yZWR1Y2UoKGFjY3VtOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKGZpbGVQYXRoLnRvTG93ZXJDYXNlKClcbiAgICAgICAgLnNwbGl0KHBhdGguc2VwKVxuICAgICAgICAuaW5kZXhPZigndG9vbHMnKSAhPT0gLTFcbiAgICAgICAgJiYgIWZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSkge1xuICAgICAgICBhY2N1bS5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKCd0b29scycsIHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfSwgW21vZHR5cGVBdHRyLCB2ZXJzaW9uQXR0cl0pO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0QkczU0UoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xuICBcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbiAgfVxuXG4gIGNvbnN0IGhhc0RXcml0ZURsbCA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICdkd3JpdGUuZGxsJykgIT09IHVuZGVmaW5lZDtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICBzdXBwb3J0ZWQ6IGhhc0RXcml0ZURsbCxcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0UmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xuICB9XG4gIGNvbnN0IHBha3MgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gJy5wYWsnKTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICBzdXBwb3J0ZWQ6IHBha3MubGVuZ3RoID09PSAwLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGxSZXBsYWNlcihmaWxlczogc3RyaW5nW10pOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIGNvbnN0IGRpcmVjdG9yaWVzID0gQXJyYXkuZnJvbShuZXcgU2V0KGZpbGVzLm1hcChmaWxlID0+IHBhdGguZGlybmFtZShmaWxlKS50b1VwcGVyQ2FzZSgpKSkpO1xuICBsZXQgZGF0YVBhdGg6IHN0cmluZyA9IGRpcmVjdG9yaWVzLmZpbmQoZGlyID0+IHBhdGguYmFzZW5hbWUoZGlyKSA9PT0gJ0RBVEEnKTtcbiAgaWYgKGRhdGFQYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICBjb25zdCBnZW5PclB1YmxpYyA9IGRpcmVjdG9yaWVzXG4gICAgICAuZmluZChkaXIgPT4gWydQVUJMSUMnLCAnR0VORVJBVEVEJ10uaW5jbHVkZXMocGF0aC5iYXNlbmFtZShkaXIpKSk7XG4gICAgaWYgKGdlbk9yUHVibGljICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGRhdGFQYXRoID0gcGF0aC5kaXJuYW1lKGdlbk9yUHVibGljKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gKGRhdGFQYXRoICE9PSB1bmRlZmluZWQpXG4gICAgPyBmaWxlcy5yZWR1Y2UoKHByZXY6IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoZmlsZVBhdGguZW5kc1dpdGgocGF0aC5zZXApKSB7XG4gICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgfVxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUoZGF0YVBhdGgsIGZpbGVQYXRoKTtcbiAgICAgIGlmICghcmVsUGF0aC5zdGFydHNXaXRoKCcuLicpKSB7XG4gICAgICAgIHByZXYucHVzaCh7XG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgZGVzdGluYXRpb246IHJlbFBhdGgsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHByZXY7XG4gICAgfSwgW10pXG4gICAgOiBmaWxlcy5tYXAoKGZpbGVQYXRoOiBzdHJpbmcpOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPT4gKHtcbiAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxuICAgICAgICBkZXN0aW5hdGlvbjogZmlsZVBhdGgsXG4gICAgICB9KSk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgaW5zdHJ1Y3Rpb25zLFxuICB9KTtcbn1cblxuIl19