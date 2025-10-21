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
exports.CollectionParseError = exports.CollectionGenerateError = void 0;
exports.isValidMod = isValidMod;
exports.isModInCollection = isModInCollection;
exports.genCollectionLoadOrder = genCollectionLoadOrder;
exports.walkDirPath = walkDirPath;
exports.prepareFileData = prepareFileData;
exports.cleanUpEntries = cleanUpEntries;
exports.restoreFileData = restoreFileData;
exports.hex2Buffer = hex2Buffer;
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
function isModInCollection(collectionMod, mod) {
    if (collectionMod.rules === undefined) {
        return false;
    }
    return collectionMod.rules.find(rule => vortex_api_1.util.testModReference(mod, rule.reference)) !== undefined;
}
function genCollectionLoadOrder(loadOrder, mods, collection) {
    const sortedMods = loadOrder.filter(entry => {
        const isLocked = entry.modId.includes(common_1.LOCKED_PREFIX);
        return isLocked || ((collection !== undefined)
            ? isValidMod(mods[entry.modId]) && (isModInCollection(collection, mods[entry.modId]))
            : isValidMod(mods[entry.modId]));
    })
        .sort((lhs, rhs) => lhs.data.prefix - rhs.data.prefix)
        .reduce((accum, iter, idx) => {
        accum.push(iter);
        return accum;
    }, []);
    return sortedMods;
}
function walkDirPath(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileEntries = [];
        yield (0, turbowalk_1.default)(dirPath, (entries) => {
            fileEntries = fileEntries.concat(entries);
        })
            .catch({ systemCode: 3 }, () => Promise.resolve())
            .catch(err => ['ENOTFOUND', 'ENOENT'].includes(err.code)
            ? Promise.resolve() : Promise.reject(err));
        return fileEntries;
    });
}
function prepareFileData(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const sevenZip = new vortex_api_1.util.SevenZip();
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(common_1.W3_TEMP_DATA_DIR);
            const archivePath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)() + '.zip');
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
function cleanUpEntries(fileEntries) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fileEntries.sort((lhs, rhs) => rhs.filePath.length - lhs.filePath.length);
            for (const entry of fileEntries) {
                yield vortex_api_1.fs.removeAsync(entry.filePath);
            }
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'file entry cleanup failed', err);
        }
    });
}
function restoreFileData(fileData, destination) {
    return __awaiter(this, void 0, void 0, function* () {
        const sevenZip = new vortex_api_1.util.SevenZip();
        let archivePath;
        let fileEntries = [];
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(common_1.W3_TEMP_DATA_DIR);
            archivePath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)() + '.zip');
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
function hex2Buffer(hexData) {
    const byteArray = new Uint8Array(hexData.length / 2);
    for (let x = 0; x < byteArray.length; x++) {
        byteArray[x] = parseInt(hexData.substr(x * 2, 2), 16);
    }
    const buffer = Buffer.from(byteArray);
    return buffer;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBc0JBLGdDQUVDO0FBRUQsOENBT0M7QUFFRCx3REFlQztBQUVELGtDQVVDO0FBRUQsMENBZUM7QUFFRCx3Q0FTQztBQUVELDBDQXVCQztBQUVELGdDQVFDO0FBNUhELGdEQUF3QjtBQUN4QixxQ0FBbUM7QUFDbkMsMERBQThDO0FBQzlDLDJDQUFrRDtBQUVsRCxzQ0FBNEQ7QUFFNUQsTUFBYSx1QkFBd0IsU0FBUSxLQUFLO0lBQ2hELFlBQVksR0FBVztRQUNyQixLQUFLLENBQUMseURBQXlELEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDdEUsSUFBSSxDQUFDLElBQUksR0FBRyx5QkFBeUIsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUFMRCwwREFLQztBQUVELE1BQWEsb0JBQXFCLFNBQVEsS0FBSztJQUM3QyxZQUFZLGNBQXNCLEVBQUUsR0FBVztRQUM3QyxLQUFLLENBQUMscURBQXFELGNBQWMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3JGLElBQUksQ0FBQyxJQUFJLEdBQUcseUJBQXlCLENBQUM7SUFDeEMsQ0FBQztDQUNGO0FBTEQsb0RBS0M7QUFFRCxTQUFnQixVQUFVLENBQUMsR0FBZTtJQUN4QyxPQUFPLENBQUMsR0FBRyxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxZQUFZLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsYUFBeUIsRUFBRSxHQUFlO0lBQzFFLElBQUksYUFBYSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUN0QyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3JDLGlCQUFJLENBQUMsZ0JBQWdCLENB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LENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMxQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN0QyxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIGVzbGludC1kaXNhYmxlICovXHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ3Nob3J0aWQnO1xyXG5pbXBvcnQgdHVyYm93YWxrLCB7IElFbnRyeSB9IGZyb20gJ3R1cmJvd2Fsayc7XHJcbmltcG9ydCB7IGZzLCBsb2csIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XHJcblxyXG5pbXBvcnQgeyBMT0NLRURfUFJFRklYLCBXM19URU1QX0RBVEFfRElSIH0gZnJvbSAnLi4vY29tbW9uJztcclxuXHJcbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uR2VuZXJhdGVFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3Rvcih3aHk6IHN0cmluZykge1xyXG4gICAgc3VwZXIoYEZhaWxlZCB0byBnZW5lcmF0ZSBnYW1lIHNwZWNpZmljIGRhdGEgZm9yIGNvbGxlY3Rpb246ICR7d2h5fWApO1xyXG4gICAgdGhpcy5uYW1lID0gJ0NvbGxlY3Rpb25HZW5lcmF0ZUVycm9yJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uUGFyc2VFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uTmFtZTogc3RyaW5nLCB3aHk6IHN0cmluZykge1xyXG4gICAgc3VwZXIoYEZhaWxlZCB0byBwYXJzZSBnYW1lIHNwZWNpZmljIGRhdGEgZm9yIGNvbGxlY3Rpb24gJHtjb2xsZWN0aW9uTmFtZX06ICR7d2h5fWApO1xyXG4gICAgdGhpcy5uYW1lID0gJ0NvbGxlY3Rpb25HZW5lcmF0ZUVycm9yJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkTW9kKG1vZDogdHlwZXMuSU1vZCkge1xyXG4gIHJldHVybiAobW9kICE9PSB1bmRlZmluZWQpICYmIChtb2QudHlwZSAhPT0gJ2NvbGxlY3Rpb24nKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTW9kSW5Db2xsZWN0aW9uKGNvbGxlY3Rpb25Nb2Q6IHR5cGVzLklNb2QsIG1vZDogdHlwZXMuSU1vZCkge1xyXG4gIGlmIChjb2xsZWN0aW9uTW9kLnJ1bGVzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIHJldHVybiBjb2xsZWN0aW9uTW9kLnJ1bGVzLmZpbmQocnVsZSA9PlxyXG4gICAgdXRpbC50ZXN0TW9kUmVmZXJlbmNlKG1vZCwgcnVsZS5yZWZlcmVuY2UpKSAhPT0gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXI6IHR5cGVzLklGQkxPTG9hZE9yZGVyRW50cnlbXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbj86IHR5cGVzLklNb2QpOiB0eXBlcy5Mb2FkT3JkZXIge1xyXG4gIGNvbnN0IHNvcnRlZE1vZHMgPSBsb2FkT3JkZXIuZmlsdGVyKGVudHJ5ID0+IHtcclxuICAgIGNvbnN0IGlzTG9ja2VkID0gZW50cnkubW9kSWQuaW5jbHVkZXMoTE9DS0VEX1BSRUZJWCk7XHJcbiAgICByZXR1cm4gaXNMb2NrZWQgfHwgKChjb2xsZWN0aW9uICE9PSB1bmRlZmluZWQpXHJcbiAgICAgID8gaXNWYWxpZE1vZChtb2RzW2VudHJ5Lm1vZElkXSkgJiYgKGlzTW9kSW5Db2xsZWN0aW9uKGNvbGxlY3Rpb24sIG1vZHNbZW50cnkubW9kSWRdKSlcclxuICAgICAgOiBpc1ZhbGlkTW9kKG1vZHNbZW50cnkubW9kSWRdKSk7XHJcbiAgfSlcclxuICAgIC5zb3J0KChsaHMsIHJocykgPT4gbGhzLmRhdGEucHJlZml4IC0gcmhzLmRhdGEucHJlZml4KVxyXG4gICAgLnJlZHVjZSgoYWNjdW0sIGl0ZXIsIGlkeCkgPT4ge1xyXG4gICAgICBhY2N1bS5wdXNoKGl0ZXIpO1xyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCBbXSk7XHJcbiAgcmV0dXJuIHNvcnRlZE1vZHM7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3YWxrRGlyUGF0aChkaXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElFbnRyeVtdPiB7XHJcbiAgbGV0IGZpbGVFbnRyaWVzOiBJRW50cnlbXSA9IFtdO1xyXG4gIGF3YWl0IHR1cmJvd2FsayhkaXJQYXRoLCAoZW50cmllczogSUVudHJ5W10pID0+IHtcclxuICAgIGZpbGVFbnRyaWVzID0gZmlsZUVudHJpZXMuY29uY2F0KGVudHJpZXMpO1xyXG4gIH0pXHJcbiAgICAuY2F0Y2goeyBzeXN0ZW1Db2RlOiAzIH0sICgpID0+IFByb21pc2UucmVzb2x2ZSgpKVxyXG4gICAgLmNhdGNoKGVyciA9PiBbJ0VOT1RGT1VORCcsICdFTk9FTlQnXS5pbmNsdWRlcyhlcnIuY29kZSlcclxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICByZXR1cm4gZmlsZUVudHJpZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcmVwYXJlRmlsZURhdGEoZGlyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXI+IHtcclxuICBjb25zdCBzZXZlblppcCA9IG5ldyB1dGlsLlNldmVuWmlwKCk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMoVzNfVEVNUF9EQVRBX0RJUik7XHJcbiAgICBjb25zdCBhcmNoaXZlUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpICsgJy56aXAnKTtcclxuICAgIGNvbnN0IGVudHJpZXM6IHN0cmluZ1tdID0gYXdhaXQgZnMucmVhZGRpckFzeW5jKGRpclBhdGgpO1xyXG4gICAgYXdhaXQgc2V2ZW5aaXAuYWRkKGFyY2hpdmVQYXRoLCBlbnRyaWVzLm1hcChlbnRyeSA9PlxyXG4gICAgICBwYXRoLmpvaW4oZGlyUGF0aCwgZW50cnkpKSwgeyByYXc6IFsnLXInXSB9KTtcclxuXHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhhcmNoaXZlUGF0aCk7XHJcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhhcmNoaXZlUGF0aCk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFuVXBFbnRyaWVzKGZpbGVFbnRyaWVzOiBJRW50cnlbXSkge1xyXG4gIHRyeSB7XHJcbiAgICBmaWxlRW50cmllcy5zb3J0KChsaHMsIHJocykgPT4gcmhzLmZpbGVQYXRoLmxlbmd0aCAtIGxocy5maWxlUGF0aC5sZW5ndGgpO1xyXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWxlRW50cmllcykge1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZpbGUgZW50cnkgY2xlYW51cCBmYWlsZWQnLCBlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3RvcmVGaWxlRGF0YShmaWxlRGF0YTogQnVmZmVyLCBkZXN0aW5hdGlvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3Qgc2V2ZW5aaXAgPSBuZXcgdXRpbC5TZXZlblppcCgpO1xyXG4gIGxldCBhcmNoaXZlUGF0aDtcclxuICBsZXQgZmlsZUVudHJpZXM6IElFbnRyeVtdID0gW107XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMoVzNfVEVNUF9EQVRBX0RJUik7XHJcbiAgICBhcmNoaXZlUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpICsgJy56aXAnKTtcclxuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGFyY2hpdmVQYXRoLCBmaWxlRGF0YSk7XHJcbiAgICBjb25zdCB0YXJnZXREaXJQYXRoID0gcGF0aC5qb2luKFczX1RFTVBfREFUQV9ESVIsIHBhdGguYmFzZW5hbWUoYXJjaGl2ZVBhdGgsICcuemlwJykpO1xyXG4gICAgYXdhaXQgc2V2ZW5aaXAuZXh0cmFjdEZ1bGwoYXJjaGl2ZVBhdGgsIHRhcmdldERpclBhdGgpO1xyXG4gICAgZmlsZUVudHJpZXMgPSBhd2FpdCB3YWxrRGlyUGF0aCh0YXJnZXREaXJQYXRoKTtcclxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZmlsZUVudHJpZXMpIHtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUodGFyZ2V0RGlyUGF0aCwgZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKGRlc3RpbmF0aW9uLCByZWxQYXRoKTtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZGVzdCkpO1xyXG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIGRlc3QpO1xyXG4gICAgfVxyXG4gICAgY2xlYW5VcEVudHJpZXMoZmlsZUVudHJpZXMpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY2xlYW5VcEVudHJpZXMoZmlsZUVudHJpZXMpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGV4MkJ1ZmZlcihoZXhEYXRhOiBzdHJpbmcpIHtcclxuICBjb25zdCBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheShoZXhEYXRhLmxlbmd0aCAvIDIpO1xyXG4gIGZvciAobGV0IHggPSAwOyB4IDwgYnl0ZUFycmF5Lmxlbmd0aDsgeCsrKSB7XHJcbiAgICBieXRlQXJyYXlbeF0gPSBwYXJzZUludChoZXhEYXRhLnN1YnN0cih4ICogMiwgMiksIDE2KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGJ5dGVBcnJheSk7XHJcbiAgcmV0dXJuIGJ1ZmZlcjtcclxufVxyXG4iXX0=