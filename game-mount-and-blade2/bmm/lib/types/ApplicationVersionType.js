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
    exports.ApplicationVersionType = void 0;
    var ApplicationVersionType;
    (function (ApplicationVersionType) {
        ApplicationVersionType[ApplicationVersionType["Alpha"] = 0] = "Alpha";
        ApplicationVersionType[ApplicationVersionType["Beta"] = 1] = "Beta";
        ApplicationVersionType[ApplicationVersionType["EarlyAccess"] = 2] = "EarlyAccess";
        ApplicationVersionType[ApplicationVersionType["Release"] = 3] = "Release";
        ApplicationVersionType[ApplicationVersionType["Development"] = 4] = "Development";
        ApplicationVersionType[ApplicationVersionType["Invalid"] = 5] = "Invalid";
    })(ApplicationVersionType = exports.ApplicationVersionType || (exports.ApplicationVersionType = {}));
});
//# sourceMappingURL=ApplicationVersionType.js.map