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
exports.hex2Buffer = exports.restoreFileData = exports.cleanUpEntries = exports.prepareFileData = exports.walkDirPath = exports.genCollectionLoadOrder = exports.isModInCollection = exports.isValidMod = exports.CollectionParseError = exports.CollectionGenerateError = void 0;
const path_1 = __importDefault(require("path"));
const shortid_1 = require("shortid");
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("../common");
class CollectionGenerateError extends Error {
    constructor(why) {
        super(`Failed to generate game specific data for collection: ${why}`);
        this.name = 'CollectionGenerateError';
    }
}
exports.CollectionGenerateError = CollectionGenerateError;
class CollectionParseError extends Error {
    constructor(collectionName, why) {
        super(`Failed to parse game specific data for collection ${collectionName}: ${why}`);
        this.name = 'CollectionGenerateError';
    }
}
exports.CollectionParseError = CollectionParseError;
function isValidMod(mod) {
    return (mod !== undefined) && (mod.type !== 'collection');
}
exports.isValidMod = isValidMod;
function isModInCollection(collectionMod, mod) {
    if (collectionMod.rules === undefined) {
        return false;
    }
    return collectionMod.rules.find(rule => vortex_api_1.util.testModReference(mod, rule.reference)) !== undefined;
}
exports.isModInCollection = isModInCollection;
function genCollectionLoadOrder(loadOrder, mods, collection) {
    const sortedMods = Object.keys(loadOrder)
        .filter(id => {
        const isLocked = id.toLowerCase().includes(common_1.LOCKED_PREFIX);
        return isLocked || ((collection !== undefined)
            ? isValidMod(mods[id]) && (isModInCollection(collection, mods[id]))
            : isValidMod(mods[id]));
    })
        .sort((lhs, rhs) => loadOrder[lhs].pos - loadOrder[rhs].pos)
        .reduce((accum, iter, idx) => {
        accum[iter] = Object.assign(Object.assign({}, loadOrder[iter]), { pos: idx });
        return accum;
    }, {});
    return sortedMods;
}
exports.genCollectionLoadOrder = genCollectionLoadOrder;
function walkDirPath(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileEntries = [];
        yield turbowalk_1.default(dirPath, (entries) => {
            fileEntries = fileEntries.concat(entries);
        })
            .catch({ systemCode: 3 }, () => Promise.resolve())
            .catch(err => ['ENOTFOUND', 'ENOENT'].includes(err.code)
            ? Promise.resolve() : Promise.reject(err));
        return fileEntries;
    });
}
exports.walkDirPath = walkDirPath;
function prepareFileData(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const sevenZip = new vortex_api_1.util.SevenZip();
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(common_1.W3_TEMP_DATA_DIR);
            const archivePath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, shortid_1.generate() + '.zip');
            const entries = yield vortex_api_1.fs.readdirAsync(dirPath);
            yield sevenZip.add(archivePath, entries.map(entry => path_1.default.join(dirPath, entry)), { raw: ['-r'] });
            const data = yield vortex_api_1.fs.readFileAsync(archivePath);
            yield vortex_api_1.fs.removeAsync(archivePath);
            return data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.prepareFileData = prepareFileData;
function cleanUpEntries(fileEntries) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fileEntries.sort((lhs, rhs) => rhs.filePath.length - lhs.filePath.length);
            for (const entry of fileEntries) {
                yield vortex_api_1.fs.removeAsync(entry.filePath);
            }
        }
        catch (err) {
            vortex_api_1.log('error', 'file entry cleanup failed', err);
        }
    });
}
exports.cleanUpEntries = cleanUpEntries;
function restoreFileData(fileData, destination) {
    return __awaiter(this, void 0, void 0, function* () {
        const sevenZip = new vortex_api_1.util.SevenZip();
        let archivePath;
        let fileEntries = [];
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(common_1.W3_TEMP_DATA_DIR);
            archivePath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, shortid_1.generate() + '.zip');
            yield vortex_api_1.fs.writeFileAsync(archivePath, fileData);
            const targetDirPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, path_1.default.basename(archivePath, '.zip'));
            yield sevenZip.extractFull(archivePath, targetDirPath);
            fileEntries = yield walkDirPath(targetDirPath);
            for (const entry of fileEntries) {
                const relPath = path_1.default.relative(targetDirPath, entry.filePath);
                const dest = path_1.default.join(destination, relPath);
                yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(dest));
                yield vortex_api_1.fs.copyAsync(entry.filePath, dest);
            }
            cleanUpEntries(fileEntries);
            return Promise.resolve();
        }
        catch (err) {
            cleanUpEntries(fileEntries);
            return Promise.reject(err);
        }
    });
}
exports.restoreFileData = restoreFileData;
function hex2Buffer(hexData) {
    const byteArray = new Uint8Array(hexData.length / 2);
    for (let x = 0; x < byteArray.length; x++) {
        byteArray[x] = parseInt(hexData.substr(x * 2, 2), 16);
    }
    const buffer = Buffer.from(byteArray);
    return buffer;
}
exports.hex2Buffer = hex2Buffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLHFDQUFtQztBQUNuQywwREFBOEM7QUFDOUMsMkNBQWtEO0FBR2xELHNDQUE0RDtBQUU1RCxNQUFhLHVCQUF3QixTQUFRLEtBQUs7SUFDaEQsWUFBWSxHQUFXO1FBQ3JCLEtBQUssQ0FBQyx5REFBeUQsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsSUFBSSxHQUFHLHlCQUF5QixDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQUxELDBEQUtDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxLQUFLO0lBQzdDLFlBQVksY0FBc0IsRUFBRSxHQUFXO1FBQzdDLEtBQUssQ0FBQyxxREFBcUQsY0FBYyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDckYsSUFBSSxDQUFDLElBQUksR0FBRyx5QkFBeUIsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUFMRCxvREFLQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxHQUFlO0lBQ3hDLE9BQU8sQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFGRCxnQ0FFQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLGFBQXlCLEVBQUUsR0FBZTtJQUMxRSxJQUFJLGFBQWEsQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3JDLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3JDLGlCQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztBQUM5RCxDQUFDO0FBUEQsOENBT0M7QUFFRCxTQUFnQixzQkFB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ekMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDdkQ7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3RDLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFSRCxnQ0FRQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ3Nob3J0aWQnO1xyXG5pbXBvcnQgdHVyYm93YWxrLCB7IElFbnRyeSB9IGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGZzLCBsb2csIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcbmltcG9ydCB7IElMb2FkT3JkZXIsIElMb2FkT3JkZXJFbnRyeSB9IGZyb20gJy4vdHlwZXMnO1xyXG5cclxuaW1wb3J0IHsgTE9DS0VEX1BSRUZJWCwgVzNfVEVNUF9EQVRBX0RJUiB9IGZyb20gJy4uL2NvbW1vbic7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbkdlbmVyYXRlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcbiAgY29uc3RydWN0b3Iod2h5OiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKGBGYWlsZWQgdG8gZ2VuZXJhdGUgZ2FtZSBzcGVjaWZpYyBkYXRhIGZvciBjb2xsZWN0aW9uOiAke3doeX1gKTtcclxuICAgIHRoaXMubmFtZSA9ICdDb2xsZWN0aW9uR2VuZXJhdGVFcnJvcic7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvblBhcnNlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcbiAgY29uc3RydWN0b3IoY29sbGVjdGlvbk5hbWU6IHN0cmluZywgd2h5OiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKGBGYWlsZWQgdG8gcGFyc2UgZ2FtZSBzcGVjaWZpYyBkYXRhIGZvciBjb2xsZWN0aW9uICR7Y29sbGVjdGlvbk5hbWV9OiAke3doeX1gKTtcclxuICAgIHRoaXMubmFtZSA9ICdDb2xsZWN0aW9uR2VuZXJhdGVFcnJvcic7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZE1vZChtb2Q6IHR5cGVzLklNb2QpIHtcclxuICByZXR1cm4gKG1vZCAhPT0gdW5kZWZpbmVkKSAmJiAobW9kLnR5cGUgIT09ICdjb2xsZWN0aW9uJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc01vZEluQ29sbGVjdGlvbihjb2xsZWN0aW9uTW9kOiB0eXBlcy5JTW9kLCBtb2Q6IHR5cGVzLklNb2QpIHtcclxuICBpZiAoY29sbGVjdGlvbk1vZC5ydWxlcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY29sbGVjdGlvbk1vZC5ydWxlcy5maW5kKHJ1bGUgPT5cclxuICAgIHV0aWwudGVzdE1vZFJlZmVyZW5jZShtb2QsIHJ1bGUucmVmZXJlbmNlKSkgIT09IHVuZGVmaW5lZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyOiB7IFttb2RJZDogc3RyaW5nXTogSUxvYWRPcmRlckVudHJ5IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24/OiB0eXBlcy5JTW9kKTogSUxvYWRPcmRlciB7XHJcbiAgY29uc3Qgc29ydGVkTW9kcyA9IE9iamVjdC5rZXlzKGxvYWRPcmRlcilcclxuICAgIC5maWx0ZXIoaWQgPT4ge1xyXG4gICAgICBjb25zdCBpc0xvY2tlZCA9IGlkLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoTE9DS0VEX1BSRUZJWCk7XHJcbiAgICAgIHJldHVybiBpc0xvY2tlZCB8fCAoKGNvbGxlY3Rpb24gIT09IHVuZGVmaW5lZClcclxuICAgICAgICA/IGlzVmFsaWRNb2QobW9kc1tpZF0pICYmIChpc01vZEluQ29sbGVjdGlvbihjb2xsZWN0aW9uLCBtb2RzW2lkXSkpXHJcbiAgICAgICAgOiBpc1ZhbGlkTW9kKG1vZHNbaWRdKSk7XHJcbiAgICB9KVxyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBsb2FkT3JkZXJbbGhzXS5wb3MgLSBsb2FkT3JkZXJbcmhzXS5wb3MpXHJcbiAgICAucmVkdWNlKChhY2N1bSwgaXRlciwgaWR4KSA9PiB7XHJcbiAgICAgIGFjY3VtW2l0ZXJdID0ge1xyXG4gICAgICAgIC4uLmxvYWRPcmRlcltpdGVyXSxcclxuICAgICAgICBwb3M6IGlkeCxcclxuICAgICAgfTtcclxuICAgICAgcmV0dXJuIGFjY3VtO1xyXG4gICAgfSwge30pO1xyXG4gIHJldHVybiBzb3J0ZWRNb2RzO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2Fsa0RpclBhdGgoZGlyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxJRW50cnlbXT4ge1xyXG4gIGxldCBmaWxlRW50cmllczogSUVudHJ5W10gPSBbXTtcclxuICBhd2FpdCB0dXJib3dhbGsoZGlyUGF0aCwgKGVudHJpZXM6IElFbnRyeVtdKSA9PiB7XHJcbiAgICBmaWxlRW50cmllcyA9IGZpbGVFbnRyaWVzLmNvbmNhdChlbnRyaWVzKTtcclxuICB9KVxyXG4gIC5jYXRjaCh7IHN5c3RlbUNvZGU6IDMgfSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpXHJcbiAgLmNhdGNoKGVyciA9PiBbJ0VOT1RGT1VORCcsICdFTk9FTlQnXS5pbmNsdWRlcyhlcnIuY29kZSlcclxuICAgID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKTtcclxuXHJcbiAgcmV0dXJuIGZpbGVFbnRyaWVzO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZpbGVEYXRhKGRpclBhdGg6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyPiB7XHJcbiAgY29uc3Qgc2V2ZW5aaXAgPSBuZXcgdXRpbC5TZXZlblppcCgpO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKFczX1RFTVBfREFUQV9ESVIpO1xyXG4gICAgY29uc3QgYXJjaGl2ZVBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgZ2VuZXJhdGUoKSArICcuemlwJyk7XHJcbiAgICBjb25zdCBlbnRyaWVzOiBzdHJpbmdbXSA9IGF3YWl0IGZzLnJlYWRkaXJBc3luYyhkaXJQYXRoKTtcclxuICAgIGF3YWl0IHNldmVuWmlwLmFkZChhcmNoaXZlUGF0aCwgZW50cmllcy5tYXAoZW50cnkgPT5cclxuICAgICAgcGF0aC5qb2luKGRpclBhdGgsIGVudHJ5KSksIHsgcmF3OiBbJy1yJ10gfSk7XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoYXJjaGl2ZVBhdGgpO1xyXG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoYXJjaGl2ZVBhdGgpO1xyXG4gICAgcmV0dXJuIGRhdGE7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhblVwRW50cmllcyhmaWxlRW50cmllczogSUVudHJ5W10pIHtcclxuICB0cnkge1xyXG4gICAgZmlsZUVudHJpZXMuc29ydCgobGhzLCByaHMpID0+IHJocy5maWxlUGF0aC5sZW5ndGggLSBsaHMuZmlsZVBhdGgubGVuZ3RoKTtcclxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZmlsZUVudHJpZXMpIHtcclxuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgbG9nKCdlcnJvcicsICdmaWxlIGVudHJ5IGNsZWFudXAgZmFpbGVkJywgZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXN0b3JlRmlsZURhdGEoZmlsZURhdGE6IEJ1ZmZlciwgZGVzdGluYXRpb246IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IHNldmVuWmlwID0gbmV3IHV0aWwuU2V2ZW5aaXAoKTtcclxuICBsZXQgYXJjaGl2ZVBhdGg7XHJcbiAgbGV0IGZpbGVFbnRyaWVzOiBJRW50cnlbXSA9IFtdO1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKFczX1RFTVBfREFUQV9ESVIpO1xyXG4gICAgYXJjaGl2ZVBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgZ2VuZXJhdGUoKSArICcuemlwJyk7XHJcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhhcmNoaXZlUGF0aCwgZmlsZURhdGEpO1xyXG4gICAgY29uc3QgdGFyZ2V0RGlyUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBwYXRoLmJhc2VuYW1lKGFyY2hpdmVQYXRoLCAnLnppcCcpKTtcclxuICAgIGF3YWl0IHNldmVuWmlwLmV4dHJhY3RGdWxsKGFyY2hpdmVQYXRoLCB0YXJnZXREaXJQYXRoKTtcclxuICAgIGZpbGVFbnRyaWVzID0gYXdhaXQgd2Fsa0RpclBhdGgodGFyZ2V0RGlyUGF0aCk7XHJcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGZpbGVFbnRyaWVzKSB7XHJcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKHRhcmdldERpclBhdGgsIGVudHJ5LmZpbGVQYXRoKTtcclxuICAgICAgY29uc3QgZGVzdCA9IHBhdGguam9pbihkZXN0aW5hdGlvbiwgcmVsUGF0aCk7XHJcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGRlc3QpKTtcclxuICAgICAgYXdhaXQgZnMuY29weUFzeW5jKGVudHJ5LmZpbGVQYXRoLCBkZXN0KTtcclxuICAgIH1cclxuICAgIGNsZWFuVXBFbnRyaWVzKGZpbGVFbnRyaWVzKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNsZWFuVXBFbnRyaWVzKGZpbGVFbnRyaWVzKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGhleDJCdWZmZXIoaGV4RGF0YTogc3RyaW5nKSB7XHJcbiAgY29uc3QgYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoaGV4RGF0YS5sZW5ndGggLyAyKTtcclxuICBmb3IgKGxldCB4ID0gMDsgeCA8IGJ5dGVBcnJheS5sZW5ndGg7IHgrKykge1xyXG4gICAgYnl0ZUFycmF5W3hdID0gcGFyc2VJbnQoaGV4RGF0YS5zdWJzdHIoeCAqIDIsIDIpLCAxNik7XHJcbiAgfVxyXG5cclxuICBjb25zdCBidWZmZXIgPSBCdWZmZXIuZnJvbShieXRlQXJyYXkpO1xyXG4gIHJldHVybiBidWZmZXI7XHJcbn1cclxuIl19