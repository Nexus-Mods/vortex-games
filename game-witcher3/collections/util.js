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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0RBQXdCO0FBQ3hCLHFDQUFtQztBQUNuQywwREFBOEM7QUFDOUMsMkNBQWtEO0FBRWxELHNDQUE0RDtBQUU1RCxNQUFhLHVCQUF3QixTQUFRLEtBQUs7SUFDaEQsWUFBWSxHQUFXO1FBQ3JCLEtBQUssQ0FBQyx5REFBeUQsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUN0RSxJQUFJLENBQUMsSUFBSSxHQUFHLHlCQUF5QixDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQUxELDBEQUtDO0FBRUQsTUFBYSxvQkFBcUIsU0FBUSxLQUFLO0lBQzdDLFlBQVksY0FBc0IsRUFBRSxHQUFXO1FBQzdDLEtBQUssQ0FBQyxxREFBcUQsY0FBYyxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDckYsSUFBSSxDQUFDLElBQUksR0FBRyx5QkFBeUIsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUFMRCxvREFLQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxHQUFlO0lBQ3hDLE9BQU8sQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLFlBQVksQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFGRCxnQ0FFQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLGFBQXlCLEVBQUUsR0FBZTtJQUMxRSxJQUFJLGFBQWEsQ0FBQyxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3JDLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3JDLGlCQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztBQUM5RCxDQUFDO0FBUEQsOENBT0M7QUFFRCxTQUFnQixzQkFB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Q0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDdkQ7SUFFRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3RDLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFSRCxnQ0FRQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgZ2VuZXJhdGUgfSBmcm9tICdzaG9ydGlkJztcclxuaW1wb3J0IHR1cmJvd2FsaywgeyBJRW50cnkgfSBmcm9tICd0dXJib3dhbGsnO1xyXG5pbXBvcnQgeyBmcywgbG9nLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xyXG5cclxuaW1wb3J0IHsgTE9DS0VEX1BSRUZJWCwgVzNfVEVNUF9EQVRBX0RJUiB9IGZyb20gJy4uL2NvbW1vbic7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbkdlbmVyYXRlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcbiAgY29uc3RydWN0b3Iod2h5OiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKGBGYWlsZWQgdG8gZ2VuZXJhdGUgZ2FtZSBzcGVjaWZpYyBkYXRhIGZvciBjb2xsZWN0aW9uOiAke3doeX1gKTtcclxuICAgIHRoaXMubmFtZSA9ICdDb2xsZWN0aW9uR2VuZXJhdGVFcnJvcic7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvblBhcnNlRXJyb3IgZXh0ZW5kcyBFcnJvciB7XHJcbiAgY29uc3RydWN0b3IoY29sbGVjdGlvbk5hbWU6IHN0cmluZywgd2h5OiBzdHJpbmcpIHtcclxuICAgIHN1cGVyKGBGYWlsZWQgdG8gcGFyc2UgZ2FtZSBzcGVjaWZpYyBkYXRhIGZvciBjb2xsZWN0aW9uICR7Y29sbGVjdGlvbk5hbWV9OiAke3doeX1gKTtcclxuICAgIHRoaXMubmFtZSA9ICdDb2xsZWN0aW9uR2VuZXJhdGVFcnJvcic7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZE1vZChtb2Q6IHR5cGVzLklNb2QpIHtcclxuICByZXR1cm4gKG1vZCAhPT0gdW5kZWZpbmVkKSAmJiAobW9kLnR5cGUgIT09ICdjb2xsZWN0aW9uJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc01vZEluQ29sbGVjdGlvbihjb2xsZWN0aW9uTW9kOiB0eXBlcy5JTW9kLCBtb2Q6IHR5cGVzLklNb2QpIHtcclxuICBpZiAoY29sbGVjdGlvbk1vZC5ydWxlcyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gY29sbGVjdGlvbk1vZC5ydWxlcy5maW5kKHJ1bGUgPT5cclxuICAgIHV0aWwudGVzdE1vZFJlZmVyZW5jZShtb2QsIHJ1bGUucmVmZXJlbmNlKSkgIT09IHVuZGVmaW5lZDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24/OiB0eXBlcy5JTW9kKTogdHlwZXMuTG9hZE9yZGVyIHtcclxuICBjb25zdCBzb3J0ZWRNb2RzID0gbG9hZE9yZGVyLmZpbHRlcihlbnRyeSA9PiB7XHJcbiAgICAgIGNvbnN0IGlzTG9ja2VkID0gZW50cnkubW9kSWQuaW5jbHVkZXMoTE9DS0VEX1BSRUZJWCk7XHJcbiAgICAgIHJldHVybiBpc0xvY2tlZCB8fCAoKGNvbGxlY3Rpb24gIT09IHVuZGVmaW5lZClcclxuICAgICAgICA/IGlzVmFsaWRNb2QobW9kc1tlbnRyeS5tb2RJZF0pICYmIChpc01vZEluQ29sbGVjdGlvbihjb2xsZWN0aW9uLCBtb2RzW2VudHJ5Lm1vZElkXSkpXHJcbiAgICAgICAgOiBpc1ZhbGlkTW9kKG1vZHNbZW50cnkubW9kSWRdKSk7XHJcbiAgICB9KVxyXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBsaHMuZGF0YS5wcmVmaXggLSByaHMuZGF0YS5wcmVmaXgpXHJcbiAgICAucmVkdWNlKChhY2N1bSwgaXRlciwgaWR4KSA9PiB7XHJcbiAgICAgIGFjY3VtLnB1c2goaXRlcik7XHJcbiAgICAgIHJldHVybiBhY2N1bTtcclxuICAgIH0sIFtdKTtcclxuICByZXR1cm4gc29ydGVkTW9kcztcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdhbGtEaXJQYXRoKGRpclBhdGg6IHN0cmluZyk6IFByb21pc2U8SUVudHJ5W10+IHtcclxuICBsZXQgZmlsZUVudHJpZXM6IElFbnRyeVtdID0gW107XHJcbiAgYXdhaXQgdHVyYm93YWxrKGRpclBhdGgsIChlbnRyaWVzOiBJRW50cnlbXSkgPT4ge1xyXG4gICAgZmlsZUVudHJpZXMgPSBmaWxlRW50cmllcy5jb25jYXQoZW50cmllcyk7XHJcbiAgfSlcclxuICAuY2F0Y2goeyBzeXN0ZW1Db2RlOiAzIH0sICgpID0+IFByb21pc2UucmVzb2x2ZSgpKVxyXG4gIC5jYXRjaChlcnIgPT4gWydFTk9URk9VTkQnLCAnRU5PRU5UJ10uaW5jbHVkZXMoZXJyLmNvZGUpXHJcbiAgICA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XHJcblxyXG4gIHJldHVybiBmaWxlRW50cmllcztcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGaWxlRGF0YShkaXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlcj4ge1xyXG4gIGNvbnN0IHNldmVuWmlwID0gbmV3IHV0aWwuU2V2ZW5aaXAoKTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhXM19URU1QX0RBVEFfRElSKTtcclxuICAgIGNvbnN0IGFyY2hpdmVQYXRoID0gcGF0aC5qb2luKFczX1RFTVBfREFUQV9ESVIsIGdlbmVyYXRlKCkgKyAnLnppcCcpO1xyXG4gICAgY29uc3QgZW50cmllczogc3RyaW5nW10gPSBhd2FpdCBmcy5yZWFkZGlyQXN5bmMoZGlyUGF0aCk7XHJcbiAgICBhd2FpdCBzZXZlblppcC5hZGQoYXJjaGl2ZVBhdGgsIGVudHJpZXMubWFwKGVudHJ5ID0+XHJcbiAgICAgIHBhdGguam9pbihkaXJQYXRoLCBlbnRyeSkpLCB7IHJhdzogWyctciddIH0pO1xyXG5cclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKGFyY2hpdmVQYXRoKTtcclxuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGFyY2hpdmVQYXRoKTtcclxuICAgIHJldHVybiBkYXRhO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xlYW5VcEVudHJpZXMoZmlsZUVudHJpZXM6IElFbnRyeVtdKSB7XHJcbiAgdHJ5IHtcclxuICAgIGZpbGVFbnRyaWVzLnNvcnQoKGxocywgcmhzKSA9PiByaHMuZmlsZVBhdGgubGVuZ3RoIC0gbGhzLmZpbGVQYXRoLmxlbmd0aCk7XHJcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGZpbGVFbnRyaWVzKSB7XHJcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGVudHJ5LmZpbGVQYXRoKTtcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGxvZygnZXJyb3InLCAnZmlsZSBlbnRyeSBjbGVhbnVwIGZhaWxlZCcsIGVycik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdG9yZUZpbGVEYXRhKGZpbGVEYXRhOiBCdWZmZXIsIGRlc3RpbmF0aW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBzZXZlblppcCA9IG5ldyB1dGlsLlNldmVuWmlwKCk7XHJcbiAgbGV0IGFyY2hpdmVQYXRoO1xyXG4gIGxldCBmaWxlRW50cmllczogSUVudHJ5W10gPSBbXTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhXM19URU1QX0RBVEFfRElSKTtcclxuICAgIGFyY2hpdmVQYXRoID0gcGF0aC5qb2luKFczX1RFTVBfREFUQV9ESVIsIGdlbmVyYXRlKCkgKyAnLnppcCcpO1xyXG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoYXJjaGl2ZVBhdGgsIGZpbGVEYXRhKTtcclxuICAgIGNvbnN0IHRhcmdldERpclBhdGggPSBwYXRoLmpvaW4oVzNfVEVNUF9EQVRBX0RJUiwgcGF0aC5iYXNlbmFtZShhcmNoaXZlUGF0aCwgJy56aXAnKSk7XHJcbiAgICBhd2FpdCBzZXZlblppcC5leHRyYWN0RnVsbChhcmNoaXZlUGF0aCwgdGFyZ2V0RGlyUGF0aCk7XHJcbiAgICBmaWxlRW50cmllcyA9IGF3YWl0IHdhbGtEaXJQYXRoKHRhcmdldERpclBhdGgpO1xyXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWxlRW50cmllcykge1xyXG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZSh0YXJnZXREaXJQYXRoLCBlbnRyeS5maWxlUGF0aCk7XHJcbiAgICAgIGNvbnN0IGRlc3QgPSBwYXRoLmpvaW4oZGVzdGluYXRpb24sIHJlbFBhdGgpO1xyXG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShkZXN0KSk7XHJcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhlbnRyeS5maWxlUGF0aCwgZGVzdCk7XHJcbiAgICB9XHJcbiAgICBjbGVhblVwRW50cmllcyhmaWxlRW50cmllcyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICBjbGVhblVwRW50cmllcyhmaWxlRW50cmllcyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBoZXgyQnVmZmVyKGhleERhdGE6IHN0cmluZykge1xyXG4gIGNvbnN0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGhleERhdGEubGVuZ3RoIC8gMik7XHJcbiAgZm9yIChsZXQgeCA9IDA7IHggPCBieXRlQXJyYXkubGVuZ3RoOyB4KyspIHtcclxuICAgIGJ5dGVBcnJheVt4XSA9IHBhcnNlSW50KGhleERhdGEuc3Vic3RyKHggKiAyLCAyKSwgMTYpO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmZyb20oYnl0ZUFycmF5KTtcclxuICByZXR1cm4gYnVmZmVyO1xyXG59XHJcbiJdfQ==