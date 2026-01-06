"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testTL = testTL;
exports.testDLC = testDLC;
const common_1 = require("./common");
const path_1 = __importDefault(require("path"));
const destHasRootDir = (instruction, dir) => {
    if (!(instruction === null || instruction === void 0 ? void 0 : instruction.destination)) {
        return false;
    }
    const segments = instruction.destination.split(path_1.default.sep);
    return segments[0].toLowerCase() === dir.toLowerCase();
};
function testTL(instructions) {
    const hasConfigMatrix = instructions.some(instr => !!instr.source
        && instr.source.indexOf(common_1.CONFIG_MATRIX_REL_PATH) !== -1);
    const hasSettingsConfig = instructions.some(instr => { var _a, _b, _c, _d; return (_d = (_c = (_b = (_a = instr === null || instr === void 0 ? void 0 : instr.source) === null || _a === void 0 ? void 0 : _a.toLowerCase) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.endsWith) === null || _d === void 0 ? void 0 : _d.call(_c, common_1.PART_SUFFIX); });
    if (hasConfigMatrix || hasSettingsConfig) {
        return Promise.resolve(false);
    }
    const hasModsDir = instructions.some(instr => destHasRootDir(instr, 'mods'));
    const hasBinDir = instructions.some(instr => destHasRootDir(instr, 'bin'));
    return Promise.resolve(hasModsDir || hasBinDir);
}
function testDLC(instructions) {
    return Promise.resolve(instructions.find(instruction => !!instruction.destination && instruction.destination.toLowerCase().startsWith('dlc' + path_1.default.sep)) !== undefined);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kVHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb2RUeXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQVlBLHdCQVlDO0FBRUQsMEJBR0M7QUE3QkQscUNBQStEO0FBQy9ELGdEQUF3QjtBQUd4QixNQUFNLGNBQWMsR0FBRyxDQUFDLFdBQStCLEVBQUUsR0FBVyxFQUFFLEVBQUU7SUFDdEUsSUFBSSxDQUFDLENBQUEsV0FBVyxhQUFYLFdBQVcsdUJBQVgsV0FBVyxDQUFFLFdBQVcsQ0FBQSxFQUFFLENBQUM7UUFDOUIsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBQ0QsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pELE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN6RCxDQUFDLENBQUE7QUFFRCxTQUFnQixNQUFNLENBQUMsWUFBa0M7SUFDdkQsTUFBTSxlQUFlLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTTtXQUM1RCxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQywrQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUQsTUFBTSxpQkFBaUIsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLHVCQUNsRCxPQUFBLE1BQUEsTUFBQSxNQUFBLE1BQUEsS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLE1BQU0sMENBQUUsV0FBVyxrREFBSSwwQ0FBRSxRQUFRLG1EQUFHLG9CQUFXLENBQUMsQ0FBQSxFQUFBLENBQUMsQ0FBQztJQUMzRCxJQUFJLGVBQWUsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1FBQ3pDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsTUFBTSxVQUFVLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3RSxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzNFLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVELFNBQWdCLE9BQU8sQ0FBQyxZQUFrQztJQUN4RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FDdEMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsSUFBSSxXQUFXLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsY0FBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUM7QUFDbkksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENPTkZJR19NQVRSSVhfUkVMX1BBVEgsIFBBUlRfU1VGRklYIH0gZnJvbSAnLi9jb21tb24nO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmNvbnN0IGRlc3RIYXNSb290RGlyID0gKGluc3RydWN0aW9uOiB0eXBlcy5JSW5zdHJ1Y3Rpb24sIGRpcjogc3RyaW5nKSA9PiB7XHJcbiAgaWYgKCFpbnN0cnVjdGlvbj8uZGVzdGluYXRpb24pIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbiAgY29uc3Qgc2VnbWVudHMgPSBpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbi5zcGxpdChwYXRoLnNlcCk7XHJcbiAgcmV0dXJuIHNlZ21lbnRzWzBdLnRvTG93ZXJDYXNlKCkgPT09IGRpci50b0xvd2VyQ2FzZSgpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGVzdFRMKGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcclxuICBjb25zdCBoYXNDb25maWdNYXRyaXggPSBpbnN0cnVjdGlvbnMuc29tZShpbnN0ciA9PiAhIWluc3RyLnNvdXJjZVxyXG4gICAgJiYgaW5zdHIuc291cmNlLmluZGV4T2YoQ09ORklHX01BVFJJWF9SRUxfUEFUSCkgIT09IC0xKTtcclxuICBjb25zdCBoYXNTZXR0aW5nc0NvbmZpZyA9IGluc3RydWN0aW9ucy5zb21lKGluc3RyID0+XHJcbiAgICBpbnN0cj8uc291cmNlPy50b0xvd2VyQ2FzZT8uKCk/LmVuZHNXaXRoPy4oUEFSVF9TVUZGSVgpKTtcclxuICBpZiAoaGFzQ29uZmlnTWF0cml4IHx8IGhhc1NldHRpbmdzQ29uZmlnKSB7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGhhc01vZHNEaXIgPSBpbnN0cnVjdGlvbnMuc29tZShpbnN0ciA9PiBkZXN0SGFzUm9vdERpcihpbnN0ciwgJ21vZHMnKSk7XHJcbiAgY29uc3QgaGFzQmluRGlyID0gaW5zdHJ1Y3Rpb25zLnNvbWUoaW5zdHIgPT4gZGVzdEhhc1Jvb3REaXIoaW5zdHIsICdiaW4nKSk7XHJcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShoYXNNb2RzRGlyIHx8IGhhc0JpbkRpcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0ZXN0RExDKGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcclxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RydWN0aW9ucy5maW5kKFxyXG4gICAgaW5zdHJ1Y3Rpb24gPT4gISFpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbiAmJiBpbnN0cnVjdGlvbi5kZXN0aW5hdGlvbi50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgoJ2RsYycgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWQpO1xyXG59Il19