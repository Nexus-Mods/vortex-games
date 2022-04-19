var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./ApplicationVersion", "./ApplicationVersionRange", "./ApplicationVersionType", "./DependentModule", "./DependentModuleMetadata", "./LoadType", "./ModuleInfo", "./ModuleInfoExtended", "./ModuleSorterOptions", "./SubModuleInfo", "./SubModuleInfoExtended", "./SubModuleTags"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require("./ApplicationVersion"), exports);
    __exportStar(require("./ApplicationVersionRange"), exports);
    __exportStar(require("./ApplicationVersionType"), exports);
    __exportStar(require("./DependentModule"), exports);
    __exportStar(require("./DependentModuleMetadata"), exports);
    __exportStar(require("./LoadType"), exports);
    __exportStar(require("./ModuleInfo"), exports);
    __exportStar(require("./ModuleInfoExtended"), exports);
    __exportStar(require("./ModuleSorterOptions"), exports);
    __exportStar(require("./SubModuleInfo"), exports);
    __exportStar(require("./SubModuleInfoExtended"), exports);
    __exportStar(require("./SubModuleTags"), exports);
});
//# sourceMappingURL=index.js.map