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
        yield (0, turbowalk_1.default)(dirPath, (entries) => {
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
            (0, vortex_api_1.log)('error', 'file entry cleanup failed', err);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLHFDQUFtQztBQUNuQywwREFBOEM7QUFDOUMsMkNBQWtEO0FBR2xELHNDQUE0RDtBQUU1RCxNQUFhLHVCQUF3QixTQUFRLEtBQUs7SUFDaEQsWUFBWSxHQUFXO1FBQ3JCLEtBQUssQ0FBQyx5REFBeUQsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsSUFBSSxHQUFHLHlCQUF5QixDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQUxELDBEQUtDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxLQUFLO0lBQzdDLFlBQVksY0FBc0IsRUFBRSxHQUFXO1FBQzdDLEtBQUssQ0FBQyxxREFBcUQsY0FBYyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDckYsSUFBSSxDQUFDLElBQUksR0FBRyx5QkFBeUIsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUFMRCxvREFLQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxHQUFlO0lBQ3hDLE9BQU8sQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFGRCxnQ0FFQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLGFBQXlCLEVBQUUsR0FBZTtJQUMxRSxJQUFJLGFBQWEsQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3JDLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3JDLGlCQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztBQUM5RCxDQUFDO0FBUEQsOENBT0M7QUFFRCxTQUFnQixzQkFB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RSxDQUFDLEVBQUUsRUFBRTtRQUN6QyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUN2RDtJQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEMsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQVJELGdDQVFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGdlbmVyYXRlIH0gZnJvbSAnc2hvcnRpZCc7XHJcbmltcG9ydCB0dXJib3dhbGssIHsgSUVudHJ5IH0gZnJvbSAndHVyYm93YWxrJztcclxuaW1wb3J0IHsgZnMsIGxvZywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgSUxvYWRPcmRlciwgSUxvYWRPcmRlckVudHJ5IH0gZnJvbSAnLi90eXBlcyc7XHJcblxyXG5pbXBvcnQgeyBMT0NLRURfUFJFRklYLCBXM19URU1QX0RBVEFfRElSIH0gZnJvbSAnLi4vY29tbW9uJztcclxuXHJcbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uR2VuZXJhdGVFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3Rvcih3aHk6IHN0cmluZykge1xyXG4gICAgc3VwZXIoYEZhaWxlZCB0byBnZW5lcmF0ZSBnYW1lIHNwZWNpZmljIGRhdGEgZm9yIGNvbGxlY3Rpb246ICR7d2h5fWApO1xyXG4gICAgdGhpcy5uYW1lID0gJ0NvbGxlY3Rpb25HZW5lcmF0ZUVycm9yJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uUGFyc2VFcnJvciBleHRlbmRzIEVycm9yIHtcclxuICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uTmFtZTogc3RyaW5nLCB3aHk6IHN0cmluZykge1xyXG4gICAgc3VwZXIoYEZhaWxlZCB0byBwYXJzZSBnYW1lIHNwZWNpZmljIGRhdGEgZm9yIGNvbGxlY3Rpb24gJHtjb2xsZWN0aW9uTmFtZX06ICR7d2h5fWApO1xyXG4gICAgdGhpcy5uYW1lID0gJ0NvbGxlY3Rpb25HZW5lcmF0ZUVycm9yJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkTW9kKG1vZDogdHlwZXMuSU1vZCkge1xyXG4gIHJldHVybiAobW9kICE9PSB1bmRlZmluZWQpICYmIChtb2QudHlwZSAhPT0gJ2NvbGxlY3Rpb24nKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGlzTW9kSW5Db2xsZWN0aW9uKGNvbGxlY3Rpb25Nb2Q6IHR5cGVzLklNb2QsIG1vZDogdHlwZXMuSU1vZCkge1xyXG4gIGlmIChjb2xsZWN0aW9uTW9kLnJ1bGVzID09PSB1bmRlZmluZWQpIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIHJldHVybiBjb2xsZWN0aW9uTW9kLnJ1bGVzLmZpbmQocnVsZSA9PlxyXG4gICAgdXRpbC50ZXN0TW9kUmVmZXJlbmNlKG1vZCwgcnVsZS5yZWZlcmVuY2UpKSAhPT0gdW5kZWZpbmVkO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXI6IHsgW21vZElkOiBzdHJpbmddOiBJTG9hZE9yZGVyRW50cnkgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbj86IHR5cGVzLklNb2QpOiBJTG9hZE9yZGVyIHtcclxuICBjb25zdCBzb3J0ZWRNb2RzID0gT2JqZWN0LmtleXMobG9hZE9yZGVyKVxyXG4gICAgLmZpbHRlcihpZCA9PiB7XHJcbiAgICAgIGNvbnN0IGlzTG9ja2VkID0gaWQudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhMT0NLRURfUFJFRklYKTtcclxuICAgICAgcmV0dXJuIGlzTG9ja2VkIHx8ICgoY29sbGVjdGlvbiAhPT0gdW5kZWZpbmVkKVxyXG4gICAgICAgID8gaXNWYWxpZE1vZChtb2RzW2lkXSkgJiYgKGlzTW9kSW5Db2xsZWN0aW9uKGNvbGxlY3Rpb24sIG1vZHNbaWRdKSlcclxuICAgICAgICA6IGlzVmFsaWRNb2QobW9kc1tpZF0pKTtcclxuICAgIH0pXHJcbiAgICAuc29ydCgobGhzLCByaHMpID0+IGxvYWRPcmRlcltsaHNdLnBvcyAtIGxvYWRPcmRlcltyaHNdLnBvcylcclxuICAgIC5yZWR1Y2UoKGFjY3VtLCBpdGVyLCBpZHgpID0+IHtcclxuICAgICAgYWNjdW1baXRlcl0gPSB7XHJcbiAgICAgICAgLi4ubG9hZE9yZGVyW2l0ZXJdLFxyXG4gICAgICAgIHBvczogaWR4LFxyXG4gICAgICB9O1xyXG4gICAgICByZXR1cm4gYWNjdW07XHJcbiAgICB9LCB7fSk7XHJcbiAgcmV0dXJuIHNvcnRlZE1vZHM7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3YWxrRGlyUGF0aChkaXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPElFbnRyeVtdPiB7XHJcbiAgbGV0IGZpbGVFbnRyaWVzOiBJRW50cnlbXSA9IFtdO1xyXG4gIGF3YWl0IHR1cmJvd2FsayhkaXJQYXRoLCAoZW50cmllczogSUVudHJ5W10pID0+IHtcclxuICAgIGZpbGVFbnRyaWVzID0gZmlsZUVudHJpZXMuY29uY2F0KGVudHJpZXMpO1xyXG4gIH0pXHJcbiAgLmNhdGNoKHsgc3lzdGVtQ29kZTogMyB9LCAoKSA9PiBQcm9taXNlLnJlc29sdmUoKSlcclxuICAuY2F0Y2goZXJyID0+IFsnRU5PVEZPVU5EJywgJ0VOT0VOVCddLmluY2x1ZGVzKGVyci5jb2RlKVxyXG4gICAgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpO1xyXG5cclxuICByZXR1cm4gZmlsZUVudHJpZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcmVwYXJlRmlsZURhdGEoZGlyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxCdWZmZXI+IHtcclxuICBjb25zdCBzZXZlblppcCA9IG5ldyB1dGlsLlNldmVuWmlwKCk7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMoVzNfVEVNUF9EQVRBX0RJUik7XHJcbiAgICBjb25zdCBhcmNoaXZlUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpICsgJy56aXAnKTtcclxuICAgIGNvbnN0IGVudHJpZXM6IHN0cmluZ1tdID0gYXdhaXQgZnMucmVhZGRpckFzeW5jKGRpclBhdGgpO1xyXG4gICAgYXdhaXQgc2V2ZW5aaXAuYWRkKGFyY2hpdmVQYXRoLCBlbnRyaWVzLm1hcChlbnRyeSA9PlxyXG4gICAgICBwYXRoLmpvaW4oZGlyUGF0aCwgZW50cnkpKSwgeyByYXc6IFsnLXInXSB9KTtcclxuXHJcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhhcmNoaXZlUGF0aCk7XHJcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhhcmNoaXZlUGF0aCk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFuVXBFbnRyaWVzKGZpbGVFbnRyaWVzOiBJRW50cnlbXSkge1xyXG4gIHRyeSB7XHJcbiAgICBmaWxlRW50cmllcy5zb3J0KChsaHMsIHJocykgPT4gcmhzLmZpbGVQYXRoLmxlbmd0aCAtIGxocy5maWxlUGF0aC5sZW5ndGgpO1xyXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWxlRW50cmllcykge1xyXG4gICAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhlbnRyeS5maWxlUGF0aCk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBsb2coJ2Vycm9yJywgJ2ZpbGUgZW50cnkgY2xlYW51cCBmYWlsZWQnLCBlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3RvcmVGaWxlRGF0YShmaWxlRGF0YTogQnVmZmVyLCBkZXN0aW5hdGlvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3Qgc2V2ZW5aaXAgPSBuZXcgdXRpbC5TZXZlblppcCgpO1xyXG4gIGxldCBhcmNoaXZlUGF0aDtcclxuICBsZXQgZmlsZUVudHJpZXM6IElFbnRyeVtdID0gW107XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMoVzNfVEVNUF9EQVRBX0RJUik7XHJcbiAgICBhcmNoaXZlUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpICsgJy56aXAnKTtcclxuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGFyY2hpdmVQYXRoLCBmaWxlRGF0YSk7XHJcbiAgICBjb25zdCB0YXJnZXREaXJQYXRoID0gcGF0aC5qb2luKFczX1RFTVBfREFUQV9ESVIsIHBhdGguYmFzZW5hbWUoYXJjaGl2ZVBhdGgsICcuemlwJykpO1xyXG4gICAgYXdhaXQgc2V2ZW5aaXAuZXh0cmFjdEZ1bGwoYXJjaGl2ZVBhdGgsIHRhcmdldERpclBhdGgpO1xyXG4gICAgZmlsZUVudHJpZXMgPSBhd2FpdCB3YWxrRGlyUGF0aCh0YXJnZXREaXJQYXRoKTtcclxuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZmlsZUVudHJpZXMpIHtcclxuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUodGFyZ2V0RGlyUGF0aCwgZW50cnkuZmlsZVBhdGgpO1xyXG4gICAgICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKGRlc3RpbmF0aW9uLCByZWxQYXRoKTtcclxuICAgICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUoZGVzdCkpO1xyXG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIGRlc3QpO1xyXG4gICAgfVxyXG4gICAgY2xlYW5VcEVudHJpZXMoZmlsZUVudHJpZXMpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY2xlYW5VcEVudHJpZXMoZmlsZUVudHJpZXMpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaGV4MkJ1ZmZlcihoZXhEYXRhOiBzdHJpbmcpIHtcclxuICBjb25zdCBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheShoZXhEYXRhLmxlbmd0aCAvIDIpO1xyXG4gIGZvciAobGV0IHggPSAwOyB4IDwgYnl0ZUFycmF5Lmxlbmd0aDsgeCsrKSB7XHJcbiAgICBieXRlQXJyYXlbeF0gPSBwYXJzZUludChoZXhEYXRhLnN1YnN0cih4ICogMiwgMiksIDE2KTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGJ5dGVBcnJheSk7XHJcbiAgcmV0dXJuIGJ1ZmZlcjtcclxufVxyXG4iXX0=