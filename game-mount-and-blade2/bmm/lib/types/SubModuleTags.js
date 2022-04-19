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
    exports.SubModuleTags = void 0;
    var SubModuleTags;
    (function (SubModuleTags) {
        SubModuleTags[SubModuleTags["RejectedPlatform"] = 0] = "RejectedPlatform";
        SubModuleTags[SubModuleTags["ExclusivePlatform"] = 1] = "ExclusivePlatform";
        SubModuleTags[SubModuleTags["DedicatedServerType"] = 2] = "DedicatedServerType";
        SubModuleTags[SubModuleTags["IsNoRenderModeElement"] = 3] = "IsNoRenderModeElement";
        SubModuleTags[SubModuleTags["DependantRuntimeLibrary"] = 4] = "DependantRuntimeLibrary";
    })(SubModuleTags = exports.SubModuleTags || (exports.SubModuleTags = {}));
});
//# sourceMappingURL=SubModuleTags.js.map