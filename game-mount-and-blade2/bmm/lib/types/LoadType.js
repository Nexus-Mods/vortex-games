(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoadType = void 0;
    var LoadType;
    (function (LoadType) {
        LoadType[LoadType["None"] = 0] = "None";
        LoadType[LoadType["LoadAfterThis"] = 1] = "LoadAfterThis";
        LoadType[LoadType["LoadBeforeThis"] = 2] = "LoadBeforeThis";
    })(LoadType = exports.LoadType || (exports.LoadType = {}));
});
//# sourceMappingURL=LoadType.js.map