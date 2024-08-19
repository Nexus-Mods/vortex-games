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
exports.testPlugAndPlayModType = void 0;
const path_1 = __importDefault(require("path"));
const common_1 = require("./common");
function testPlugAndPlayModType(instr) {
    return __awaiter(this, void 0, void 0, function* () {
        const modInfo = instr.find(instr => instr.type === 'copy' && path_1.default.basename(instr.source).toLowerCase() === common_1.MOD_INFO_JSON_FILE);
        return modInfo !== undefined;
    });
}
exports.testPlugAndPlayModType = testPlugAndPlayModType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kVHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb2RUeXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBd0I7QUFFeEIscUNBQThDO0FBRTlDLFNBQXNCLHNCQUFzQixDQUFDLEtBQTJCOztRQUN0RSxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksY0FBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxFQUFFLEtBQUssMkJBQWtCLENBQUMsQ0FBQztRQUMvSCxPQUFPLE9BQU8sS0FBSyxTQUFTLENBQUM7SUFDL0IsQ0FBQztDQUFBO0FBSEQsd0RBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgTU9EX0lORk9fSlNPTl9GSUxFIH0gZnJvbSAnLi9jb21tb24nO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRlc3RQbHVnQW5kUGxheU1vZFR5cGUoaW5zdHI6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XHJcbiAgY29uc3QgbW9kSW5mbyA9IGluc3RyLmZpbmQoaW5zdHIgPT4gaW5zdHIudHlwZSA9PT0gJ2NvcHknICYmIHBhdGguYmFzZW5hbWUoaW5zdHIuc291cmNlKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfSU5GT19KU09OX0ZJTEUpO1xyXG4gIHJldHVybiBtb2RJbmZvICE9PSB1bmRlZmluZWQ7XHJcbn0iXX0=