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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLHFDQUFtQztBQUNuQywwREFBOEM7QUFDOUMsMkNBQWtEO0FBR2xELHNDQUE0RDtBQUU1RCxNQUFhLHVCQUF3QixTQUFRLEtBQUs7SUFDaEQsWUFBWSxHQUFXO1FBQ3JCLEtBQUssQ0FBQyx5REFBeUQsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsSUFBSSxHQUFHLHlCQUF5QixDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQUxELDBEQUtDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxLQUFLO0lBQzdDLFlBQVksY0FBc0IsRUFBRSxHQUFXO1FBQzdDLEtBQUssQ0FBQyxxREFBcUQsY0FBYyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDckYsSUFBSSxDQUFDLElBQUksR0FBRyx5QkFBeUIsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUFMRCxvREFLQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxHQUFlO0lBQ3hDLE9BQU8sQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFGRCxnQ0FFQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLGFBQXlCLEVBQUUsR0FBZTtJQUMxRSxJQUFJLGFBQWEsQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3JDLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3JDLGlCQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztBQUM5RCxDQUFDO0FBUEQsOENBT0M7QUFFRCxTQUFnQixzQkFB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RSxDQUFDLEVBQUUsRUFBRTtRQUN6QyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUN2RDtJQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEMsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQVJELGdDQVFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBnZW5lcmF0ZSB9IGZyb20gJ3Nob3J0aWQnO1xuaW1wb3J0IHR1cmJvd2FsaywgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xuaW1wb3J0IHsgZnMsIGxvZywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IElMb2FkT3JkZXIsIElMb2FkT3JkZXJFbnRyeSB9IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQgeyBMT0NLRURfUFJFRklYLCBXM19URU1QX0RBVEFfRElSIH0gZnJvbSAnLi4vY29tbW9uJztcblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25HZW5lcmF0ZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih3aHk6IHN0cmluZykge1xuICAgIHN1cGVyKGBGYWlsZWQgdG8gZ2VuZXJhdGUgZ2FtZSBzcGVjaWZpYyBkYXRhIGZvciBjb2xsZWN0aW9uOiAke3doeX1gKTtcbiAgICB0aGlzLm5hbWUgPSAnQ29sbGVjdGlvbkdlbmVyYXRlRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uUGFyc2VFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoY29sbGVjdGlvbk5hbWU6IHN0cmluZywgd2h5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihgRmFpbGVkIHRvIHBhcnNlIGdhbWUgc3BlY2lmaWMgZGF0YSBmb3IgY29sbGVjdGlvbiAke2NvbGxlY3Rpb25OYW1lfTogJHt3aHl9YCk7XG4gICAgdGhpcy5uYW1lID0gJ0NvbGxlY3Rpb25HZW5lcmF0ZUVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZE1vZChtb2Q6IHR5cGVzLklNb2QpIHtcbiAgcmV0dXJuIChtb2QgIT09IHVuZGVmaW5lZCkgJiYgKG1vZC50eXBlICE9PSAnY29sbGVjdGlvbicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNNb2RJbkNvbGxlY3Rpb24oY29sbGVjdGlvbk1vZDogdHlwZXMuSU1vZCwgbW9kOiB0eXBlcy5JTW9kKSB7XG4gIGlmIChjb2xsZWN0aW9uTW9kLnJ1bGVzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gY29sbGVjdGlvbk1vZC5ydWxlcy5maW5kKHJ1bGUgPT5cbiAgICB1dGlsLnRlc3RNb2RSZWZlcmVuY2UobW9kLCBydWxlLnJlZmVyZW5jZSkpICE9PSB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlcjogeyBbbW9kSWQ6IHN0cmluZ106IElMb2FkT3JkZXJFbnRyeSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24/OiB0eXBlcy5JTW9kKTogSUxvYWRPcmRlciB7XG4gIGNvbnN0IHNvcnRlZE1vZHMgPSBPYmplY3Qua2V5cyhsb2FkT3JkZXIpXG4gICAgLmZpbHRlcihpZCA9PiB7XG4gICAgICBjb25zdCBpc0xvY2tlZCA9IGlkLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoTE9DS0VEX1BSRUZJWCk7XG4gICAgICByZXR1cm4gaXNMb2NrZWQgfHwgKChjb2xsZWN0aW9uICE9PSB1bmRlZmluZWQpXG4gICAgICAgID8gaXNWYWxpZE1vZChtb2RzW2lkXSkgJiYgKGlzTW9kSW5Db2xsZWN0aW9uKGNvbGxlY3Rpb24sIG1vZHNbaWRdKSlcbiAgICAgICAgOiBpc1ZhbGlkTW9kKG1vZHNbaWRdKSk7XG4gICAgfSlcbiAgICAuc29ydCgobGhzLCByaHMpID0+IGxvYWRPcmRlcltsaHNdLnBvcyAtIGxvYWRPcmRlcltyaHNdLnBvcylcbiAgICAucmVkdWNlKChhY2N1bSwgaXRlciwgaWR4KSA9PiB7XG4gICAgICBhY2N1bVtpdGVyXSA9IHtcbiAgICAgICAgLi4ubG9hZE9yZGVyW2l0ZXJdLFxuICAgICAgICBwb3M6IGlkeCxcbiAgICAgIH07XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfSwge30pO1xuICByZXR1cm4gc29ydGVkTW9kcztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhbGtEaXJQYXRoKGRpclBhdGg6IHN0cmluZyk6IFByb21pc2U8SUVudHJ5W10+IHtcbiAgbGV0IGZpbGVFbnRyaWVzOiBJRW50cnlbXSA9IFtdO1xuICBhd2FpdCB0dXJib3dhbGsoZGlyUGF0aCwgKGVudHJpZXM6IElFbnRyeVtdKSA9PiB7XG4gICAgZmlsZUVudHJpZXMgPSBmaWxlRW50cmllcy5jb25jYXQoZW50cmllcyk7XG4gIH0pXG4gIC5jYXRjaCh7IHN5c3RlbUNvZGU6IDMgfSwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKCkpXG4gIC5jYXRjaChlcnIgPT4gWydFTk9URk9VTkQnLCAnRU5PRU5UJ10uaW5jbHVkZXMoZXJyLmNvZGUpXG4gICAgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpO1xuXG4gIHJldHVybiBmaWxlRW50cmllcztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGaWxlRGF0YShkaXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlcj4ge1xuICBjb25zdCBzZXZlblppcCA9IG5ldyB1dGlsLlNldmVuWmlwKCk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhXM19URU1QX0RBVEFfRElSKTtcbiAgICBjb25zdCBhcmNoaXZlUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpICsgJy56aXAnKTtcbiAgICBjb25zdCBlbnRyaWVzOiBzdHJpbmdbXSA9IGF3YWl0IGZzLnJlYWRkaXJBc3luYyhkaXJQYXRoKTtcbiAgICBhd2FpdCBzZXZlblppcC5hZGQoYXJjaGl2ZVBhdGgsIGVudHJpZXMubWFwKGVudHJ5ID0+XG4gICAgICBwYXRoLmpvaW4oZGlyUGF0aCwgZW50cnkpKSwgeyByYXc6IFsnLXInXSB9KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGFyY2hpdmVQYXRoKTtcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhhcmNoaXZlUGF0aCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhblVwRW50cmllcyhmaWxlRW50cmllczogSUVudHJ5W10pIHtcbiAgdHJ5IHtcbiAgICBmaWxlRW50cmllcy5zb3J0KChsaHMsIHJocykgPT4gcmhzLmZpbGVQYXRoLmxlbmd0aCAtIGxocy5maWxlUGF0aC5sZW5ndGgpO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZmlsZUVudHJpZXMpIHtcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGVudHJ5LmZpbGVQYXRoKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZygnZXJyb3InLCAnZmlsZSBlbnRyeSBjbGVhbnVwIGZhaWxlZCcsIGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlc3RvcmVGaWxlRGF0YShmaWxlRGF0YTogQnVmZmVyLCBkZXN0aW5hdGlvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHNldmVuWmlwID0gbmV3IHV0aWwuU2V2ZW5aaXAoKTtcbiAgbGV0IGFyY2hpdmVQYXRoO1xuICBsZXQgZmlsZUVudHJpZXM6IElFbnRyeVtdID0gW107XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhXM19URU1QX0RBVEFfRElSKTtcbiAgICBhcmNoaXZlUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBnZW5lcmF0ZSgpICsgJy56aXAnKTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhhcmNoaXZlUGF0aCwgZmlsZURhdGEpO1xuICAgIGNvbnN0IHRhcmdldERpclBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgcGF0aC5iYXNlbmFtZShhcmNoaXZlUGF0aCwgJy56aXAnKSk7XG4gICAgYXdhaXQgc2V2ZW5aaXAuZXh0cmFjdEZ1bGwoYXJjaGl2ZVBhdGgsIHRhcmdldERpclBhdGgpO1xuICAgIGZpbGVFbnRyaWVzID0gYXdhaXQgd2Fsa0RpclBhdGgodGFyZ2V0RGlyUGF0aCk7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWxlRW50cmllcykge1xuICAgICAgY29uc3QgcmVsUGF0aCA9IHBhdGgucmVsYXRpdmUodGFyZ2V0RGlyUGF0aCwgZW50cnkuZmlsZVBhdGgpO1xuICAgICAgY29uc3QgZGVzdCA9IHBhdGguam9pbihkZXN0aW5hdGlvbiwgcmVsUGF0aCk7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShkZXN0KSk7XG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoZW50cnkuZmlsZVBhdGgsIGRlc3QpO1xuICAgIH1cbiAgICBjbGVhblVwRW50cmllcyhmaWxlRW50cmllcyk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjbGVhblVwRW50cmllcyhmaWxlRW50cmllcyk7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhleDJCdWZmZXIoaGV4RGF0YTogc3RyaW5nKSB7XG4gIGNvbnN0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGhleERhdGEubGVuZ3RoIC8gMik7XG4gIGZvciAobGV0IHggPSAwOyB4IDwgYnl0ZUFycmF5Lmxlbmd0aDsgeCsrKSB7XG4gICAgYnl0ZUFycmF5W3hdID0gcGFyc2VJbnQoaGV4RGF0YS5zdWJzdHIoeCAqIDIsIDIpLCAxNik7XG4gIH1cblxuICBjb25zdCBidWZmZXIgPSBCdWZmZXIuZnJvbShieXRlQXJyYXkpO1xuICByZXR1cm4gYnVmZmVyO1xufVxuIl19